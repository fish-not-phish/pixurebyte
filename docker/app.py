import boto3, os, hashlib, requests
from pathlib import Path
from scrapling.fetchers import StealthySession
import socket, ssl
from datetime import datetime
import subprocess

s3 = boto3.client("s3")

BUCKET = os.environ.get("SCAN_BUCKET", "")
DJANGO_BACKEND = os.environ.get("DJANGO_BACKEND", "")

DJANGO_BACKEND = f"https://{DJANGO_BACKEND}"

DOWNLOAD_DIR = "/tmp/downloads"
Path(DOWNLOAD_DIR).mkdir(exist_ok=True)


def sha256sum(file_path: str) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def get_ssl_cert_details(url: str):
    try:
        hostname = url.split("//")[-1].split("/")[0]
        port = 443

        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=8) as sock:
            ip_address = sock.getpeername()[0]  # <-- get the resolved IP
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

        issuer = dict(x[0] for x in cert.get("issuer", []))
        subject = dict(x[0] for x in cert.get("subject", []))
        san = [v for t, v in cert.get("subjectAltName", []) if t == "DNS"]

        valid_from = datetime.strptime(cert["notBefore"], "%b %d %H:%M:%S %Y %Z")
        valid_to = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")

        return {
            "subject": subject,
            "issuer": issuer,
            "san": san,
            "valid_from": valid_from.isoformat(),
            "valid_to": valid_to.isoformat(),
            "server_ip": ip_address,
            "server_port": port,
        }
    except Exception as e:
        return {"error": str(e)}


def upload_to_s3(local_path: str, key: str, content_type: str | None = None) -> str:
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    s3.upload_file(local_path, BUCKET, key, ExtraArgs=extra_args)
    os.remove(local_path)
    return key

def zip_with_password(file_path: str, password: str = "pb-infected") -> str:
    zip_path = f"{file_path}.zip"
    try:
        cmd = [
            "7z", "a",
            "-tzip",
            zip_path,
            file_path,
            f"-p{password}",
            "-mhe=on",
            "-y"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return zip_path
    except subprocess.CalledProcessError as e:
        print(f"[ZIP] 7z failed: {e.stderr.decode() if e.stderr else e}")
        raise RuntimeError("7z compression failed")
    except FileNotFoundError:
        raise RuntimeError("7z not installed or not in PATH")

def run_scan(scan_id: str, team_id: str, url: str):
    collected_requests, collected_responses = [], []
    downloads = []
    result_data = {}
    response = None
    error_message = None
    status = "failed"

    def handle_response(res):
        details = res.security_details()
        addr = res.server_addr()
        collected_responses.append({
            "url": res.url,
            "status": res.status,
            "ok": res.ok,
            "protocol": details.get("protocol") if details else None,
            "issuer": details.get("issuer") if details else None,
            "subject": details.get("subjectName") if details else None,
            "valid_from": details.get("validFrom") if details else None,
            "valid_to": details.get("validTo") if details else None,
            "server_ip": addr.get("ipAddress") if addr else None,
            "server_port": addr.get("port") if addr else None,
        })

    def automation(page):
        nonlocal result_data

        page.on("request", lambda req: collected_requests.append({
            "url": req.url, "method": req.method
        }))
        page.on("response", handle_response)

        def handle_download(download):
            path = Path(DOWNLOAD_DIR) / download.suggested_filename
            download.save_as(str(path))

            sha = sha256sum(path)

            zip_path = zip_with_password(str(path))
            zip_key = f"teams/{team_id}/scans/{scan_id}/downloads/{download.suggested_filename}.zip"
            upload_to_s3(zip_path, zip_key, content_type="application/zip")

            downloads.append({
                "filename": download.suggested_filename,
                "sha256": sha,
                "zip_key": zip_key,
                "note": "Zipped with password 'infected' for safe handling"
            })

            os.remove(path)

        page.on("download", handle_download)

        screenshot_path = "/tmp/screenshot.png"
        page.screenshot(path=screenshot_path, full_page=True)
        screenshot_key = f"teams/{team_id}/scans/{scan_id}/screenshot.png"
        upload_to_s3(screenshot_path, screenshot_key, content_type="image/png")

        html_path = f"/tmp/{scan_id}.html"
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(page.content())
        html_key = f"teams/{team_id}/scans/{scan_id}/page.html"
        upload_to_s3(html_path, html_key, content_type="text/plain")

        title = page.title()
        h1 = page.query_selector("h1").inner_text() if page.query_selector("h1") else None

        result_data = {
            "screenshot": screenshot_key,
            "full_code": html_key,
            "title": title,
            "h1": h1,
        }

    try:
        with StealthySession(headless=True, solve_cloudflare=True) as session:
            response = session.fetch(
                url,
                google_search=True,
                page_action=automation,
                load_dom=True
            )

            status = "complete"
    except Exception as e:
        error_message = str(e)
        print(f"[SCAN] Initial fetch failed: {error_message}")

        if "No Cloudflare challenge found" in error_message:
            print("[SCAN] Retrying with solve_cloudflare=False...")
            try:
                with StealthySession(headless=True, solve_cloudflare=False) as session:
                    response = session.fetch(
                        url,
                        google_search=True,
                        page_action=automation,
                        load_dom=True
                    )
                    status = "complete"
                    error_message = None
            except Exception as e2:
                error_message = str(e2)
                status = "failed"
                print(f"[SCAN] Retry failed: {error_message}")
        else:
            status = "failed"

    scripts = []
    for script in response.css('script[src]'):
        if not script:
            continue
        scripts.append(str(script))

    links = []
    for link in response.css('a::attr(href)'):
        if not link:
            continue

        if link.startswith('#'):
            continue
        
        if link.startswith("/"):
            abs_href = response.url.rstrip("/") + link
        else:
            abs_href = link

        links.append(abs_href)

    http_meta = {
        "status": response.status,
        "reason": response.reason,
        "cookies": response.cookies,
        "headers": response.headers,
        "request_headers": response.request_headers,
        "history": response.history,
        "encoding": response.encoding,
    }

    ssl_info = get_ssl_cert_details(url)

    result = {
        "url": url,
        "status": status,
        **result_data,
        "http_meta": http_meta,
        "requests": collected_requests,
        "responses": collected_responses,
        "downloads": downloads,
        "links": links,
        "scripts": scripts,
        "ssl_info": ssl_info,
    }

    webhook_url = f"{DJANGO_BACKEND}/api/scans/teams/{team_id}/scans/{scan_id}/complete"
    try:
        resp = requests.post(webhook_url, json=result, timeout=30)
        resp.raise_for_status()
        print(f"[SCAN] Posted results to {webhook_url}, status={resp.status_code}")
    except Exception as e:
        print(f"[SCAN] Failed to send results back: {e}")

    return {"status": "success", "scan_id": scan_id, "team_id": team_id}


if __name__ == "__main__":
    scan_id = os.environ["scan_id"]
    team_id = os.environ["team_id"]
    url = os.environ["url"]
    run_scan(scan_id, team_id, url)
