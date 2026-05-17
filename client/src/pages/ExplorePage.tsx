import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  MapPin, Tag, BadgeCheck, AlertTriangle, Frown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdItem {
  _id: string
  title: string
  slug: string
  description: string
  price?: number
  is_featured: boolean
  view_count: number
  publish_at?: string
  expire_at?: string
  category_id?: { _id: string; name: string; slug: string }
  city_id?: { _id: string; name: string; slug: string }
  package_id?: { _id: string; name: string; label: string }
  primary_media?: { original_url: string; thumbnail_url?: string; source_type: string }
  createdAt: string
}

interface TaxonomyItem {
  _id: string
  name: string
  slug: string
  is_active: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(n?: number) {
  if (!n) return null
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

function timeLeft(expire_at?: string) {
  if (!expire_at) return null
  const diff = new Date(expire_at).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  if (days > 30) return null
  return `${days}d left`
}

// ── Ad Card ────────────────────────────────────────────────────────────────────

function AdCard({ ad }: { ad: AdItem }) {
  const thumb = ad.primary_media?.thumbnail_url || ad.primary_media?.original_url
  const expiry = timeLeft(ad.expire_at)

  return (
    <Link to={`/ads/${ad.slug}`} className="group block">
      <Card className="overflow-hidden h-full transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {thumb ? (
            <img
              src={thumb} alt={ad.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
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
          {expiry && expiry !== 'Expired' && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs px-1.5 py-0">{expiry}</Badge>
          )}
        </div>
        <CardContent className="p-3.5">
          <p className="font-heading text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {ad.title}
          </p>
          {ad.price && (
            <p className="mt-1 font-heading text-base font-bold text-accent">{formatPrice(ad.price)}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {ad.city_id && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {ad.city_id.name}
              </span>
            )}
            {ad.category_id && (
              <span className="flex items-center gap-0.5">
                <Tag className="h-3 w-3" strokeWidth={1.5} />
                {ad.category_id.name}
              </span>
            )}
          </div>
          {ad.package_id && (
            <Badge variant="outline" className="mt-2 text-xs px-1.5 py-0">{ad.package_id.label}</Badge>
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
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  )
}

// ── Filters sidebar ────────────────────────────────────────────────────────────

interface Filters {
  q: string
  category: string
  city: string
  sort: string
  minPrice: string
  maxPrice: string
}

function FilterSidebar({
  filters, onApply, categories, cities,
}: {
  filters: Filters
  onApply: (f: Filters) => void
  categories: TaxonomyItem[]
  cities: TaxonomyItem[]
}) {
  const [local, setLocal] = useState<Filters>(filters)

  useEffect(() => { setLocal(filters) }, [filters])

  function set(key: keyof Filters, val: string) {
    setLocal((prev) => ({ ...prev, [key]: val }))
  }

  function clear() {
    const blank: Filters = { q: '', category: '', city: '', sort: 'rank', minPrice: '', maxPrice: '' }
    setLocal(blank)
    onApply(blank)
  }

  const hasActive = filters.category || filters.city || filters.minPrice || filters.maxPrice

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onApply(local) }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />Filters
        </h2>
        {hasActive && (
          <button type="button" onClick={clear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3 w-3" strokeWidth={1.5} />Clear
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Category</label>
        <Select value={local.category || 'all'} onValueChange={(v) => set('category', !v || v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c._id} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">City</label>
        <Select value={local.city || 'all'} onValueChange={(v) => set('city', !v || v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => <SelectItem key={c._id} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Sort by</label>
        <Select value={local.sort} onValueChange={(v) => set('sort', v ?? 'rank')}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Most Relevant</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Price range (PKR)</label>
        <div className="flex gap-2">
          <Input
            type="number" placeholder="Min" value={local.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="number" placeholder="Max" value={local.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-8 text-sm">Apply Filters</Button>
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [ads, setAds] = useState<AdItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [categories, setCategories] = useState<TaxonomyItem[]>([])
  const [cities, setCities] = useState<TaxonomyItem[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    city: searchParams.get('city') ?? '',
    sort: searchParams.get('sort') ?? 'rank',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
  })

  const searchInput = useRef<HTMLInputElement>(null)

  // Load taxonomy once
  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; data: TaxonomyItem[] }>('/categories'),
      api.get<{ ok: boolean; data: TaxonomyItem[] }>('/cities'),
    ]).then(([catRes, cityRes]) => {
      setCategories(catRes.data.data.filter((c) => c.is_active))
      setCities(cityRes.data.data.filter((c) => c.is_active))
    }).catch(() => {})
  }, [])

  const fetchAds = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12', sort: f.sort })
      if (f.q) params.set('q', f.q)
      if (f.category) params.set('category', f.category)
      if (f.city) params.set('city', f.city)
      if (f.minPrice) params.set('minPrice', f.minPrice)
      if (f.maxPrice) params.set('maxPrice', f.maxPrice)
      const res = await api.get<{ ok: boolean; data: { ads: AdItem[]; total: number; pages: number } }>(
        `/ads?${params}`
      )
      setAds(res.data.data.ads)
      setTotal(res.data.data.total)
      setPages(res.data.data.pages)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg ?? 'Failed to load ads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAds(filters, page) }, [fetchAds, filters, page])

  function applyFilters(f: Filters) {
    setFilters(f)
    setPage(1)
    setSidebarOpen(false)
    const sp: Record<string, string> = {}
    if (f.q) sp.q = f.q
    if (f.category) sp.category = f.category
    if (f.city) sp.city = f.city
    if (f.sort && f.sort !== 'rank') sp.sort = f.sort
    if (f.minPrice) sp.minPrice = f.minPrice
    if (f.maxPrice) sp.maxPrice = f.maxPrice
    setSearchParams(sp)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Search bar */}
        <form className="mb-6 flex gap-2" onSubmit={(e) => {
          e.preventDefault()
          const q = searchInput.current?.value ?? ''
          applyFilters({ ...filters, q })
        }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              ref={searchInput}
              defaultValue={filters.q}
              placeholder="Search ads…"
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" className="h-10">Search</Button>
          <Button type="button" variant="outline" className="h-10 lg:hidden"
            onClick={() => setSidebarOpen((o) => !o)}>
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </form>

        <div className="flex gap-6">

          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full max-w-[220px] shrink-0`}>
            <div className="sticky top-4 rounded-xl border border-border bg-card p-4">
              <FilterSidebar
                filters={filters} onApply={applyFilters}
                categories={categories} cities={cities}
              />
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${total} listing${total !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {error ? (
              <div className="flex flex-col items-center py-20 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive/50 mb-3" strokeWidth={1.5} />
                <p className="font-heading text-sm font-semibold text-foreground">Failed to load ads</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => fetchAds(filters, page)}>
                  Try again
                </Button>
              </div>
            ) : loading ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <AdCardSkeleton key={i} />)}
              </div>
            ) : ads.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Frown className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
                <p className="font-heading text-sm font-semibold text-foreground">No listings found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {ads.map((ad) => <AdCard key={ad._id} ad={ad} />)}
              </div>
            )}

            {/* Pagination */}
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
          </main>
        </div>
      </div>
    </div>
  )
}
