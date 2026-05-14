import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  {
    q: 'How do I post an ad?',
    a: 'Register an account, go to your dashboard, click "Post an Ad", fill in the details (title, description, category, city, photos), choose a visibility package, and submit. A moderator will review it within 24 hours.',
  },
  {
    q: 'Is it free to post an ad?',
    a: 'Yes — the Basic package is completely free and gives you a 30-day listing. Paid packages (Standard at ₨999 and Premium at ₨2,499) extend your duration and boost your ranking.',
  },
  {
    q: 'How long does content review take?',
    a: 'Standard ads are reviewed within 24 hours. Premium ads receive priority review within 4 hours during business hours (Mon–Sat, 9am–6pm PKT).',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept bank transfer, EasyPaisa, and JazzCash. After making payment, upload a screenshot as proof. Our admin team manually verifies all payments before activating the listing.',
  },
  {
    q: 'What happens if my ad is rejected?',
    a: 'You will receive a notification with the specific reason for rejection. You can edit and resubmit the ad without losing your draft or payment.',
  },
  {
    q: 'Can I edit my ad after it goes live?',
    a: 'Minor edits (contact info, price) can be made from your dashboard. Major edits (title, category, description) will re-trigger a moderation review.',
  },
  {
    q: 'How do I report a suspicious listing?',
    a: "Click the \"Report\" button on any ad detail page and describe the issue. Our moderation team reviews all reports within 24 hours.",
  },
  {
    q: 'What types of ads are not allowed?',
    a: 'Please see our Usage Policy for the full list. In short: illegal items, counterfeit goods, adult content, financial scams, and misleading listings are strictly prohibited.',
  },
  {
    q: 'How does the ranking system work?',
    a: 'Ranking is based on package weight, featured status, freshness, and admin boost. Premium ads rank highest. Refreshing an ad resets its freshness score.',
  },
  {
    q: 'How do I contact a seller?',
    a: 'Seller contact details (phone, WhatsApp) are displayed on the ad detail page. We recommend meeting in a public place and verifying the item before payment.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground sm:text-base">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Support</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-muted-foreground">
          Everything you need to know about posting, payment, and moderation on AdFlowPro.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card px-6">
        {FAQS.map((item) => (
          <FAQItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  )
}
