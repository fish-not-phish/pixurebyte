import { apiFetch } from "@/lib/api"
import type { OverviewOut, TimeseriesOut, CategoryListOut } from "@/types/analytics"

export async function fetchOverview(teamId: string): Promise<OverviewOut> {
  return apiFetch(`/scans/teams/${teamId}/analytics/overview`, { method: "GET" })
}

export async function fetchTimeseries(teamId: string, windowDays = 30): Promise<TimeseriesOut> {
  return apiFetch(`/scans/teams/${teamId}/analytics/timeseries?window_days=${windowDays}`, { method: "GET" })
}

export async function fetchStatusBreakdown(teamId: string): Promise<CategoryListOut> {
  return apiFetch(`/scans/teams/${teamId}/analytics/status`, { method: "GET" })
}

export async function fetchTopDomains(teamId: string, limit = 10): Promise<CategoryListOut> {
  return apiFetch(`/scans/teams/${teamId}/analytics/top-domains?limit=${limit}`, { method: "GET" })
}