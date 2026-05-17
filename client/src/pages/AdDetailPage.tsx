import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Tag, Package, Eye, Clock, BadgeCheck, AlertTriangle,
  ChevronLeft, ChevronRight, Phone, DollarSign, Flag, ArrowLeft,
  User, CalendarDays, ImageOff,
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
import api from '@/lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Media {
  _id: string
  source_type: 's3' | 'youtube' | 'external' | 'local'
  original_url: string
  thumbnail_url?: string
  is_primary: boolean
}

interface AdDetail {
  ad: {
    _id: string
    title: string
    slug: string
    description: string
    price?: number
    phone?: string
    is_featured: boolean
    view_count: number
    publish_at?: string
    expire_at?: string
    category_id?: { _id: string; name: string; slug: string }
    city_id?: { _id: string; name: string; slug: string }
    package_id?: { _id: string; name: string; label: string; duration_days: number; price: number }
    user_id: { _id: string; name: string }
    createdAt: string
  }
  media: Media[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(n?: number) {
  if (!n) return null
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

function expiresIn(expire_at?: string) {
  if (!expire_at) return null
  const diff = new Date(expire_at).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} remaining`
  return `${hours} hour${hours !== 1 ? 's' : ''} remaining`
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Image gallery ──────────────────────────────────────────────────────────────

function ImageGallery({ media }: { media: Media[] }) {
  const [active, setActive] = useState(0)

  if (media.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="h-10 w-10" strokeWidth={1} />
          <span className="text-sm">No images</span>
        </div>
      </div>
    )
  }

  const current = media[active]
  const src = current.thumbnail_url || current.original_url

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
        <img
          src={src} alt=""
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {media.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => setActive((a) => Math.min(media.length - 1, a + 1))}
              disabled={active === media.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {active + 1} / {media.length}
            </span>
          </>
        )}
      </div>
      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => {
            const th = m.thumbnail_url || m.original_url
            return (
              <button
                key={m._id}
                onClick={() => setActive(i)}
                className={`shrink-0 h-16 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                  i === active ? 'border-accent' : 'border-border hover:border-accent/40'
                }`}
              >
                <img src={th} alt="" className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Report dialog ──────────────────────────────────────────────────────────────

function ReportDialog({
  adId, open, onClose,
}: {
  adId: string; open: boolean; onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()

  async function submit() {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await api.post(`/ads/${adId}/report`, { reason })
      toast.success('Report submitted')
      onClose()
      setReason('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-semibold">Report this ad</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isAuthenticated
              ? 'Describe why this ad should be reviewed.'
              : 'You need to be logged in to report an ad.'}
          </DialogDescription>
        </DialogHeader>
        {isAuthenticated && (
          <div className="py-2">
            <Textarea
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue…" rows={4} className="text-sm" autoFocus
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {isAuthenticated && (
            <Button
              variant="destructive" onClick={submit}
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </Button>
          )}
          {!isAuthenticated && (
            <Button asChild>
              <Link to="/login">Log in to Report</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<AdDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.get<{ ok: boolean; data: AdDetail }>(`/ads/${slug}`)
      .then((res) => setData(res.data.data))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        setError(msg ?? 'Ad not found')
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <PageSkeleton />

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive/50 mb-4" strokeWidth={1.5} />
        <h1 className="font-heading text-lg font-semibold text-foreground">Ad not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? 'This listing may have expired or been removed.'}</p>
        <Button className="mt-6" asChild>
          <Link to="/ads"><ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />Browse all ads</Link>
        </Button>
      </div>
    )
  }

  const { ad, media } = data
  const expiry = expiresIn(ad.expire_at)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/ads" className="hover:text-foreground transition-colors">Browse</Link>
          {ad.category_id && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/categories/${ad.category_id.slug}`} className="hover:text-foreground transition-colors">
                {ad.category_id.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground line-clamp-1">{ad.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

          {/* Left: gallery + description */}
          <div className="space-y-6">
            <ImageGallery media={media} />

            <div>
              <div className="flex items-start gap-3 flex-wrap mb-3">
                {ad.is_featured && (
                  <Badge className="bg-accent text-accent-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />Featured
                  </Badge>
                )}
                {ad.package_id && (
                  <Badge variant="outline">{ad.package_id.label}</Badge>
                )}
              </div>

              <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{ad.title}</h1>

              {ad.price && (
                <p className="mt-2 font-heading text-2xl font-bold text-accent">{formatPrice(ad.price)}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {ad.city_id && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <Link to={`/cities/${ad.city_id.slug}`} className="hover:text-foreground transition-colors">
                      {ad.city_id.name}
                    </Link>
                  </span>
                )}
                {ad.category_id && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <Link to={`/categories/${ad.category_id.slug}`} className="hover:text-foreground transition-colors">
                      {ad.category_id.name}
                    </Link>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {ad.view_count} views
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Posted {formatDate(ad.publish_at ?? ad.createdAt)}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="font-heading text-base font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{ad.description}</p>
            </div>

            {expiry && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">{expiry}</span>
              </div>
            )}

            {/* Report */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />
                Report this ad
              </button>
            </div>
          </div>

          {/* Right: seller + package */}
          <div className="space-y-4">

            {/* Seller card */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold text-foreground">{ad.user_id.name}</p>
                    <p className="text-xs text-muted-foreground">Seller</p>
                  </div>
                </div>

                {ad.phone && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <a href={`tel:${ad.phone}`} className="font-mono text-sm font-medium text-foreground hover:text-accent transition-colors">
                      {ad.phone}
                    </a>
                  </div>
                )}

                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <a href={ad.phone ? `tel:${ad.phone}` : '#'}>
                    <Phone className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Contact Seller
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Package badge */}
            {ad.package_id && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Listing Package</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    <span className="font-heading text-sm font-semibold text-foreground">{ad.package_id.label}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {ad.package_id.duration_days}-day listing
                    </div>
                    {ad.package_id.price > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {formatPrice(ad.package_id.price)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Safety tips */}
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-warning mb-2">Safety Tips</p>
                <ul className="space-y-1 text-xs text-foreground/80">
                  <li>• Meet in a safe, public location</li>
                  <li>• Verify the item before payment</li>
                  <li>• Never share personal banking details</li>
                  <li>• Be wary of deals that seem too good</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ReportDialog adId={ad._id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
