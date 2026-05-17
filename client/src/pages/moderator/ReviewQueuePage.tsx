import { useEffect, useState, useCallback, useRef } from 'react'
import {
  CheckCircle2, XCircle, Flag, MessageSquare, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, Coffee, ImageOff, MapPin, Tag, User,
  Package, Phone, DollarSign, CalendarDays, History, StickyNote,
  Keyboard, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import AdStatusBadge from '@/components/ads/AdStatusBadge'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { AdStatus, AdStatusHistoryEntry } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueAd {
  _id: string
  title: string
  slug: string
  description: string
  price?: number
  phone?: string
  status: AdStatus
  moderation_notes?: string
  rejection_reason?: string
  createdAt: string
  updatedAt: string
  user_id: { _id: string; name: string; email: string }
  category_id?: { _id: string; name: string; slug: string }
  city_id?: { _id: string; name: string; slug: string }
  package_id?: { _id: string; name: string; label: string; price: number; duration_days: number }
}

interface QueueMedia {
  _id: string
  source_type: 's3' | 'youtube' | 'external'
  original_url: string
  thumbnail_url?: string
  is_primary: boolean
}

interface AdDetail {
  ad: QueueAd
  media: QueueMedia[]
  history: AdStatusHistoryEntry[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPrice(price?: number) {
  if (!price) return null
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(price)
}

const REJECT_REASONS = [
  'Prohibited content or category',
  'Misleading or false information',
  'Duplicate or spam listing',
  'Poor quality description or images',
  'Missing required contact information',
  'Pricing appears fraudulent',
  'Other (specify below)',
]

const FLAG_REASONS = [
  'Suspected duplicate listing',
  'Suspicious seller activity',
  'Potentially fraudulent listing',
  'Needs additional information',
  'Policy violation under review',
  'Other (specify below)',
]

// ── Queue list item ────────────────────────────────────────────────────────────

function QueueItem({
  ad,
  isSelected,
  onClick,
}: {
  ad: QueueAd
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left transition-colors border-b border-border last:border-b-0 px-4 py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
        isSelected ? 'bg-accent/5 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <ImageOff className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-foreground line-clamp-1">{ad.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <AdStatusBadge status={ad.status} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" strokeWidth={1.5} />
              {ad.user_id.name}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {timeAgo(ad.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Skeleton states ────────────────────────────────────────────────────────────

function QueueItemSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}

// ── Empty / error states ──────────────────────────────────────────────────────

function EmptyQueue({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Coffee className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
      <p className="font-heading text-sm font-semibold text-foreground">Inbox zero</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
        {filter === 'all'
          ? 'No ads waiting for review right now.'
          : `No ${filter.replace('_', ' ')} ads in the queue.`}
      </p>
    </div>
  )
}

function NoSelection() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <p className="font-heading text-base font-semibold text-foreground">Select an ad to review</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        Pick an item from the queue on the left to see its full details and take action.
      </p>
      <div className="mt-6 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>J / K navigate · A approve · R reject · F flag</span>
      </div>
    </div>
  )
}

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive/60 mb-3" strokeWidth={1.5} />
      <p className="font-heading text-sm font-semibold text-foreground">Couldn't load data</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

// ── Notes thread ──────────────────────────────────────────────────────────────

function NotesThread({ notes }: { notes?: string }) {
  if (!notes) return null
  const lines = notes.split('\n').filter(Boolean)
  if (!lines.length) return null
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isFlag = line.startsWith('[FLAGGED]')
        return (
          <div
            key={i}
            className={`flex gap-2 rounded-md px-3 py-2 text-sm ${
              isFlag
                ? 'bg-warning/5 border border-warning/20 text-warning'
                : 'bg-muted text-foreground'
            }`}
          >
            {isFlag
              ? <Flag className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
              : <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.5} />
            }
            <span>{isFlag ? line.replace('[FLAGGED] ', '') : line}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── History timeline ──────────────────────────────────────────────────────────

function HistoryTimeline({ history }: { history: AdStatusHistoryEntry[] }) {
  if (!history.length) return null
  return (
    <div className="relative space-y-3 pl-5">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
      {history.map((entry) => (
        <div key={entry._id} className="relative flex gap-3">
          <div className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-border" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <AdStatusBadge status={entry.new_status} />
              {entry.previous_status && entry.previous_status !== entry.new_status && (
                <span className="text-xs text-muted-foreground">
                  from <AdStatusBadge status={entry.previous_status} className="text-xs py-0 px-1.5" />
                </span>
              )}
            </div>
            {entry.note && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{entry.note}</p>
            )}
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {entry.changed_by && (
                <span className="font-medium text-foreground">{entry.changed_by.name}</span>
              )}
              <span>·</span>
              <span>{formatDate(entry.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({
  open, onClose, onConfirm, loading,
}: {
  open: boolean; onClose: () => void; onConfirm: (r: string) => void; loading: boolean
}) {
  const [selected, setSelected] = useState(REJECT_REASONS[0])
  const [other, setOther] = useState('')
  const isOther = selected === 'Other (specify below)'
  const reason = isOther ? other.trim() : selected
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-semibold">Reject ad</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a reason. This will be shared with the client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {REJECT_REASONS.map((r) => (
            <label key={r} className="flex items-start gap-2.5 cursor-pointer rounded-md px-3 py-2 hover:bg-muted transition-colors">
              <input
                type="radio" name="reject-reason" value={r}
                checked={selected === r} onChange={() => setSelected(r)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-destructive"
              />
              <span className="text-sm text-foreground">{r}</span>
            </label>
          ))}
          {isOther && (
            <Textarea
              value={other} onChange={(e) => setOther(e.target.value)}
              placeholder="Describe the issue..." className="mt-1 text-sm" rows={3} autoFocus
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={loading || !reason} className="active:scale-[0.98]">
            {loading ? 'Rejecting…' : 'Reject ad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Flag dialog ────────────────────────────────────────────────────────────────

function FlagDialog({
  open, onClose, onConfirm, loading,
}: {
  open: boolean; onClose: () => void; onConfirm: (r: string) => void; loading: boolean
}) {
  const [selected, setSelected] = useState(FLAG_REASONS[0])
  const [other, setOther] = useState('')
  const isOther = selected === 'Other (specify below)'
  const reason = isOther ? other.trim() : selected
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-semibold">Flag for review</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Ad stays in the queue marked as suspicious.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {FLAG_REASONS.map((r) => (
            <label key={r} className="flex items-start gap-2.5 cursor-pointer rounded-md px-3 py-2 hover:bg-muted transition-colors">
              <input
                type="radio" name="flag-reason" value={r}
                checked={selected === r} onChange={() => setSelected(r)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span className="text-sm text-foreground">{r}</span>
            </label>
          ))}
          {isOther && (
            <Textarea
              value={other} onChange={(e) => setOther(e.target.value)}
              placeholder="Describe the concern..." className="mt-1 text-sm" rows={3} autoFocus
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => onConfirm(reason)} disabled={loading || !reason}
            className="bg-warning text-warning-foreground hover:bg-warning/90 active:scale-[0.98]"
          >
            {loading ? 'Flagging…' : 'Flag ad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Note dialog ────────────────────────────────────────────────────────────────

function NoteDialog({
  open, onClose, onConfirm, loading,
}: {
  open: boolean; onClose: () => void; onConfirm: (n: string) => void; loading: boolean
}) {
  const [note, setNote] = useState('')
  function handleClose() { setNote(''); onClose() }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-semibold">Add internal note</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Visible only to moderators and admins.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="mod-note" className="sr-only">Note</Label>
          <Textarea
            id="mod-note" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Write your note here..." rows={4} className="text-sm" autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => { onConfirm(note.trim()); setNote('') }}
            disabled={loading || !note.trim()}
            className="bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
          >
            {loading ? 'Saving…' : 'Add note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReviewQueuePage() {
  const [items, setItems] = useState<QueueAd[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'under_review'>('all')
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const [actionLoading, setActionLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)

  const anyDialogOpen = rejectOpen || flagOpen || noteOpen
  const selectedIndex = items.findIndex((a) => a._id === selectedId)

  // ── Fetch queue ─────────────────────────────────────────────────────────────

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true)
    setQueueError(null)
    try {
      const params = new URLSearchParams({ page: String(page), sort })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await api.get<{ ok: boolean; data: { items: QueueAd[]; total: number; pages: number } }>(
        `/moderator/review-queue?${params}`
      )
      setItems(res.data.data.items)
      setTotal(res.data.data.total)
      setTotalPages(res.data.data.pages)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setQueueError(msg ?? 'Failed to load review queue')
    } finally {
      setQueueLoading(false)
    }
  }, [page, sort, statusFilter])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  // ── Fetch detail ────────────────────────────────────────────────────────────

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const res = await api.get<{ ok: boolean; data: AdDetail }>(`/moderator/ads/${id}`)
      setDetail(res.data.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setDetailError(msg ?? 'Failed to load ad details')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  function handleSelectAd(id: string) {
    setSelectedId(id)
    setDetail(null)
    fetchDetail(id)
    setMobileView('detail')
  }

  function handleNextAd() {
    if (selectedIndex < items.length - 1) handleSelectAd(items[selectedIndex + 1]._id)
  }

  function handlePrevAd() {
    if (selectedIndex > 0) handleSelectAd(items[selectedIndex - 1]._id)
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  const anyDialogOpenRef = useRef(anyDialogOpen)
  anyDialogOpenRef.current = anyDialogOpen
  const actionLoadingRef = useRef(actionLoading)
  actionLoadingRef.current = actionLoading

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || anyDialogOpenRef.current) return
      const canAct = !!selectedId && !!detail && !actionLoadingRef.current &&
        ['submitted', 'under_review'].includes(detail.ad.status)
      switch (e.key) {
        case 'j': case 'J': e.preventDefault(); handleNextAd(); break
        case 'k': case 'K': e.preventDefault(); handlePrevAd(); break
        case 'a': case 'A': if (canAct) { e.preventDefault(); handleApprove() } break
        case 'r': case 'R': if (canAct) { e.preventDefault(); setRejectOpen(true) } break
        case 'f': case 'F': if (canAct) { e.preventDefault(); setFlagOpen(true) } break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, detail, selectedIndex, items])

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function submitAction(
    action: 'approve_content' | 'reject' | 'flag' | 'add_note',
    payload: { reason?: string; note?: string } = {},
  ) {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await api.patch(`/moderator/ads/${selectedId}/review`, { action, ...payload })
      const labels: Record<string, string> = {
        approve_content: 'Ad approved — awaiting payment',
        reject: 'Ad rejected',
        flag: 'Ad flagged for review',
        add_note: 'Note added',
      }
      toast.success(labels[action])

      const staysInQueue = action === 'add_note' || action === 'flag'
      const currentItems = items
      await fetchQueue()

      if (!staysInQueue) {
        const nextIndex = selectedIndex < currentItems.length - 1 ? selectedIndex + 1 : selectedIndex - 1
        const nextItem = currentItems[nextIndex]
        if (nextItem && nextItem._id !== selectedId) {
          setSelectedId(nextItem._id)
          fetchDetail(nextItem._id)
        } else {
          setSelectedId(null)
          setDetail(null)
        }
      } else {
        fetchDetail(selectedId)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? "Couldn't complete action")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleApprove() { await submitAction('approve_content') }
  async function handleReject(reason: string) { await submitAction('reject', { reason }); setRejectOpen(false) }
  async function handleFlag(reason: string) { await submitAction('flag', { note: reason }); setFlagOpen(false) }
  async function handleAddNote(note: string) { await submitAction('add_note', { note }); setNoteOpen(false) }

  function changeFilter(value: 'all' | 'submitted' | 'under_review') {
    setStatusFilter(value); setPage(1); setSelectedId(null); setDetail(null)
  }
  function changeSort(value: 'oldest' | 'newest') { setSort(value); setPage(1) }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const ad = detail?.ad
  const canAct = !!ad && ['submitted', 'under_review'].includes(ad.status) && !actionLoading

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* Left panel: queue list */}
      <aside className={`w-full md:w-[360px] md:flex flex-col border-r border-border bg-background shrink-0 ${mobileView === 'detail' ? 'hidden' : 'flex'}`}>

        {/* List header */}
        <div className="border-b border-border px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-base font-bold text-foreground">Review Queue</h1>
            {!queueLoading && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{total}</span>
            )}
          </div>

          <div className="flex gap-1">
            {(['all', 'submitted', 'under_review'] as const).map((s) => (
              <button
                key={s} type="button" onClick={() => changeFilter(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {s === 'all' ? 'All' : s === 'submitted' ? 'Submitted' : 'Under Review'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            {(['oldest', 'newest'] as const).map((s) => (
              <button
                key={s} type="button" onClick={() => changeSort(s)}
                className={`text-xs transition-colors ${sort === s ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {s === 'oldest' ? 'Oldest first' : 'Newest first'}
              </button>
            ))}
          </div>
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto" aria-busy={queueLoading}>
          {queueLoading
            ? Array.from({ length: 6 }).map((_, i) => <QueueItemSkeleton key={i} />)
            : queueError
            ? <ErrorDisplay message={queueError} onRetry={fetchQueue} />
            : !items.length
            ? <EmptyQueue filter={statusFilter} />
            : items.map((item) => (
                <QueueItem key={item._id} ad={item} isSelected={item._id === selectedId} onClick={() => handleSelectAd(item._id)} />
              ))
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || queueLoading}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />Prev
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">{page} / {totalPages}</span>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || queueLoading}>
              Next<ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </aside>

      {/* Right panel: detail */}
      <main className={`flex-1 flex-col overflow-hidden bg-background md:flex ${mobileView === 'list' ? 'hidden' : 'flex'}`}>

        {/* Mobile back */}
        <div className="flex md:hidden border-b border-border px-4 py-2">
          <Button size="sm" variant="ghost" className="h-8 px-2 text-sm gap-1" onClick={() => setMobileView('list')}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />Queue
          </Button>
        </div>

        {!selectedId ? (
          <NoSelection />
        ) : detailLoading ? (
          <DetailSkeleton />
        ) : detailError ? (
          <div className="flex flex-col items-center justify-center h-full">
            <ErrorDisplay message={detailError} onRetry={() => fetchDetail(selectedId)} />
          </div>
        ) : !detail ? null : (
          <div className="flex flex-col h-full">

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">

                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <AdStatusBadge status={ad!.status} />
                    {ad!.package_id && (
                      <Badge variant="outline" className="text-xs font-medium">{ad!.package_id.label}</Badge>
                    )}
                  </div>
                  <h2 className="font-heading text-xl font-bold text-foreground">{ad!.title}</h2>
                  <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {ad!.user_id.name} ({ad!.user_id.email})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Submitted {formatDate(ad!.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Media */}
                {detail.media.length > 0 ? (
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                      Media ({detail.media.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detail.media.map((m) => {
                        const src = m.thumbnail_url || m.original_url
                        return (
                          <a key={m._id} href={m.original_url} target="_blank" rel="noopener noreferrer"
                            className="group relative block aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:ring-2 hover:ring-ring transition-all"
                          >
                            <img src={src} alt="" className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            {m.source_type === 'youtube' && (
                              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">YT</span>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                    <ImageOff className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    No media attached to this ad
                  </div>
                )}

                <Separator />

                {/* Ad info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ad!.description}</p>
                  </div>
                  {ad!.category_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-foreground">{ad!.category_id.name}</span>
                    </div>
                  )}
                  {ad!.city_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="text-muted-foreground">City:</span>
                      <span className="font-medium text-foreground">{ad!.city_id.name}</span>
                    </div>
                  )}
                  {!!ad!.price && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium text-foreground">{formatPrice(ad!.price)}</span>
                    </div>
                  )}
                  {ad!.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-mono font-medium text-foreground">{ad!.phone}</span>
                    </div>
                  )}
                  {ad!.package_id && (
                    <div className="flex items-center gap-2 text-sm sm:col-span-2">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="text-muted-foreground">Package:</span>
                      <span className="font-medium text-foreground">
                        {ad!.package_id.label} · {ad!.package_id.duration_days}d · {formatPrice(ad!.package_id.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rejection reason (if rejected) */}
                {ad!.status === 'rejected' && ad!.rejection_reason && (
                  <>
                    <Separator />
                    <Card className="border-destructive/20 bg-destructive/5">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-destructive mb-1">Rejection reason</p>
                        <p className="text-sm text-foreground">{ad!.rejection_reason}</p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Moderation notes */}
                {ad!.moderation_notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <StickyNote className="h-4 w-4" strokeWidth={1.5} />
                        Moderation Notes
                      </h3>
                      <NotesThread notes={ad!.moderation_notes} />
                    </div>
                  </>
                )}

                {/* Status history */}
                {detail.history.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <History className="h-4 w-4" strokeWidth={1.5} />
                        Status History
                      </h3>
                      <HistoryTimeline history={detail.history} />
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Sticky action bar */}
            <div className="border-t border-border bg-background px-6 py-4 shrink-0">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">

                  {/* Nav + note */}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Previous ad (K)" onClick={handlePrevAd} disabled={selectedIndex <= 0}>
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">{selectedIndex + 1} / {items.length}</span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Next ad (J)" onClick={handleNextAd} disabled={selectedIndex >= items.length - 1}>
                      <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setNoteOpen(true)} disabled={actionLoading}>
                      <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />Note
                    </Button>
                  </div>

                  {/* Primary actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" variant="outline"
                      className="h-8 gap-1.5 text-xs border-warning/40 text-warning hover:bg-warning/10 hover:border-warning/60"
                      onClick={() => setFlagOpen(true)} disabled={!canAct} title="Flag (F)"
                    >
                      <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />Flag
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
                      onClick={() => setRejectOpen(true)} disabled={!canAct} title="Reject (R)"
                    >
                      <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
                      onClick={handleApprove} disabled={!canAct} title="Approve (A)"
                    >
                      {actionLoading ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                          Approving…
                        </span>
                      ) : (
                        <><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />Approve</>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 hidden lg:block text-xs text-muted-foreground/60 text-right">
                  A approve · R reject · F flag · J / K navigate
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Dialogs */}
      <RejectDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={handleReject} loading={actionLoading} />
      <FlagDialog open={flagOpen} onClose={() => setFlagOpen(false)} onConfirm={handleFlag} loading={actionLoading} />
      <NoteDialog open={noteOpen} onClose={() => setNoteOpen(false)} onConfirm={handleAddNote} loading={actionLoading} />
    </div>
  )
}
