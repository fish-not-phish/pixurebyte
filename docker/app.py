import boto3, os, hashlib, requests, zipfile
from pathlib import Path
from scrapling.fetchers import StealthySession

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


def upload_to_s3(local_path: str, key: str, content_type: str | None = None) -> str:
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    s3.upload_file(local_path, BUCKET, key, ExtraArgs=extra_args)
    os.remove(local_path)
    return key


def zip_with_password(file_path: str, password: str = "infected") -> str:
    zip_path = f"{file_path}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.setpassword(password.encode())
        zf.write(file_path, arcname=os.path.basename(file_path))
    return zip_path


def run_scan(scan_id: str, team_id: str, url: str):
    collected_requests, collected_responses = [], []
    downloads = []
    result_data = {}

    def automation(page):
        nonlocal result_data

        page.on("request", lambda req: collected_requests.append({
            "url": req.url, "method": req.method
        }))
        page.on("response", lambda res: collected_responses.append({
            "url": res.url, "status": res.status, "ok": res.ok
        }))

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

    with StealthySession(headless=True, solve_cloudflare=True) as session:
        response = session.fetch(
            url,
            google_search=True,
            page_action=automation,
            load_dom=True
        )

    http_meta = {
        "status": response.status,
        "reason": response.reason,
        "cookies": response.cookies,
        "headers": response.headers,
        "request_headers": response.request_headers,
        "history": response.history,
        "encoding": response.encoding,
    }

    result = {
        "url": url,
        **result_data,
        "http_meta": http_meta,
        "requests": collected_requests,
        "responses": collected_responses,
        "downloads": downloads,
        "links": [],
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
