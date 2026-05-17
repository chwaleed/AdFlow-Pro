import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  CreditCard, Upload, AlertTriangle, ArrowLeft, CheckCircle2,
  DollarSign, FileText, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import api from '@/lib/api'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdSummary {
  _id: string
  title: string
  status: string
  package_id?: {
    _id: string
    name: string
    label: string
    price: number
    duration_days: number
  }
}

interface FormValues {
  amount: string
  method: string
  transaction_ref: string
  sender_name: string
  screenshot?: FileList
}

const PAYMENT_METHODS = [
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]

function formatPrice(n?: number) {
  if (!n) return null
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n)
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()

  const [ad, setAd] = useState<AdSummary | null>(null)
  const [adLoading, setAdLoading] = useState(true)
  const [adError, setAdError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: { method: 'easypaisa' },
  })

  const watchScreenshot = watch('screenshot')

  useEffect(() => {
    if (!watchScreenshot?.[0]) return
    const url = URL.createObjectURL(watchScreenshot[0])
    setScreenshotPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [watchScreenshot])

  useEffect(() => {
    if (!id) return
    setAdLoading(true)
    api.get<{ ok: boolean; data: { ad: AdSummary } }>(`/client/ads/${id}`)
      .then((res) => {
        setAd(res.data.data.ad)
        if (res.data.data.ad.package_id?.price) {
          setValue('amount', String(res.data.data.ad.package_id.price))
        }
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        setAdError(msg ?? 'Failed to load ad details')
      })
      .finally(() => setAdLoading(false))
  }, [id, setValue])

  async function onSubmit(values: FormValues) {
    if (!id) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('ad_id', id)
      fd.append('amount', values.amount)
      fd.append('method', values.method)
      fd.append('transaction_ref', values.transaction_ref)
      fd.append('sender_name', values.sender_name)
      if (values.screenshot?.[0]) {
        fd.append('screenshot', values.screenshot[0])
      }

      await api.post('/client/payments', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSubmitted(true)
      toast.success('Payment submitted! An admin will verify it shortly.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to submit payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-5">
          <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">Payment Submitted!</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your payment proof has been submitted. An admin will review and verify it typically within 24 hours.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/ads/new">Post Another Ad</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (adLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-5 w-32 mb-6" />
        <Skeleton className="h-32 rounded-xl mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (adError || !ad) {
    return (
      <div className="flex flex-col items-center py-20 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-destructive/50 mb-3" strokeWidth={1.5} />
        <p className="font-heading text-sm font-semibold text-foreground">Ad not found</p>
        <p className="mt-1 text-sm text-muted-foreground">{adError}</p>
        <Button size="sm" variant="outline" className="mt-4" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">

        <Link to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />Back to Dashboard
        </Link>

        <h1 className="font-heading text-xl font-bold text-foreground mb-6">Submit Payment</h1>

        {/* Ad summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ad</p>
            <p className="font-heading text-sm font-semibold text-foreground">{ad.title}</p>
            {ad.package_id && (
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{ad.package_id.label}</p>
                  <p>Package</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{ad.package_id.duration_days} days</p>
                  <p>Duration</p>
                </div>
                <div>
                  <p className="font-heading font-bold text-accent">{formatPrice(ad.package_id.price) ?? 'Free'}</p>
                  <p>Amount due</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-heading text-sm font-semibold text-foreground">Payment Details</h2>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Payment method */}
              <div className="space-y-1.5">
                <Label htmlFor="method" className="text-sm">Payment Method</Label>
                <Select defaultValue="easypaisa" onValueChange={(v) => setValue('method', v ?? 'easypaisa')}>
                  <SelectTrigger id="method" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-sm flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />Amount (PKR)
                </Label>
                <Input
                  id="amount" type="number" step="1" min="0" className="h-10"
                  {...register('amount', { required: 'Amount is required', min: { value: 0, message: 'Invalid amount' } })}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <Separator />

              {/* Sender name */}
              <div className="space-y-1.5">
                <Label htmlFor="sender_name" className="text-sm flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" strokeWidth={1.5} />Sender Name
                </Label>
                <Input
                  id="sender_name" placeholder="As appears on receipt" className="h-10"
                  {...register('sender_name', { required: 'Sender name is required' })}
                />
                {errors.sender_name && <p className="text-xs text-destructive">{errors.sender_name.message}</p>}
              </div>

              {/* Transaction ref */}
              <div className="space-y-1.5">
                <Label htmlFor="transaction_ref" className="text-sm flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />Transaction Reference
                </Label>
                <Input
                  id="transaction_ref" placeholder="e.g. TXN-123456" className="h-10 font-mono"
                  {...register('transaction_ref', { required: 'Transaction reference is required' })}
                />
                {errors.transaction_ref && <p className="text-xs text-destructive">{errors.transaction_ref.message}</p>}
                <p className="text-xs text-muted-foreground">Must be unique per payment</p>
              </div>

              {/* Screenshot */}
              <div className="space-y-1.5">
                <Label htmlFor="screenshot" className="text-sm flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />Payment Screenshot (optional)
                </Label>
                <div className="relative">
                  <input
                    id="screenshot" type="file" accept="image/*"
                    className="h-10 w-full cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:h-6 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:text-xs file:font-medium file:text-foreground hover:border-accent/50 focus:outline-none focus:ring-1 focus:ring-ring"
                    {...register('screenshot')}
                  />
                </div>
                {screenshotPreview && (
                  <img src={screenshotPreview} alt="Preview"
                    className="mt-2 h-32 w-full rounded-lg object-cover border border-border" />
                )}
              </div>

              <Button
                type="submit" className="w-full h-10 bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={submitting}
              >
                {submitting
                  ? <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                      Submitting…
                    </span>
                  : <>
                      <CreditCard className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Submit Payment Proof
                    </>
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
