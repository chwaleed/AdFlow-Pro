import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, BarChart2, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AdCard from '@/components/ads/AdCard'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import type { Ad, AdStatus } from '@/lib/types'
import { toast } from 'sonner'

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS: { id: string; label: string; statuses: AdStatus[] | null }[] = [
  { id: 'all',       label: 'All',          statuses: null },
  { id: 'draft',     label: 'Drafts',       statuses: ['draft'] },
  { id: 'review',    label: 'In Review',    statuses: ['submitted', 'under_review'] },
  { id: 'payment',   label: 'Payment',      statuses: ['payment_pending', 'payment_submitted', 'payment_verified'] },
  { id: 'published', label: 'Published',    statuses: ['scheduled', 'published'] },
  { id: 'expired',   label: 'Expired',      statuses: ['expired', 'archived'] },
  { id: 'rejected',  label: 'Rejected',     statuses: ['rejected'] },
]

// ── Stats ─────────────────────────────────────────────────────────────────────

interface Stats {
  total: number
  published: number
  pending: number
  views: number
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-heading text-xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Ad list with states ───────────────────────────────────────────────────────

function AdList({
  ads,
  loading,
  error,
  emptyLabel,
  emptyAction,
  onDelete,
  onSubmit,
}: {
  ads: Ad[]
  loading: boolean
  error: string | null
  emptyLabel: string
  emptyAction?: React.ReactNode
  onDelete: (id: string) => void
  onSubmit: (id: string) => void
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="flex gap-0">
              <Skeleton className="h-24 w-28 shrink-0 rounded-none sm:w-36" />
              <CardContent className="flex-1 p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!ads.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">{emptyLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ads you post will appear here once they match this status.
        </p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <AdCard key={ad._id} ad={ad} onDelete={onDelete} onSubmit={onSubmit} />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ ok: boolean; data: { items: Ad[] } }>('/client/ads')
      setAds(res.data.data?.items ?? [])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAds() }, [fetchAds])

  async function handleDelete(id: string) {
    try {
      await api.delete(`/client/ads/${id}`)
      setAds((prev) => prev.filter((a) => a._id !== id))
      toast.success('Draft deleted')
    } catch {
      toast.error('Could not delete ad')
    }
  }

  async function handleSubmit(id: string) {
    try {
      await api.post(`/client/ads/${id}/submit`)
      await fetchAds()
      toast.success('Ad submitted for review')
    } catch {
      toast.error('Could not submit ad')
    }
  }

  const stats: Stats = {
    total: ads.length,
    published: ads.filter((a) => a.status === 'published').length,
    pending: ads.filter((a) => ['submitted', 'under_review', 'payment_pending', 'payment_submitted', 'payment_verified'].includes(a.status)).length,
    views: ads.reduce((sum, a) => sum + (a.view_count ?? 0), 0),
  }

  function adsForTab(statuses: AdStatus[] | null) {
    if (!statuses) return ads
    return ads.filter((a) => statuses.includes(a.status))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            My Listings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0" asChild>
          <Link to="/ads/new">
            <Plus className="mr-1.5 h-4 w-4" /> Post an Ad
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={FileText}  label="Total Ads"      value={stats.total} />
        <StatCard icon={BarChart2} label="Published"      value={stats.published} />
        <StatCard icon={Clock}     label="In Progress"    value={stats.pending} />
        <StatCard icon={Eye}       label="Total Views"    value={stats.views} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1 bg-muted p-1">
          {TABS.map((tab) => {
            const count = adsForTab(tab.statuses).length
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {tab.label}
                {!loading && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <AdList
              ads={adsForTab(tab.statuses)}
              loading={loading}
              error={error}
              emptyLabel={`No ${tab.label.toLowerCase()} ads yet`}
              emptyAction={
                tab.id === 'all' || tab.id === 'draft' ? (
                  <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                    <Link to="/ads/new"><Plus className="mr-1.5 h-4 w-4" />Post Your First Ad</Link>
                  </Button>
                ) : undefined
              }
              onDelete={handleDelete}
              onSubmit={handleSubmit}
            />
          </TabsContent>
        ))}
      </Tabs>

    </div>
  )
}
