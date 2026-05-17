import { useEffect, useState, useCallback } from 'react'
import {
  Activity, Shield, History, Database, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AdStatusBadge from '@/components/ads/AdStatusBadge'
import api from '@/lib/api'
import type { AdStatus } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface HealthLog {
  _id: string
  source: string
  response_ms: number
  status: 'ok' | 'error'
  checked_at: string
}

interface AuditLog {
  _id: string
  actor_id?: { _id: string; name: string; email: string; role: string }
  action_type: string
  target_type?: string
  target_id?: string
  old_value?: unknown
  new_value?: unknown
  createdAt: string
}

interface StatusHistoryEntry {
  _id: string
  ad_id?: { _id: string; title: string; slug: string }
  previous_status?: AdStatus
  new_status: AdStatus
  changed_by?: { _id: string; name: string; email: string; role: string }
  note?: string
  createdAt: string
}

interface DbHealth {
  ping_ms: number
  write_ms: number
  status: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
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

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  page, pages, onPage, loading,
}: {
  page: number; pages: number; onPage: (p: number) => void; loading: boolean
}) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-2">
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
        onClick={() => onPage(page - 1)} disabled={page === 1 || loading}>
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />Prev
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">{page} / {pages}</span>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
        onClick={() => onPage(page + 1)} disabled={page === pages || loading}>
        Next<ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </Button>
    </div>
  )
}

// ── DB Health panel ────────────────────────────────────────────────────────────

function DbHealthPanel() {
  const [health, setHealth] = useState<DbHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: DbHealth }>('/health/db')
      setHealth(res.data.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Database health check failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { check() }, [check])

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="font-heading text-sm font-semibold text-foreground">Database Health</h2>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={check} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-sm">{error}</span>
          </div>
        ) : health ? (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground capitalize">{health.status}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Ping:</span>
              <span className="font-mono font-medium text-foreground">{health.ping_ms}ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Write:</span>
              <span className="font-mono font-medium text-foreground">{health.write_ms}ms</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ── Health Logs ────────────────────────────────────────────────────────────────

function HealthLogsPanel() {
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: { logs: HealthLog[] } }>('/admin/health-logs?limit=50')
      setLogs(res.data.data.logs)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load health logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="font-heading text-sm font-semibold text-foreground">System Health Logs</h2>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={fetch} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-10 text-center px-5">
            <AlertTriangle className="h-7 w-7 text-destructive/60 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={fetch}>Retry</Button>
          </div>
        ) : logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No health logs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Source', 'Status', 'Ping', 'Checked'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{log.source}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {log.status === 'ok'
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
                          : <XCircle className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
                        }
                        <span className={`text-xs ${log.status === 'ok' ? 'text-success' : 'text-destructive'}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.response_ms}ms</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{timeAgo(log.checked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Audit Logs ─────────────────────────────────────────────────────────────────

function AuditLogsPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionType, setActionType] = useState('')
  const [targetType, setTargetType] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (actionType.trim()) params.set('action_type', actionType.trim())
      if (targetType.trim()) params.set('target_type', targetType.trim())
      const res = await api.get<{ ok: boolean; data: { logs: AuditLog[]; total: number; pages: number } }>(
        `/admin/audit-logs?${params}`
      )
      setLogs(res.data.data.logs)
      setTotal(res.data.data.total)
      setPages(res.data.data.pages)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, actionType, targetType])

  useEffect(() => { fetch() }, [fetch])

  function handleFilter() { setPage(1); fetch() }

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Audit Log
              {!loading && <span className="ml-2 text-xs font-normal text-muted-foreground">({total})</span>}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Action type (e.g. ad_submitted)"
              value={actionType} onChange={(e) => setActionType(e.target.value)}
              className="h-7 w-44 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
            <Input
              placeholder="Target type (e.g. ad)"
              value={targetType} onChange={(e) => setTargetType(e.target.value)}
              className="h-7 w-36 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleFilter} disabled={loading}>
              <Search className="h-3 w-3 mr-1" strokeWidth={1.5} />Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-10 text-center px-5">
            <AlertTriangle className="h-7 w-7 text-destructive/60 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={fetch}>Retry</Button>
          </div>
        ) : logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No audit logs match the filter</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {['Actor', 'Action', 'Target', 'When'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        {log.actor_id ? (
                          <div>
                            <p className="text-xs font-medium text-foreground">{log.actor_id.name}</p>
                            <p className="text-xs text-muted-foreground">{log.actor_id.role}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="font-mono text-xs">{log.action_type}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {log.target_type && <span className="font-medium">{log.target_type}</span>}
                        {log.target_id && <p className="font-mono text-xs/5 truncate max-w-[120px]">{log.target_id}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} loading={loading} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Status History ─────────────────────────────────────────────────────────────

function StatusHistoryPanel() {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [newStatus, setNewStatus] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (newStatus.trim()) params.set('new_status', newStatus.trim())
      const res = await api.get<{ ok: boolean; data: { history: StatusHistoryEntry[]; total: number; pages: number } }>(
        `/admin/status-history?${params}`
      )
      setHistory(res.data.data.history)
      setTotal(res.data.data.total)
      setPages(res.data.data.pages)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load status history')
    } finally {
      setLoading(false)
    }
  }, [page, newStatus])

  useEffect(() => { fetch() }, [fetch])

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Status History
              {!loading && <span className="ml-2 text-xs font-normal text-muted-foreground">({total})</span>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by status (e.g. published)"
              value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="h-7 w-52 text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetch() } }}
            />
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setPage(1); fetch() }} disabled={loading}>
              <Search className="h-3 w-3 mr-1" strokeWidth={1.5} />Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-10 text-center px-5">
            <AlertTriangle className="h-7 w-7 text-destructive/60 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={fetch}>Retry</Button>
          </div>
        ) : history.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No history matches the filter</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {['Ad', 'Transition', 'Actor', 'Note', 'When'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        {entry.ad_id ? (
                          <p className="text-xs font-medium text-foreground line-clamp-1">{entry.ad_id.title}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.previous_status && (
                            <>
                              <AdStatusBadge status={entry.previous_status} className="text-xs py-0 px-1.5" />
                              <span className="text-xs text-muted-foreground">→</span>
                            </>
                          )}
                          <AdStatusBadge status={entry.new_status} className="text-xs py-0 px-1.5" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {entry.changed_by ? (
                          <p className="text-xs text-foreground">{entry.changed_by.name}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[160px]">
                        <span className="line-clamp-1">{entry.note ?? '—'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} loading={loading} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HealthAuditPage() {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Health &amp; Audit</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">System health, audit trail, and status history</p>
        </div>

        <DbHealthPanel />

        <Tabs defaultValue="audit">
          <TabsList className="mb-4">
            <TabsTrigger value="audit">
              <Shield className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Status History
            </TabsTrigger>
            <TabsTrigger value="health">
              <Activity className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Health Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit"><AuditLogsPanel /></TabsContent>
          <TabsContent value="history"><StatusHistoryPanel /></TabsContent>
          <TabsContent value="health"><HealthLogsPanel /></TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
