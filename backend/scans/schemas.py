from ninja import Schema
import os
from .models import Scan
from typing import List

CLOUDFRONT_DOMAIN = os.environ.get("CLOUDFRONT_DOMAIN", "")

CLOUDFRONT_DOMAIN = f'https://{CLOUDFRONT_DOMAIN}'

class ScanCreateIn(Schema):
    url: str

class ScanCreateOut(Schema):
    scan_id: str
    team_id: str
    url: str
    status: str

class ScanOut(Schema):
    scan_id: str
    team_id: str
    url: str
    status: str
    screenshot: str | None = None
    full_code: str | None = None
    title: str | None = None
    h1: str | None = None
    created_at: str
    last_updated: str
    downloads: list[dict] = []
    requests: list[dict] = []
    responses: list[dict] = []

    @staticmethod
    def from_orm(scan):
        return ScanOut(
            scan_id=str(scan.id),
            team_id=str(scan.team.id),
            url=scan.url,
            status=scan.status,
            screenshot=f"{CLOUDFRONT_DOMAIN}/{scan.screenshot}" if scan.screenshot else None,
            full_code=f"{CLOUDFRONT_DOMAIN}/{scan.full_code}" if scan.full_code else None,
            title=scan.title,
            h1=scan.h1,
            created_at=scan.created_at.isoformat(),
            last_updated=scan.last_updated.isoformat(),
            downloads=scan.downloads or [],
            requests=scan.requests or [],
            responses=scan.responses or [],
        )
    
class ScanListOut(Schema):
    scan_id: str
    url: str
    title: str | None
    h1: str | None
    status: str
    created_at: str
    last_updated: str
    requested_by: str | None = None

    @staticmethod
    def from_orm(scan: Scan):
        return ScanListOut(
            scan_id=str(scan.id),
            url=scan.url,
            title=getattr(scan, "title", None),
            h1=getattr(scan, "h1", None),
            status=scan.status,
            created_at=scan.created_at.isoformat(),
            last_updated=scan.last_updated.isoformat(),
            requested_by=scan.requested_by.email if scan.requested_by else None,
        )
    
class OverviewDelta(Schema):
    current: float
    previous: float
    delta_pct: float

class OverviewOut(Schema):
    total_scans: int
    avg_duration_seconds: float
    total_datapoints: int
    success_rate_pct: float
    day_over_day: OverviewDelta
    week_over_week: OverviewDelta

class TimeseriesPoint(Schema):
    date: str
    count: int
    avg_duration_seconds: float
    total_datapoints: int

class TimeseriesOut(Schema):
    points: List[TimeseriesPoint]

class CategoryCount(Schema):
    name: str
    count: int

class CategoryListOut(Schema):
    items: List[CategoryCount]