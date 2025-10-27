from ninja import Router
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from scans.models import Scan
from users.models import Team, Membership
from .schemas import ScanCreateIn, ScanCreateOut, ScanOut, ScanListOut, OverviewOut, TimeseriesOut, CategoryListOut
from .tasks import initiate_scan
from ninja.pagination import paginate, PageNumberPagination
from ninja_jwt.authentication import JWTAuth
import json
from ninja.errors import HttpError
from django.db.models import Count
from django.db.models.functions import TruncDate
from datetime import timedelta, date
from urllib.parse import urlparse
from collections import Counter

User = get_user_model()
router = Router(tags=["scan"])

@router.post("/teams/{team_id}/scans/initiate", response=ScanCreateOut, auth=JWTAuth())
def initiate_scan_endpoint(request, team_id: str, payload: ScanCreateIn):
    team = get_object_or_404(Team, id=team_id)

    if not Membership.objects.filter(user=request.user, team=team).exists():
        return {"status": "error", "message": "Not authorized for this team"}, 403

    scan = Scan.objects.create(
        team=team,
        requested_by=request.user,
        url=payload.url,
        status="processing"
    )

    initiate_scan.delay(str(scan.id))

    return {
        "scan_id": str(scan.id),
        "team_id": str(team.id),
        "url": payload.url,
        "status": scan.status,
    }

@router.post("/teams/{team_id}/scans/{scan_id}/complete", auth=None)
def complete_scan_endpoint(request, team_id: str, scan_id: str):
    try:
        if hasattr(request, "json"):
            payload = request.json()
        else:
            body = request.body.decode("utf-8") if request.body else "{}"
            payload = json.loads(body)

        if not isinstance(payload, dict):
            raise HttpError(400, "Body must be a JSON object")
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(400, f"Invalid JSON: {e}")

    team = get_object_or_404(Team, id=team_id)
    scan = get_object_or_404(Scan, id=scan_id, team=team)

    scan.final_url = payload.get("url")
    scan.title = payload.get("title")
    scan.h1 = payload.get("h1")
    scan.screenshot = payload.get("screenshot")
    scan.full_code = payload.get("full_code")

    http_meta      = payload.get("http_meta") or {}
    requests_list  = payload.get("requests") or []
    responses_list = payload.get("responses") or []
    links_list     = payload.get("links") or []
    scripts_list   = payload.get("scripts") or []
    downloads_list = payload.get("downloads") or []
    scan.ssl_info  = payload.get("ssl_info") or {}

    if isinstance(responses_list, list):
        for r in responses_list:
            if isinstance(r, dict) and "ok" in r:
                r["ok"] = bool(r["ok"])

    scan.http_meta = http_meta
    scan.requests = requests_list
    scan.responses = responses_list
    scan.links = links_list
    scan.scripts = scripts_list
    scan.downloads = downloads_list

    scan.status = payload.get("status", "complete")
    scan.save()

    return {"status": "updated", "scan_id": str(scan.id), "team_id": str(team.id)}

@router.get("/teams/{team_id}/scans/{scan_id}", response=ScanOut, auth=JWTAuth())
def get_scan(request, team_id: str, scan_id: str):
    scan = get_object_or_404(Scan, id=scan_id, team_id=team_id)
    return ScanOut.from_orm(scan)

@router.get("/teams/{team_id}/scans", response=list[ScanListOut], auth=JWTAuth())
@paginate(PageNumberPagination)
def list_scans(request, team_id: str):
    qs = Scan.objects.filter(team_id=team_id, status="complete").order_by("-created_at")
    return [ScanListOut.from_orm(scan) for scan in qs]

def _user_in_team(user, team) -> bool:
    return Membership.objects.filter(user=user, team=team).exists()

def _datapoints_count(scan: Scan) -> int:
    return sum([
        len(scan.requests or []),
        len(scan.responses or []),
        len(scan.links or []),
        len(scan.downloads or []),
    ])

@router.get("/teams/{team_id}/analytics/overview", response=OverviewOut, auth=JWTAuth())
def scans_overview(request, team_id: str):
    team = get_object_or_404(Team, id=team_id)
    if not _user_in_team(request.user, team):
        return 403, {"detail": "Not authorized"}

    today = date.today()
    yesterday = today - timedelta(days=1)
    last_week_start = today - timedelta(days=7)
    prev_week_start  = last_week_start - timedelta(days=7)

    qs_all = Scan.objects.filter(team=team)
    qs_complete = qs_all.filter(status="complete")

    total_scans = qs_all.count()

    durations = [s.duration_seconds() for s in qs_complete if s.duration_seconds() is not None]
    avg_duration_seconds = (sum(durations) / len(durations)) if durations else 0.0

    total_datapoints = 0
    for s in qs_all:
        total_datapoints += _datapoints_count(s)

    completed = qs_complete.count()
    success_rate_pct = (completed / total_scans * 100.0) if total_scans else 0.0

    today_count = qs_all.filter(created_at__date=today).count()
    yesterday_count = qs_all.filter(created_at__date=yesterday).count()
    dod_delta = _pct_delta(today_count, yesterday_count)

    last_week_count = qs_all.filter(created_at__date__gte=last_week_start, created_at__date__lte=today).count()
    prev_week_count = qs_all.filter(created_at__date__gte=prev_week_start, created_at__date__lt=last_week_start).count()
    wow_delta = _pct_delta(last_week_count, prev_week_count)

    return {
        "total_scans": total_scans,
        "avg_duration_seconds": avg_duration_seconds,
        "total_datapoints": total_datapoints,
        "success_rate_pct": success_rate_pct,
        "day_over_day": {
            "current": float(today_count),
            "previous": float(yesterday_count),
            "delta_pct": dod_delta,
        },
        "week_over_week": {
            "current": float(last_week_count),
            "previous": float(prev_week_count),
            "delta_pct": wow_delta,
        },
    }

def _pct_delta(current: int | float, previous: int | float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100.0

@router.get("/teams/{team_id}/analytics/timeseries", response=TimeseriesOut, auth=JWTAuth())
def scans_timeseries(request, team_id: str, window_days: int = 30):
    team = get_object_or_404(Team, id=team_id)
    if not _user_in_team(request.user, team):
        return 403, {"detail": "Not authorized"}

    start_date = date.today() - timedelta(days=window_days - 1)

    qs = (Scan.objects.filter(team=team, created_at__date__gte=start_date)
          .annotate(day=TruncDate("created_at"))
          .values("day")
          .annotate(count=Count("id"))
          .order_by("day"))

    scans_by_day = {}
    for row in qs:
        scans_by_day[row["day"]] = row["count"]

    points = []
    for i in range(window_days):
        d = start_date + timedelta(days=i)
        scans_today = Scan.objects.filter(team=team, created_at__date=d)
        count = scans_by_day.get(d, 0)
        durations = [s.duration_seconds() for s in scans_today.filter(status="complete") if s.duration_seconds() is not None]
        avg_dur = (sum(durations) / len(durations)) if durations else 0.0
        total_data = sum(_datapoints_count(s) for s in scans_today)
        points.append({
            "date": d.isoformat(),
            "count": count,
            "avg_duration_seconds": avg_dur,
            "total_datapoints": total_data,
        })

    return {"points": points}

@router.get("/teams/{team_id}/analytics/status", response=CategoryListOut, auth=JWTAuth())
def scans_by_status(request, team_id: str):
    team = get_object_or_404(Team, id=team_id)
    if not _user_in_team(request.user, team):
        return 403, {"detail": "Not authorized"}

    qs = Scan.objects.filter(team=team).values("status").annotate(count=Count("id"))
    items = [{"name": row["status"], "count": row["count"]} for row in qs]
    return {"items": items}

@router.get("/teams/{team_id}/analytics/top-domains", response=CategoryListOut, auth=JWTAuth())
def scans_top_domains(request, team_id: str, limit: int = 10):
    team = get_object_or_404(Team, id=team_id)
    if not _user_in_team(request.user, team):
        return 403, {"detail": "Not authorized"}

    domains = []
    for s in Scan.objects.filter(team=team):
        raw = s.final_url or s.url
        try:
            host = urlparse(raw).hostname
            if host:
                domains.append(host.lower())
        except Exception:
            pass
    counts = Counter(domains).most_common(limit)
    items = [{"name": name, "count": count} for name, count in counts]
    return {"items": items}