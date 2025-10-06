"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import {
  fetchOverview,
  fetchTimeseries,
  fetchStatusBreakdown,
  fetchTopDomains,
} from "@/services/analytics"
import type {
  OverviewOut,
  TimeseriesPoint,
  CategoryListOut,
} from "@/types/analytics"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts"

function formatSeconds(s: number) {
  if (!s) return "0s"
  if (s < 60) return `${Math.round(s)}s`
  const m = Math.floor(s / 60)
  const r = Math.round(s % 60)
  return `${m}m ${r}s`
}


const CHART_COLORS = {
  primary: "#8b5cf6",
  primaryLight: "#a78bfa",
  primaryDark: "#7c3aed",
  accent: "#c4b5fd",
  grid: "rgba(139, 92, 246, 0.15)",
}

function DeltaPill({ pct }: { pct: number }) {
  const positive = pct >= 0
  const color = positive ? "bg-violet-500/10 text-violet-600 dark:text-violet-300" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
  const arrow = positive ? "▲" : "▼"

  return (
    <div
      className={`flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all border border-transparent hover:border-violet-500/30 ${color}`}
    >
      <span className="mr-1 text-[10px] opacity-80">{arrow}</span>
      {Math.abs(pct).toFixed(1)}%
    </div>
  )
}

function StatCard({
  title,
  value,
  hint,
  delta,
}: {
  title: string
  value: string
  hint?: string
  delta?: number
}) {
  return (
    <Card className="border-violet-100 dark:border-violet-900/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {typeof delta === "number" && <DeltaPill pct={delta} />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export default function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)

  const [overview, setOverview] = useState<OverviewOut | null>(null)
  const [series, setSeries] = useState<TimeseriesPoint[]>([])
  const [status, setStatus] = useState<CategoryListOut | null>(null)
  const [domains, setDomains] = useState<CategoryListOut | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [ov, ts, st, td] = await Promise.all([
          fetchOverview(teamId),
          fetchTimeseries(teamId, 30),
          fetchStatusBreakdown(teamId),
          fetchTopDomains(teamId, 8),
        ])
        if (!mounted) return
        setOverview(ov)
        setSeries(ts.points)
        setStatus(st)
        setDomains(td)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [teamId])

  return (
    <div className="space-y-6">
      {loading || !overview ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Scans"
            value={overview.total_scans.toLocaleString()}
            hint="All-time scans for this team"
            delta={overview.day_over_day.delta_pct}
          />
          <StatCard
            title="Avg Scan Time"
            value={formatSeconds(overview.avg_duration_seconds)}
            hint={`DoW: ${overview.week_over_week.current.toLocaleString()} scans last 7d`}
            delta={overview.week_over_week.delta_pct}
          />
          <StatCard
            title="Total Data Points"
            value={overview.total_datapoints.toLocaleString()}
            hint="Requests + Responses + Links + Downloads"
          />
          <StatCard
            title="Success Rate"
            value={`${overview.success_rate_pct.toFixed(1)}%`}
            hint="Completed / All scans"
          />
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <Card className="h-[360px] border-violet-100 dark:border-violet-900/40">
          <CardHeader>
            <CardTitle>Scans over time (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Scans"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="h-[360px] border-violet-100 dark:border-violet-900/40">
          <CardHeader>
            <CardTitle>Average scan duration (seconds)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="avg_duration_seconds"
                    name="Avg Sec"
                    stroke={CHART_COLORS.primaryDark}
                    fill="url(#violetGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="h-[360px] border-violet-100 dark:border-violet-900/40">
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading || !status ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={status.items}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                  >
                    {status.items.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          [CHART_COLORS.primary, CHART_COLORS.primaryLight, CHART_COLORS.accent, CHART_COLORS.primaryDark][
                            idx % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="h-[360px] border-violet-100 dark:border-violet-900/40">
          <CardHeader>
            <CardTitle>Top domains scanned</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading || !domains ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domains.items}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Scans" fill={CHART_COLORS.primaryDark} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="h-[360px] xl:col-span-2 border-violet-100 dark:border-violet-900/40">
          <CardHeader>
            <CardTitle>Total datapoints over time</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <Skeleton className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_datapoints"
                    name="Data Points"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
