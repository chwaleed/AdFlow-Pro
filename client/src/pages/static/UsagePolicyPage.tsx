import { XCircle, CheckCircle } from 'lucide-react'

const LAST_UPDATED = 'May 2026'

const ALLOWED = [
  'Second-hand personal belongings (electronics, furniture, clothing, etc.)',
  'Vehicles (cars, motorcycles, bicycles) with accurate descriptions',
  'Property listings (sale, rent, or lease) by the owner or authorized agent',
  'Job postings by registered businesses or individuals',
  'Services offered by verifiable individuals or businesses',
  'New items sold by individual sellers (not commercial resellers without disclosure)',
]

const PROHIBITED = [
  'Weapons, ammunition, or explosive materials',
  'Narcotics, prescription drugs, or controlled substances',
  'Counterfeit, pirated, or trademark-infringing goods',
  'Adult or sexually explicit content',
  'Financial products: loans, investment schemes, pyramid or MLM schemes',
  'Stolen, smuggled, or illegally obtained goods',
  'Live animals (unless licensed by relevant authorities)',
  'Personal data, account credentials, or hacked services',
  'Listings that impersonate other individuals or businesses',
  'Any content that violates Pakistani federal or provincial law',
]

const LAST_UPDATED_DATE = LAST_UPDATED

export default function UsagePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Usage Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED_DATE}</p>
      </div>

      <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
        AdFlowPro is a moderated marketplace. To keep the platform safe and trustworthy for everyone, all listings must comply with this policy. Violations may result in listing removal, account suspension, or referral to law enforcement.
      </p>

      <div className="mb-10">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          What You Can List
        </h2>
        <ul className="space-y-2.5">
          {ALLOWED.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-10">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          Prohibited Items &amp; Content
        </h2>
        <ul className="space-y-2.5">
          {PROHIBITED.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-6 space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Reporting Violations</h2>
        <p className="text-sm text-muted-foreground">
          If you see a listing that violates this policy, use the "Report" button on the listing page. Our moderation team reviews all reports within 24 hours. False or malicious reports may result in action against the reporting account.
        </p>
        <p className="text-sm text-muted-foreground">
          For urgent matters (fraud, illegal activity), contact us directly at{' '}
          <a href="/contact" className="text-accent hover:underline">support</a>.
        </p>
      </div>
    </div>
  )
}
