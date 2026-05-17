import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, Download, RefreshCw, AlertTriangle,
  DollarSign, CheckCircle2, XCircle, LayoutGrid,
  Clock, Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsSummary {
  range: { from: string; to: string }
  listings: {
    by_status: { _id: string; count: number }[]
    total: number
  }
  revenue: {
    total: number
    count: number
    by_package: { _id: { pkg_id: string; pkg_name: string }; revenue: number; count: number }[]
  }
  moderation: {
    approved: number
    rejected: number
    approval_rate_pct: number | null
  }
  taxonomy: {
    by_category: { name: string; count: number }[]
    by_city: { name: string; count: number }[]
  }
  operations: {
    cron_jobs: { _id: string; last_run: string; last_status: { outcome?: string } }[]
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_COLORS: Record<string, string> = {
  published: '#22c55e',
  payment_pending: '#f59e0b',
  under_review: '#3b82f6',
  submitted: '#8b5cf6',
  rejected: '#ef4444',
  expired: '#6b7280',
  draft: '#94a3b8',
  payment_submitted: '#06b6d4',
  payment_verified: '#10b981',
  scheduled: '#f97316',
}

const PIE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6']

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color = 'text-foreground',
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`mt-1 font-heading text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Skeleton states ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-16" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
        <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  const [from, setFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState<string>(() => new Date().toISOString().split('T')[0])

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: AnalyticsSummary }>(
        `/admin/analytics/summary?from=${from}&to=${to}`
      )
      setData(res.data.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { fetch() }, [fetch])

  async function downloadCSV() {
    setCsvLoading(true)
    try {
      const res = await api.get(`/admin/analytics/revenue.csv?from=${from}&to=${to}`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'revenue.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download CSV')
    } finally {
      setCsvLoading(false)
    }
  }

  const revenueByPackage = data?.revenue.by_package.map((r) => ({
    name: r._id.pkg_name ?? 'Unknown',
    revenue: r.revenue,
    ads: r.count,
  })) ?? []

  const moderationPie = data
    ? [
        { name: 'Approved', value: data.moderation.approved },
        { name: 'Rejected', value: data.moderation.rejected },
      ].filter((d) => d.value > 0)
    : []

  const cronLabel = (id: string) =>
    id.replace('cron_', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Analytics</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Platform performance overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" variant="outline" className="h-8" onClick={fetch} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={downloadCSV} disabled={csvLoading}>
              <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              {csvLoading ? 'Downloading…' : 'CSV'}
            </Button>
          </div>
        </div>

        {loading ? <PageSkeleton /> : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="h-8 w-8 text-destructive/60 mb-3" strokeWidth={1.5} />
              <p className="font-heading text-sm font-semibold text-foreground">Failed to load analytics</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={fetch}>Try again</Button>
            </CardContent>
          </Card>
        ) : !data ? null : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                label="Total Listings" value={data.listings.total}
                sub={`${formatDate(data.range.from)} – ${formatDate(data.range.to)}`}
                icon={LayoutGrid}
              />
              <KpiCard
                label="Revenue" value={formatCurrency(data.revenue.total)}
                sub={`${data.revenue.count} verified payments`}
                icon={DollarSign} color="text-success"
              />
              <KpiCard
                label="Approved" value={data.moderation.approved}
                sub={data.moderation.approval_rate_pct != null ? `${data.moderation.approval_rate_pct}% approval rate` : undefined}
                icon={CheckCircle2} color="text-success"
              />
              <KpiCard
                label="Rejected" value={data.moderation.rejected}
                sub="Content rejections"
                icon={XCircle} color="text-destructive"
              />
            </div>

            {/* Charts row */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Revenue by package */}
              <Card>
                <CardHeader className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <h2 className="font-heading text-sm font-semibold text-foreground">Revenue by Package</h2>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {revenueByPackage.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      No verified payments in this period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={revenueByPackage} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Moderation donut */}
              <Card>
                <CardHeader className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <h2 className="font-heading text-sm font-semibold text-foreground">Moderation Rate</h2>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {moderationPie.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      No moderation data in this period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={moderationPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          dataKey="value" label={false}
                          labelLine={false}
                        >
                          {moderationPie.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Listings by status */}
            <Card>
              <CardHeader className="px-5 pt-5 pb-3">
                <h2 className="font-heading text-sm font-semibold text-foreground">Listings by Status</h2>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                  {data.listings.by_status.map((s) => (
                    <div key={s._id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[s._id] ?? '#6b7280' }}
                      />
                      <span className="text-sm font-medium text-foreground capitalize">{s._id.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Taxonomy charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="px-5 pt-5 pb-3">
                  <h2 className="font-heading text-sm font-semibold text-foreground">Ads by Category</h2>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {data.taxonomy.by_category.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No published ads</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.taxonomy.by_category} layout="vertical"
                        margin={{ top: 4, right: 4, left: 60, bottom: 4 }}>
                        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-5 pt-5 pb-3">
                  <h2 className="font-heading text-sm font-semibold text-foreground">Ads by City</h2>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {data.taxonomy.by_city.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No published ads</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.taxonomy.by_city} layout="vertical"
                        margin={{ top: 4, right: 4, left: 60, bottom: 4 }}>
                        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cron jobs */}
            {data.operations.cron_jobs.length > 0 && (
              <Card>
                <CardHeader className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <h2 className="font-heading text-sm font-semibold text-foreground">Cron Job Status</h2>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.operations.cron_jobs.map((job) => (
                      <div key={job._id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{cronLabel(job._id)}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(job.last_run)}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs ml-2"
                        >
                          {(job.last_status as { outcome?: string })?.outcome ?? 'ran'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
