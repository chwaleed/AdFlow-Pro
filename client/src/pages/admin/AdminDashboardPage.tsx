import { useEffect, useState, useCallback } from 'react'
import {
  Wallet, CheckCircle2, XCircle, CalendarClock, Zap,
  AlertTriangle, User, Tag, MapPin, Package, Star,
  Clock, ImageOff, ExternalLink, ChevronUp, ChevronDown,
  ArrowUpDown, Users, FolderOpen, Building2,
  Plus, Pencil, ToggleLeft, ToggleRight, Ban, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import AdStatusBadge from '@/components/ads/AdStatusBadge'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { AdStatus } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PopulatedAd {
  _id: string
  title: string
  slug: string
  status: AdStatus
  is_featured: boolean
  admin_boost: number
  rank_score: number
  publish_at?: string
  expire_at?: string
  createdAt: string
  user_id: { _id: string; name: string; email: string }
  category_id?: { _id: string; name: string }
  city_id?: { _id: string; name: string }
  package_id?: { _id: string; name: string; label: string; price: number; duration_days: number; weight: number }
}

interface PaymentItem {
  _id: string
  amount: number
  method: string
  transaction_ref: string
  sender_name: string
  screenshot_url?: string
  status: 'submitted' | 'verified' | 'rejected'
  createdAt: string
  user_id: { _id: string; name: string; email: string }
  ad_id: PopulatedAd
}

interface UserItem {
  _id: string
  name: string
  email: string
  role: 'client' | 'moderator' | 'admin' | 'super_admin'
  status: 'active' | 'suspended'
  createdAt: string
}

interface PackageItem {
  _id: string
  name: string
  label: string
  duration_days: number
  weight: number
  price: number
  is_featured: boolean
  homepage_placement: boolean
  refresh_rule: 'none' | 'manual' | 'auto'
  refresh_days?: number
  benefits: string[]
  sort_order: number
  is_active: boolean
}

interface CategoryItem {
  _id: string
  name: string
  slug: string
  icon?: string
  sort_order: number
  is_active: boolean
}

interface CityItem {
  _id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(n?: number) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDatetime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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

function toLocalDatetimeValue(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function toISOFromLocal(local: string) {
  if (!local) return undefined
  return new Date(local).toISOString()
}

// ── Loading skeletons ─────────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Empty / error states ──────────────────────────────────────────────────────

function EmptyRow({ cols, icon: Icon, message }: { cols: number; icon: React.ElementType; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-16 text-center">
        <Icon className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
        <p className="font-heading text-sm font-semibold text-foreground">{message}</p>
      </td>
    </tr>
  )
}

function ErrorRow({ cols, message, onRetry }: { cols: number; message: string; onRetry: () => void }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive/60 mb-2" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground mb-3">{message}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>
      </td>
    </tr>
  )
}

// ── Stat cards ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-accent/10' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-accent' : 'text-muted-foreground'}`} strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-heading text-xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Payment Verification Sheet (Milestone 3.2) ────────────────────────────────

function PaymentSheet({
  payment,
  open,
  onClose,
  onVerified,
}: {
  payment: PaymentItem | null
  open: boolean
  onClose: () => void
  onVerified: () => void
}) {
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) { setRejectMode(false); setRejectNote('') }
  }, [open])

  async function handleAction(action: 'verify' | 'reject') {
    if (!payment) return
    if (action === 'reject' && !rejectNote.trim()) return
    setLoading(true)
    try {
      await api.patch(`/admin/payments/${payment._id}/verify`, {
        action,
        note: action === 'reject' ? rejectNote.trim() : undefined,
      })
      toast.success(action === 'verify' ? 'Payment verified — ad ready for publishing' : 'Payment rejected')
      onVerified()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? "Couldn't complete action")
    } finally {
      setLoading(false)
    }
  }

  const ad = payment?.ad_id

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="font-heading text-base font-semibold">Payment Verification</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Review the payment proof and ad details before verifying.
          </SheetDescription>
        </SheetHeader>

        {!payment ? null : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Payment Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold tabular-nums">{formatPrice(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">{payment.method}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Transaction Ref</p>
                  <p className="font-mono text-sm break-all">{payment.transaction_ref}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sender</p>
                  <p className="font-medium">{payment.sender_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(payment.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium">{payment.user_id.name}
                    <span className="ml-1.5 text-muted-foreground font-normal text-xs">({payment.user_id.email})</span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Payment Screenshot</p>
              {payment.screenshot_url ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={payment.screenshot_url}
                    alt="Payment screenshot"
                    className="w-full object-contain max-h-64"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <a
                    href={payment.screenshot_url} target="_blank" rel="noopener noreferrer"
                    className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                    Open
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                  <ImageOff className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  No screenshot provided
                </div>
              )}
            </div>

            {ad && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Ad Summary</p>
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-heading text-sm font-semibold text-foreground line-clamp-2">{ad.title}</p>
                      <AdStatusBadge status={ad.status} className="shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {ad.category_id && (
                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" strokeWidth={1.5} />{ad.category_id.name}</span>
                      )}
                      {ad.city_id && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.5} />{ad.city_id.name}</span>
                      )}
                      {ad.package_id && (
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" strokeWidth={1.5} />{ad.package_id.label} · {ad.package_id.duration_days}d</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {rejectMode && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="reject-note" className="text-sm font-medium text-foreground">
                    Rejection reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reject-note"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Explain why this payment is being rejected..."
                    rows={3}
                    className="mt-1.5 text-sm"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This reason will be visible to the client. The ad will revert to Payment Pending.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <SheetFooter className="border-t border-border px-6 py-4 flex-row justify-between">
          {!rejectMode ? (
            <>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 active:scale-[0.98]"
                onClick={() => setRejectMode(true)}
                disabled={loading || !payment}
              >
                <XCircle className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                Reject
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
                onClick={() => handleAction('verify')}
                disabled={loading || !payment}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-1.5" strokeWidth={1.5} />Verify Payment</>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setRejectMode(false); setRejectNote('') }} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction('reject')}
                disabled={loading || !rejectNote.trim()}
                className="active:scale-[0.98]"
              >
                {loading ? 'Rejecting…' : 'Confirm Rejection'}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Publish Sheet (Milestone 3.3) ─────────────────────────────────────────────

function PublishSheet({
  ad,
  open,
  onClose,
  onPublished,
}: {
  ad: PopulatedAd | null
  open: boolean
  onClose: () => void
  onPublished: () => void
}) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [adminBoost, setAdminBoost] = useState(0)
  const [publishLoading, setPublishLoading] = useState(false)
  const [featureLoading, setFeatureLoading] = useState(false)

  useEffect(() => {
    if (ad) {
      setMode('now')
      setScheduleDate(ad.publish_at ? toLocalDatetimeValue(ad.publish_at) : '')
      setIsFeatured(ad.is_featured)
      setAdminBoost(ad.admin_boost ?? 0)
    }
  }, [ad])

  async function handlePublish() {
    if (!ad) return
    if (mode === 'schedule' && !scheduleDate) {
      toast.error('Pick a publish date first')
      return
    }
    setPublishLoading(true)
    try {
      await api.patch(`/admin/ads/${ad._id}/publish`, {
        publish_at: mode === 'schedule' ? toISOFromLocal(scheduleDate) : null,
      })
      toast.success(mode === 'now' ? 'Ad published successfully' : 'Ad scheduled for publishing')
      onPublished()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? "Couldn't publish ad")
    } finally {
      setPublishLoading(false)
    }
  }

  async function handleSaveFeature() {
    if (!ad) return
    setFeatureLoading(true)
    try {
      await api.patch(`/admin/ads/${ad._id}/feature`, { is_featured: isFeatured, admin_boost: adminBoost })
      toast.success('Feature settings saved')
      onPublished()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? "Couldn't save feature settings")
    } finally {
      setFeatureLoading(false)
    }
  }

  const minDatetime = (() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)
    return toLocalDatetimeValue(now.toISOString())
  })()

  const isScheduled = ad?.status === 'scheduled'

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="font-heading text-base font-semibold">
            {isScheduled ? 'Manage Scheduled Ad' : 'Publish & Feature'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isScheduled
              ? 'Update the schedule, featured status, or boost.'
              : 'Set the publish date and optional feature settings.'}
          </SheetDescription>
        </SheetHeader>

        {!ad ? null : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-start gap-2 justify-between">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-foreground line-clamp-2">{ad.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" strokeWidth={1.5} />
                    {ad.user_id.name}
                  </p>
                </div>
                <AdStatusBadge status={ad.status} className="shrink-0" />
              </div>
              {ad.package_id ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" strokeWidth={1.5} />{ad.package_id.label}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" strokeWidth={1.5} />{ad.package_id.duration_days} days</span>
                  {ad.expire_at && <span className="flex items-center gap-1">Expires {formatDatetime(ad.expire_at)}</span>}
                </div>
              ) : (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
                  No package selected — required to publish
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Publish Options</p>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('now')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                    mode === 'now'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  <Zap className="h-4 w-4" strokeWidth={1.5} />
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setMode('schedule')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                    mode === 'schedule'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
                  }`}
                >
                  <CalendarClock className="h-4 w-4" strokeWidth={1.5} />
                  Schedule
                </button>
              </div>

              {mode === 'schedule' && (
                <div>
                  <Label htmlFor="publish-date" className="text-sm font-medium text-foreground mb-1.5 block">
                    Publish date &amp; time
                  </Label>
                  <input
                    id="publish-date"
                    type="datetime-local"
                    min={minDatetime}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Ad will become publicly visible at this date and time.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Feature &amp; Boost</p>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Star className="h-4 w-4 text-warning" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Featured ad</p>
                    <p className="text-xs text-muted-foreground">Appears at the top of search results</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-foreground">Admin Boost</Label>
                  <span className="font-mono text-sm font-semibold tabular-nums text-accent">+{adminBoost}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={adminBoost}
                  onChange={(e) => setAdminBoost(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Added directly to the rank score. Use sparingly.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={handleSaveFeature}
                disabled={featureLoading}
              >
                {featureLoading ? 'Saving…' : 'Save feature settings'}
              </Button>
            </div>

          </div>
        )}

        <SheetFooter className="border-t border-border px-6 py-4">
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
            onClick={handlePublish}
            disabled={publishLoading || !ad || !ad.package_id}
            title={!ad?.package_id ? 'Ad has no package — cannot publish' : undefined}
          >
            {publishLoading ? (
              <span className="flex items-center gap-1.5 justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                {mode === 'now' ? 'Publishing…' : 'Scheduling…'}
              </span>
            ) : (
              mode === 'now' ? 'Publish Ad Now' : 'Schedule Ad'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Payment Queue tab ─────────────────────────────────────────────────────────

function PaymentQueueTab({ onSelect }: { onSelect: (p: PaymentItem) => void }) {
  const [items, setItems] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: { items: PaymentItem[] } }>('/admin/payment-queue')
      setItems(res.data.data.items)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load payment queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const COLS = 6

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            {['Ad', 'Client', 'Amount', 'Method', 'Tx Ref', 'Submitted'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton cols={COLS} />
          ) : error ? (
            <ErrorRow cols={COLS} message={error} onRetry={fetchQueue} />
          ) : !items.length ? (
            <EmptyRow cols={COLS} icon={Wallet} message="All caught up — no payments pending verification" />
          ) : (
            items.map((p) => (
              <tr
                key={p._id}
                onClick={() => onSelect(p)}
                className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-medium text-foreground line-clamp-1">{p.ad_id?.title ?? '—'}</p>
                  {p.ad_id?.package_id && (
                    <p className="text-xs text-muted-foreground">{p.ad_id.package_id.label}</p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-foreground">{p.user_id.name}</p>
                  <p className="text-xs text-muted-foreground">{p.user_id.email}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold tabular-nums">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap capitalize">{p.method}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{p.transaction_ref}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{timeAgo(p.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Publish Queue tab ─────────────────────────────────────────────────────────

function PublishQueueTab({ onSelect }: { onSelect: (ad: PopulatedAd) => void }) {
  const [items, setItems] = useState<PopulatedAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'createdAt' | 'status'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: { items: PopulatedAd[] } }>('/admin/publish-queue')
      setItems(res.data.data.items)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load publish queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...items].sort((a, b) => {
    const va = sortKey === 'createdAt' ? a.createdAt : a.status
    const vb = sortKey === 'createdAt' ? b.createdAt : b.status
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
  })

  function SortIcon({ k }: { k: typeof sortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" strokeWidth={1.5} />
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 ml-1" strokeWidth={1.5} />
      : <ChevronDown className="h-3 w-3 ml-1" strokeWidth={1.5} />
  }

  const COLS = 5

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ad</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seller</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Package</th>
            <th
              className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => toggleSort('status')}
            >
              <span className="flex items-center">Status <SortIcon k="status" /></span>
            </th>
            <th
              className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => toggleSort('createdAt')}
            >
              <span className="flex items-center">Created <SortIcon k="createdAt" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton cols={COLS} />
          ) : error ? (
            <ErrorRow cols={COLS} message={error} onRetry={fetchQueue} />
          ) : !sorted.length ? (
            <EmptyRow cols={COLS} icon={CheckCircle2} message="No ads awaiting publishing right now" />
          ) : (
            sorted.map((ad) => (
              <tr
                key={ad._id}
                onClick={() => onSelect(ad)}
                className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-medium text-foreground line-clamp-1">{ad.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ad.is_featured && (
                      <span className="flex items-center gap-0.5 text-xs text-warning">
                        <Star className="h-3 w-3" strokeWidth={1.5} />Featured
                      </span>
                    )}
                    {ad.admin_boost > 0 && (
                      <span className="text-xs text-accent">+{ad.admin_boost} boost</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-foreground">{ad.user_id.name}</p>
                  <p className="text-xs text-muted-foreground">{ad.user_id.email}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {ad.package_id ? (
                    <>
                      <p className="text-foreground">{ad.package_id.label}</p>
                      <p className="text-xs text-muted-foreground">{ad.package_id.duration_days}d · {formatPrice(ad.package_id.price)}</p>
                    </>
                  ) : (
                    <span className="text-xs text-destructive">No package</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <AdStatusBadge status={ad.status} />
                  {ad.publish_at && ad.status === 'scheduled' && (
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDatetime(ad.publish_at)}</p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(ad.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Users Tab (Milestone 3.4) ─────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  client: 'bg-muted text-muted-foreground',
  moderator: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  super_admin: 'bg-destructive/10 text-destructive',
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

function UserEditSheet({
  user: target,
  open,
  onClose,
  onSaved,
  isSuperAdmin,
}: {
  user: UserItem | null
  open: boolean
  onClose: () => void
  onSaved: () => void
  isSuperAdmin: boolean
}) {
  const [status, setStatus] = useState<'active' | 'suspended'>('active')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (target) {
      setStatus(target.status)
      setRole(target.role)
    }
  }, [target])

  async function handleSave() {
    if (!target) return
    setLoading(true)
    try {
      const body: Record<string, string> = {}
      if (status !== target.status) body.status = status
      if (isSuperAdmin && role !== target.role) body.role = role
      if (!Object.keys(body).length) { onClose(); return }
      await api.patch(`/admin/console/users/${target._id}`, body)
      toast.success('User updated')
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="font-heading text-base font-semibold">Edit User</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {target?.name} · {target?.email}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-6 py-5 space-y-5">
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Account Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'suspended')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />Active</span>
                </SelectItem>
                <SelectItem value="suspended">
                  <span className="flex items-center gap-2"><Ban className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />Suspended</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isSuperAdmin && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-1.5 block">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v ?? '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Role changes take effect immediately.</p>
            </div>
          )}
        </div>
        <SheetFooter className="border-t border-border px-6 py-4 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function UsersTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [items, setItems] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const LIMIT = 20
  const COLS = 5

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await api.get<{ ok: boolean; data: { items: UserItem[]; total: number } }>(`/admin/console/users?${params}`)
      setItems(res.data.data.items)
      setTotal(res.data.data.total)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter, refreshKey])

  useEffect(() => { fetch() }, [fetch])

  const pages = Math.ceil(total / LIMIT)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{total} user{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={COLS} />
            ) : error ? (
              <ErrorRow cols={COLS} message={error} onRetry={fetch} />
            ) : !items.length ? (
              <EmptyRow cols={COLS} icon={Users} message="No users found" />
            ) : (
              items.map((u) => (
                <tr key={u._id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {u.status === 'active'
                        ? <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
                        : <Ban className="h-3 w-3" strokeWidth={1.5} />}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => { setEditUser(u); setEditOpen(true) }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <UserEditSheet
        user={editUser}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  )
}

// ── Package Tab (Milestone 3.4 — super_admin) ─────────────────────────────────

const BLANK_PKG: Omit<PackageItem, '_id' | 'is_active'> = {
  name: '', label: '', duration_days: 30, weight: 1, price: 0,
  is_featured: false, homepage_placement: false, refresh_rule: 'none',
  benefits: [], sort_order: 0,
}

function PackageSheet({
  item,
  open,
  onClose,
  onSaved,
}: {
  item: PackageItem | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({ ...BLANK_PKG })
  const [benefitsText, setBenefitsText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && item) {
      const { _id: _i, is_active: _a, benefits, ...rest } = item
      setForm({ ...BLANK_PKG, ...rest })
      setBenefitsText(benefits.join('\n'))
    } else if (open) {
      setForm({ ...BLANK_PKG })
      setBenefitsText('')
    }
  }, [open, item])

  function field(key: keyof typeof BLANK_PKG) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm((f) => ({ ...f, [key]: val }))
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const benefits = benefitsText.split('\n').map((s) => s.trim()).filter(Boolean)
      const body = { ...form, benefits }
      if (item) {
        await api.patch(`/admin/console/packages/${item._id}`, body)
        toast.success('Package updated')
      } else {
        await api.post('/admin/console/packages', body)
        toast.success('Package created')
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to save package')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="font-heading text-base font-semibold">{item ? 'Edit Package' : 'New Package'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Name</Label>
              <Input value={form.name} onChange={field('name')} placeholder="basic" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Label</Label>
              <Input value={form.label} onChange={field('label')} placeholder="Basic Plan" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Price (PKR)</Label>
              <Input type="number" value={form.price} onChange={field('price')} min={0} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Duration (days)</Label>
              <Input type="number" value={form.duration_days} onChange={field('duration_days')} min={1} max={365} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Weight (1–10)</Label>
              <Input type="number" value={form.weight} onChange={field('weight')} min={1} max={10} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={field('sort_order')} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Refresh Rule</Label>
            <select
              value={form.refresh_rule}
              onChange={field('refresh_rule')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">None</option>
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          {form.refresh_rule !== 'none' && (
            <div>
              <Label className="text-xs mb-1 block">Refresh every (days)</Label>
              <Input type="number" value={form.refresh_days ?? ''} onChange={field('refresh_days')} min={1} />
            </div>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={field('is_featured')} className="h-4 w-4 accent-accent" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.homepage_placement} onChange={field('homepage_placement')} className="h-4 w-4 accent-accent" />
              Homepage placement
            </label>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Benefits (one per line)</Label>
            <Textarea
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              placeholder="3 photos&#10;30 day duration&#10;Priority listing"
              rows={4}
              className="text-sm font-mono"
            />
          </div>
        </div>
        <SheetFooter className="border-t border-border px-6 py-4 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
            onClick={handleSave}
            disabled={loading || !form.name || !form.label}
          >
            {loading ? 'Saving…' : item ? 'Save Changes' : 'Create Package'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PackagesTab() {
  const [items, setItems] = useState<PackageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<PackageItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const COLS = 6

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: { items: PackageItem[] } }>('/admin/console/packages')
      setItems(res.data.data.items)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load packages')
    } finally { setLoading(false) }
  }, [refreshKey])

  useEffect(() => { fetch() }, [fetch])

  async function handleToggle(pkg: PackageItem) {
    try {
      await api.patch(`/admin/console/packages/${pkg._id}/toggle`)
      toast.success(pkg.is_active ? 'Package deactivated' : 'Package activated')
      setRefreshKey((k) => k + 1)
    } catch {
      toast.error('Failed to toggle package')
    }
  }

  function openCreate() { setEditItem(null); setSheetOpen(true) }
  function openEdit(pkg: PackageItem) { setEditItem(pkg); setSheetOpen(true) }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{items.length} package{items.length !== 1 ? 's' : ''}</span>
        <Button size="sm" className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
          New Package
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {['Name', 'Price', 'Duration', 'Weight', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton cols={COLS} />
              : error ? <ErrorRow cols={COLS} message={error} onRetry={fetch} />
              : !items.length ? <EmptyRow cols={COLS} icon={Package} message="No packages yet" />
              : items.map((pkg) => (
                <tr key={pkg._id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{pkg.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{pkg.name}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatPrice(pkg.price)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{pkg.duration_days}d</td>
                  <td className="px-4 py-3 whitespace-nowrap">{pkg.weight}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      pkg.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(pkg)}>
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleToggle(pkg)}>
                        {pkg.is_active
                          ? <ToggleRight className="h-4 w-4 text-success" strokeWidth={1.5} />
                          : <ToggleLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <PackageSheet
        item={editItem}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
    </>
  )
}

// ── Categories Tab (Milestone 3.4) ────────────────────────────────────────────

function TaxonomySheet({
  item,
  open,
  onClose,
  onSaved,
  type,
}: {
  item: CategoryItem | CityItem | null
  open: boolean
  onClose: () => void
  onSaved: () => void
  type: 'category' | 'city'
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && item) {
      setName(item.name)
      setSlug(item.slug)
      setIcon((item as CategoryItem).icon ?? '')
      setSortOrder(String(item.sort_order))
    } else if (open) {
      setName(''); setSlug(''); setIcon(''); setSortOrder('0')
    }
  }, [open, item])

  async function handleSave() {
    setLoading(true)
    try {
      const base = type === 'category' ? '/admin/console/categories' : '/admin/console/cities'
      const body: Record<string, unknown> = { name, sort_order: Number(sortOrder) }
      if (slug.trim()) body.slug = slug.trim()
      if (type === 'category' && icon.trim()) body.icon = icon.trim()
      if (item) {
        await api.patch(`${base}/${item._id}`, body)
        toast.success(`${type === 'category' ? 'Category' : 'City'} updated`)
      } else {
        await api.post(base, body)
        toast.success(`${type === 'category' ? 'Category' : 'City'} created`)
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const label = type === 'category' ? 'Category' : 'City'

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="font-heading text-base font-semibold">{item ? `Edit ${label}` : `New ${label}`}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 px-6 py-5 space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${label} name`} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Slug <span className="text-muted-foreground">(auto-generated if blank)</span></Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" className="font-mono text-sm" />
          </div>
          {type === 'category' && (
            <div>
              <Label className="text-xs mb-1 block">Icon name (Lucide)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. car, home, laptop" />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1 block">Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
        </div>
        <SheetFooter className="border-t border-border px-6 py-4 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98]"
            onClick={handleSave}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Saving…' : item ? 'Save Changes' : `Create ${label}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function TaxonomyTab({ type }: { type: 'category' | 'city' }) {
  const [items, setItems] = useState<(CategoryItem | CityItem)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<CategoryItem | CityItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const base = type === 'category' ? '/admin/console/categories' : '/admin/console/cities'
  const Icon = type === 'category' ? FolderOpen : Building2
  const label = type === 'category' ? 'Category' : 'City'
  const COLS = type === 'category' ? 5 : 4

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: { items: (CategoryItem | CityItem)[] } }>(base)
      setItems(res.data.data.items)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? `Failed to load ${label.toLowerCase()}s`)
    } finally { setLoading(false) }
  }, [base, label, refreshKey])

  useEffect(() => { fetch() }, [fetch])

  async function handleToggle(item: CategoryItem | CityItem) {
    try {
      await api.patch(`${base}/${item._id}/toggle`)
      toast.success(item.is_active ? `${label} deactivated` : `${label} activated`)
      setRefreshKey((k) => k + 1)
    } catch {
      toast.error(`Failed to toggle ${label.toLowerCase()}`)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{items.length} {label.toLowerCase()}{items.length !== 1 ? 's' : ''}</span>
        <Button size="sm" className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => { setEditItem(null); setSheetOpen(true) }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
          New {label}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slug</th>
              {type === 'category' && (
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon</th>
              )}
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton cols={COLS} />
              : error ? <ErrorRow cols={COLS} message={error} onRetry={fetch} />
              : !items.length ? <EmptyRow cols={COLS} icon={Icon} message={`No ${label.toLowerCase()}s yet`} />
              : items.map((item) => (
                <tr key={item._id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">order: {item.sort_order}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{item.slug}</span>
                  </td>
                  {type === 'category' && (
                    <td className="px-4 py-3 text-xs text-muted-foreground">{(item as CategoryItem).icon ?? '—'}</td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditItem(item); setSheetOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleToggle(item)}>
                        {item.is_active
                          ? <ToggleRight className="h-4 w-4 text-success" strokeWidth={1.5} />
                          : <ToggleLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <TaxonomySheet
        item={editItem}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
        type={type}
      />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'super_admin'

  const [paymentCount, setPaymentCount] = useState(0)
  const [publishCount, setPublishCount] = useState(0)
  const [countsLoaded, setCountsLoaded] = useState(false)

  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null)
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)

  const [selectedAd, setSelectedAd] = useState<PopulatedAd | null>(null)
  const [publishSheetOpen, setPublishSheetOpen] = useState(false)

  const [paymentKey, setPaymentKey] = useState(0)
  const [publishKey, setPublishKey] = useState(0)

  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; data: { total: number } }>('/admin/payment-queue?limit=1'),
      api.get<{ ok: boolean; data: { total: number } }>('/admin/publish-queue?limit=1'),
    ]).then(([p, pub]) => {
      setPaymentCount(p.data.data.total)
      setPublishCount(pub.data.data.total)
      setCountsLoaded(true)
    }).catch(() => setCountsLoaded(true))
  }, [paymentKey, publishKey])

  function openPaymentSheet(p: PaymentItem) {
    setSelectedPayment(p)
    setPaymentSheetOpen(true)
  }

  function openPublishSheet(ad: PopulatedAd) {
    setSelectedAd(ad)
    setPublishSheetOpen(true)
  }

  function onPaymentVerified() {
    setPaymentKey((k) => k + 1)
    setPublishKey((k) => k + 1)
  }

  function onAdPublished() {
    setPublishKey((k) => k + 1)
    setPaymentKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verify payments, manage publishing, and configure the platform</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Payments Pending" value={countsLoaded ? paymentCount : 0} accent />
        <StatCard icon={CalendarClock} label="Ready to Publish" value={countsLoaded ? publishCount : 0} accent />
        <StatCard icon={CheckCircle2} label="Verified Today" value={0} />
        <StatCard icon={Zap} label="Published Today" value={0} />
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-muted p-1">
          <TabsTrigger value="payments" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Payment Queue
            {countsLoaded && paymentCount > 0 && (
              <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">{paymentCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="publishing" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Publishing
            {countsLoaded && publishCount > 0 && (
              <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">{publishCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Users
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="packages" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Packages
            </TabsTrigger>
          )}
          <TabsTrigger value="categories" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Categories
          </TabsTrigger>
          <TabsTrigger value="cities" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Cities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <PaymentQueueTab key={paymentKey} onSelect={openPaymentSheet} />
        </TabsContent>

        <TabsContent value="publishing">
          <PublishQueueTab key={publishKey} onSelect={openPublishSheet} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab isSuperAdmin={isSuperAdmin} />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="packages">
            <PackagesTab />
          </TabsContent>
        )}

        <TabsContent value="categories">
          <TaxonomyTab type="category" />
        </TabsContent>

        <TabsContent value="cities">
          <TaxonomyTab type="city" />
        </TabsContent>
      </Tabs>

      <PaymentSheet
        payment={selectedPayment}
        open={paymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
        onVerified={onPaymentVerified}
      />
      <PublishSheet
        ad={selectedAd}
        open={publishSheetOpen}
        onClose={() => setPublishSheetOpen(false)}
        onPublished={onAdPublished}
      />
    </div>
  )
}
