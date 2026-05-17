import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Tag, AlertTriangle, ChevronLeft, ChevronRight, ArrowLeft, Frown,
  MapPin, BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

interface AdItem {
  _id: string
  title: string
  slug: string
  description: string
  price?: number
  is_featured: boolean
  city_id?: { _id: string; name: string; slug: string }
  package_id?: { _id: string; name: string; label: string }
  primary_media?: { original_url: string; thumbnail_url?: string }
}

function formatPrice(n?: number) {
  if (!n) return null
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

function AdCard({ ad }: { ad: AdItem }) {
  const thumb = ad.primary_media?.thumbnail_url || ad.primary_media?.original_url
  return (
    <Link to={`/ads/${ad.slug}`} className="group block">
      <Card className="overflow-hidden h-full transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={ad.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Tag className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
            </div>
          )}
          {ad.is_featured && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-1.5 py-0">
              <BadgeCheck className="h-3 w-3 mr-0.5" strokeWidth={1.5} />Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-3.5">
          <p className="font-heading text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {ad.title}
          </p>
          {ad.price && <p className="mt-1 font-heading text-base font-bold text-accent">{formatPrice(ad.price)}</p>}
          {ad.city_id && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" strokeWidth={1.5} />{ad.city_id.name}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function AdCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="p-3.5 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </CardContent>
    </Card>
  )
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [ads, setAds] = useState<AdItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetch = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{
        ok: boolean
        data: { ads: AdItem[]; total: number; pages: number; category?: { name: string } }
      }>(`/categories/${slug}/ads?page=${page}&limit=12`)
      setAds(res.data.data.ads)
      setTotal(res.data.data.total)
      setPages(res.data.data.pages)
      if (res.data.data.category?.name) setCategoryName(res.data.data.category.name)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load category ads')
    } finally {
      setLoading(false)
    }
  }, [slug, page])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link to="/ads" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />Browse all
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Tag className="h-5 w-5 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">
                {categoryName || slug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h1>
              {!loading && <p className="text-sm text-muted-foreground">{total} listing{total !== 1 ? 's' : ''}</p>}
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive/50 mb-3" strokeWidth={1.5} />
            <p className="font-heading text-sm font-semibold text-foreground">Failed to load</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={fetch}>Try again</Button>
          </div>
        ) : loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <AdCardSkeleton key={i} />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Frown className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
            <p className="font-heading text-sm font-semibold text-foreground">No listings in this category</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {ads.map((ad) => <AdCard key={ad._id} ad={ad} />)}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || loading}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />Prev
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {pages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)}
              disabled={page === pages || loading}>
              Next<ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
