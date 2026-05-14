import { Link } from 'react-router-dom'
import {
  Car, Building2, Cpu, Home, Briefcase, Wrench, ShoppingBag, Zap,
  Shield, CheckCircle, Clock, Star, ArrowRight, ChevronRight,
  Search, TrendingUp, BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Vehicles',        icon: Car,         slug: 'vehicles' },
  { label: 'Property',        icon: Building2,   slug: 'property' },
  { label: 'Electronics',     icon: Cpu,         slug: 'electronics' },
  { label: 'Furniture',       icon: Home,        slug: 'furniture' },
  { label: 'Jobs',            icon: Briefcase,   slug: 'jobs' },
  { label: 'Services',        icon: Wrench,      slug: 'services' },
  { label: 'Fashion',         icon: ShoppingBag, slug: 'fashion' },
  { label: 'Home Appliances', icon: Zap,         slug: 'home-appliances' },
]

// ── Packages ──────────────────────────────────────────────────────────────────

const PACKAGES = [
  {
    name: 'Basic',
    price: 'Free',
    duration: '30 days',
    popular: false,
    benefits: ['30-day listing', 'Standard visibility', 'Up to 3 images', 'Manual renewal'],
  },
  {
    name: 'Standard',
    price: '₨999',
    duration: '60 days',
    popular: false,
    benefits: ['60-day listing', 'Higher search ranking', 'Up to 8 images', '1 manual refresh'],
  },
  {
    name: 'Premium',
    price: '₨2,499',
    duration: '90 days',
    popular: true,
    benefits: ['90-day listing', 'Featured badge & homepage placement', 'Up to 15 images', 'Auto-refresh every 7 days', 'Priority review queue'],
  },
]

// ── How It Works ──────────────────────────────────────────────────────────────

const STEPS = [
  { step: '01', title: 'Post Your Ad',       desc: 'Fill in the details, upload photos, and choose your visibility package.' },
  { step: '02', title: 'Content Review',     desc: 'Our moderators review every listing for quality and compliance within 24 hours.' },
  { step: '03', title: 'Verify Payment',     desc: 'Submit your payment proof. Admin confirms and activates your listing.' },
  { step: '04', title: 'Go Live',            desc: 'Your ad goes live and starts appearing to buyers in your category and city.' },
]

// ── Trust Badges ──────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: Shield,      title: 'Moderated Listings',      desc: 'Every ad is reviewed by a human moderator before going live.' },
  { icon: CheckCircle, title: 'Verified Payments',        desc: 'Admins manually verify all payment proofs — no auto-billing surprises.' },
  { icon: BadgeCheck,  title: 'Trusted Sellers',          desc: 'Verified seller profiles with transparent history and ratings.' },
  { icon: Clock,       title: 'Fast Publishing',          desc: 'Standard review completes within 24 hours, Premium within 4 hours.' },
]

// ── Section: Hero ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28 lg:py-36">
      {/* subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Badge
          variant="outline"
          className="mb-6 border-white/20 bg-white/10 text-white/80 backdrop-blur-sm"
        >
          <Star className="mr-1.5 h-3 w-3 fill-current" />
          Trusted Classified Marketplace
        </Badge>

        <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Buy &amp; Sell with{' '}
          <span className="text-sky-400">Confidence</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
          Moderated listings, verified payments, and guaranteed visibility packages — the transparent marketplace Pakistan deserves.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 text-base"
            asChild
          >
            <Link to="/register">
              Post an Ad
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/ads">
              <Search className="mr-2 h-4 w-4" />
              Browse Ads
            </Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-6 sm:gap-10 max-w-lg mx-auto">
          {[
            { value: '10,000+', label: 'Active Listings' },
            { value: '99%',     label: 'Review Rate' },
            { value: '24h',     label: 'Avg. Review Time' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Categories ───────────────────────────────────────────────────────

function CategoriesSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Browse by Category</p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
              What are you looking for?
            </h2>
          </div>
          <Link
            to="/ads"
            className="hidden items-center gap-1 text-sm font-medium text-accent hover:underline sm:flex"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map(({ label, icon: Icon, slug }) => (
            <Link
              key={slug}
              to={`/ads?category=${slug}`}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-accent/10">
                <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium text-foreground/80 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Featured Ads (placeholder) ──────────────────────────────────────

function FeaturedAdsSection() {
  return (
    <section className="bg-muted/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Hand-Picked</p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
              Featured Listings
            </h2>
          </div>
          <Badge variant="secondary" className="text-xs">Coming in Phase 2</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: How It Works ─────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Simple Process</p>
          <h2 className="font-heading mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            From posting to publishing — a clear, accountable process with human review at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <div key={step.step} className="relative flex flex-col">
              {/* connector line */}
              {idx < STEPS.length - 1 && (
                <div className="absolute top-6 left-full z-10 hidden h-px w-full -translate-x-1/2 bg-border lg:block" />
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-accent/20 bg-accent/5">
                <span className="font-heading text-sm font-bold text-accent">{step.step}</span>
              </div>
              <h3 className="font-heading mt-4 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Packages ─────────────────────────────────────────────────────────

function PackagesSection() {
  return (
    <section className="bg-muted/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Visibility Plans</p>
          <h2 className="font-heading mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
            Choose Your Package
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Start free or boost your ad's reach with a Premium listing. Every package includes human moderation.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.name}
              className={`relative flex flex-col transition-shadow hover:shadow-md ${
                pkg.popular ? 'border-accent shadow-md ring-1 ring-accent' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground px-3 text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3 pt-6">
                <p className="font-heading text-lg font-semibold text-foreground">{pkg.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-heading text-3xl font-bold text-foreground">{pkg.price}</span>
                  {pkg.price !== 'Free' && (
                    <span className="text-sm text-muted-foreground">/ listing</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{pkg.duration} visibility</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2.5">
                  {pkg.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-auto w-full ${
                    pkg.popular
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                      : ''
                  }`}
                  variant={pkg.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link to="/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Recent Ads (placeholder) ────────────────────────────────────────

function RecentAdsSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Just Added</p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
              Recent Listings
            </h2>
          </div>
          <Badge variant="secondary" className="text-xs">Coming in Phase 2</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-36 w-full rounded-none" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link to="/ads">
              View All Listings <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Section: Trust ────────────────────────────────────────────────────────────

function TrustSection() {
  return (
    <section className="border-t border-border bg-muted/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Why AdFlowPro</p>
          <h2 className="font-heading mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
            The Transparent Marketplace
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: CTA Banner ───────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="bg-primary py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          Ready to reach more buyers?
        </h2>
        <p className="mt-4 text-white/70">
          Post your first ad for free and experience the difference of a moderated, trusted marketplace.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8"
            asChild
          >
            <Link to="/register">
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-white/80 hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/faq">Learn More</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedAdsSection />
      <HowItWorksSection />
      <PackagesSection />
      <RecentAdsSection />
      <TrustSection />
      <CTASection />
    </>
  )
}
