export type OverviewDelta = {
  current: number
  previous: number
  delta_pct: number
}

export type OverviewOut = {
  total_scans: number
  avg_duration_seconds: number
  total_datapoints: number
  success_rate_pct: number
  day_over_day: OverviewDelta
  week_over_week: OverviewDelta
}

export type TimeseriesPoint = {
  date: string
  count: number
  avg_duration_seconds: number
  total_datapoints: number
}

export type TimeseriesOut = {
  points: TimeseriesPoint[]
}

export type CategoryCount = {
  name: string
  count: number
}

export type CategoryListOut = {
  items: CategoryCount[]
}

export type ScanDownload = {
  filename: string;
  sha256: string;
  zip_key?: string | null;
}

export type ScanRequest = {
  method: string;
  url: string;
}

export type ScanResponse = {
  status: number;
  ok: boolean;
  url: string;
}
