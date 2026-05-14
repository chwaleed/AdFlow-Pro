import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, CheckCircle, ImagePlus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import api from '@/lib/api'
import { toast } from 'sonner'

// ── Static data (replaced by API calls in Phase 2) ────────────────────────────

const CATEGORIES = [
  { value: 'vehicles',        label: 'Vehicles' },
  { value: 'property',        label: 'Property' },
  { value: 'electronics',     label: 'Electronics' },
  { value: 'furniture',       label: 'Furniture' },
  { value: 'jobs',            label: 'Jobs' },
  { value: 'services',        label: 'Services' },
  { value: 'fashion',         label: 'Fashion' },
  { value: 'home-appliances', label: 'Home Appliances' },
]

const CITIES = [
  { value: 'karachi',    label: 'Karachi' },
  { value: 'lahore',     label: 'Lahore' },
  { value: 'islamabad',  label: 'Islamabad' },
  { value: 'rawalpindi', label: 'Rawalpindi' },
  { value: 'peshawar',   label: 'Peshawar' },
  { value: 'quetta',     label: 'Quetta' },
]

const PACKAGES = [
  {
    id: 'basic',
    label: 'Basic',
    price: 'Free',
    duration: '30 days',
    benefits: ['30-day listing', 'Standard visibility', 'Up to 3 images'],
  },
  {
    id: 'standard',
    label: 'Standard',
    price: '₨999',
    duration: '60 days',
    benefits: ['60-day listing', 'Higher ranking', 'Up to 8 images', '1 manual refresh'],
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '₨2,499',
    duration: '90 days',
    popular: true,
    benefits: ['90-day listing', 'Featured + homepage', 'Up to 15 images', 'Auto-refresh', 'Priority review'],
  },
]

// ── Zod schema ────────────────────────────────────────────────────────────────

const detailsSchema = z.object({
  title:       z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  price:       z.string().optional(),
  phone:       z.string().optional(),
  category:    z.string().min(1, 'Please select a category'),
  city:        z.string().min(1, 'Please select a city'),
})

const formSchema = detailsSchema.extend({
  package_name: z.string().min(1, 'Please select a package'),
})

type FormValues = z.infer<typeof formSchema>

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = ['Details', 'Media', 'Package', 'Review']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <Progress value={((current + 1) / STEPS.length) * 100} className="h-1.5 mb-4" />
      <div className="flex items-center justify-between">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors ${
                idx < current
                  ? 'bg-accent border-accent text-accent-foreground'
                  : idx === current
                  ? 'border-accent text-accent bg-background'
                  : 'border-border text-muted-foreground bg-background'
              }`}
            >
              {idx < current ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            <span className={`text-xs hidden sm:block ${idx === current ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 1: Details ────────────────────────────────────────────────────────────

function StepDetails({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { register, formState: { errors }, setValue, watch } = form
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="title">Ad Title <span className="text-destructive">*</span></Label>
        <Input id="title" placeholder="e.g. Toyota Corolla 2020 — Excellent Condition" className="mt-1.5" {...register('title')} />
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Describe your item or service in detail — condition, features, reason for selling..."
          className="mt-1.5 resize-none"
          {...register('description')}
        />
        {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Price (PKR)</Label>
          <Input id="price" type="number" placeholder="e.g. 50000" className="mt-1.5" {...register('price')} />
        </div>
        <div>
          <Label htmlFor="phone">Contact Phone</Label>
          <Input id="phone" placeholder="e.g. 03001234567" className="mt-1.5" {...register('phone')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label>Category <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('category', v)} value={watch('category')}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div>
          <Label>City <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('city', v)} value={watch('city')}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Media ─────────────────────────────────────────────────────────────

function StepMedia() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
        <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">Photo upload coming in Phase 2</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
          S3 presigned uploads will be available once the media pipeline is set up. You can skip this step and add photos later from your dashboard.
        </p>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Supported: JPG, PNG, WebP · Max 5 MB per file · Up to 15 images (Premium)
      </p>
    </div>
  )
}

// ── Step 3: Package ────────────────────────────────────────────────────────────

function StepPackage({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const { setValue, watch, formState: { errors } } = form
  const selected = watch('package_name')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setValue('package_name', pkg.id)}
            className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
              selected === pkg.id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-card hover:border-accent/40'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                Popular
              </span>
            )}
            {selected === pkg.id && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-accent" />
            )}
            <p className="font-heading text-base font-semibold text-foreground">{pkg.label}</p>
            <p className="font-heading text-xl font-bold text-foreground mt-1">{pkg.price}</p>
            <p className="text-xs text-muted-foreground">{pkg.duration}</p>
            <ul className="mt-3 space-y-1.5">
              {pkg.benefits.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-xs text-foreground/70">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />{b}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      {errors.package_name && (
        <p className="text-xs text-destructive">{errors.package_name.message}</p>
      )}
    </div>
  )
}

// ── Step 4: Review ─────────────────────────────────────────────────────────────

function StepReview({ values }: { values: FormValues }) {
  const pkg = PACKAGES.find((p) => p.id === values.package_name)
  const cat = CATEGORIES.find((c) => c.value === values.category)
  const city = CITIES.find((c) => c.value === values.city)

  const rows = [
    { label: 'Title',       value: values.title },
    { label: 'Description', value: values.description, truncate: true },
    { label: 'Price',       value: values.price ? `₨${Number(values.price).toLocaleString()}` : 'Not specified' },
    { label: 'Phone',       value: values.phone || 'Not specified' },
    { label: 'Category',    value: cat?.label ?? values.category },
    { label: 'City',        value: city?.label ?? values.city },
    { label: 'Package',     value: pkg ? `${pkg.label} — ${pkg.price} / ${pkg.duration}` : '—' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {rows.map(({ label, value, truncate }) => (
          <div key={label} className="flex gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
            <span className={`flex-1 text-sm text-foreground ${truncate ? 'line-clamp-3' : ''}`}>{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        By submitting, your ad will enter the moderation queue. Our team reviews listings within 24 hours.
        {pkg?.id !== 'basic' && ' Payment will be required after content approval.'}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateAdPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', price: '', phone: '', category: '', city: '', package_name: '' },
    mode: 'onChange',
  })

  async function validateStep() {
    if (step === 0) return form.trigger(['title', 'description', 'category', 'city'])
    if (step === 2) return form.trigger(['package_name'])
    return true
  }

  async function handleNext() {
    const valid = await validateStep()
    if (valid) setStep((s) => s + 1)
  }

  async function handleSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await api.post('/client/ads', {
        title: values.title,
        description: values.description,
        price: values.price ? Number(values.price) : undefined,
        phone: values.phone || undefined,
        category: values.category,
        city: values.city,
        package_name: values.package_name,
      })
      toast.success('Ad created! Submitting for review...')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to create ad')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Post an Ad</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fill in the details below to list your item or service.</p>
      </div>

      <StepIndicator current={step} />

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-heading text-base font-semibold text-foreground">{STEPS[step]}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {step === 0 && <StepDetails form={form} />}
            {step === 1 && <StepMedia />}
            {step === 2 && <StepPackage form={form} />}
            {step === 3 && <StepReview values={form.getValues()} />}

            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {submitting ? 'Submitting...' : 'Submit Ad'}
                  {!submitting && <CheckCircle className="ml-1.5 h-4 w-4" />}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
