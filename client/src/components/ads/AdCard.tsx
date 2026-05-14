import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2, Send, CreditCard, RefreshCw, ImageOff, MapPin, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AdStatusBadge from './AdStatusBadge'
import type { Ad } from '@/lib/types'

interface Props {
  ad: Ad
  onDelete?: (id: string) => void
  onSubmit?: (id: string) => void
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPrice(price?: number) {
  if (!price) return null
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(price)
}

export default function AdCard({ ad, onDelete, onSubmit }: Props) {
  const thumb = ad.media?.[0]?.thumbnail_url ?? ad.media?.[0]?.original_url
  const price = formatPrice(ad.price)
  const category = typeof ad.category_id === 'object' ? ad.category_id?.name : null
  const city = typeof ad.city_id === 'object' ? ad.city_id?.name : null
  const pkg = typeof ad.package_id === 'object' ? ad.package_id : null

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="relative h-auto w-28 shrink-0 sm:w-36 bg-muted flex items-center justify-center">
          {thumb ? (
            <img src={thumb} alt={ad.title} className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <CardContent className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-1 sm:text-base">
                {ad.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
            </div>
            <AdStatusBadge status={ad.status} className="shrink-0" />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {category && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />{category}
              </span>
            )}
            {city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{city}
              </span>
            )}
            {price && (
              <span className="font-semibold text-foreground">{price}</span>
            )}
            {pkg && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent text-xs font-medium">
                {pkg.label}
              </span>
            )}
          </div>

          {/* Date row + actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Posted {formatDate(ad.createdAt)}</span>
              {ad.expire_at && <span>Expires {formatDate(ad.expire_at)}</span>}
            </div>

            {/* Status-aware actions */}
            <div className="flex items-center gap-1">
              {ad.status === 'draft' && (
                <>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                    <Link to={`/ads/${ad._id}/edit`}><Pencil className="mr-1 h-3 w-3" />Edit</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => onSubmit?.(ad._id)}
                  >
                    <Send className="mr-1 h-3 w-3" />Submit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete?.(ad._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {(ad.status === 'submitted' || ad.status === 'under_review') && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                  <Link to={`/ads/${ad._id}`}><Eye className="mr-1 h-3 w-3" />View</Link>
                </Button>
              )}
              {ad.status === 'payment_pending' && (
                <>
                  <Button size="sm" className="h-7 px-2 text-xs bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20" asChild>
                    <Link to={`/ads/${ad._id}/pay`}><CreditCard className="mr-1 h-3 w-3" />Submit Payment</Link>
                  </Button>
                </>
              )}
              {(ad.status === 'scheduled' || ad.status === 'published') && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                  <Link to={`/ads/${ad.slug}`}><Eye className="mr-1 h-3 w-3" />View Live</Link>
                </Button>
              )}
              {(ad.status === 'expired') && (
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                  <Link to="/packages"><RefreshCw className="mr-1 h-3 w-3" />Renew</Link>
                </Button>
              )}
              {ad.status === 'rejected' && (
                <>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                    <Link to={`/ads/${ad._id}`}><Eye className="mr-1 h-3 w-3" />View Reason</Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                    <Link to={`/ads/${ad._id}/edit`}><Pencil className="mr-1 h-3 w-3" />Edit</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
