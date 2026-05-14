import { Link } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const BROWSE_LINKS = [
  { label: 'Browse Ads', to: '/ads' },
  { label: 'Packages', to: '/packages' },
  { label: 'Post an Ad', to: '/register' },
]

const HELP_LINKS = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'How It Works', to: '/#how-it-works' },
]

const LEGAL_LINKS = [
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Usage Policy', to: '/usage-policy' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Megaphone className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
              </div>
              <span className="font-heading text-lg font-semibold text-foreground">
                AdFlow<span className="text-accent">Pro</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A moderated paid-listing marketplace where every ad is reviewed, every payment is verified, and every listing is trusted.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Marketplace</h3>
            <ul className="mt-4 space-y-3">
              {BROWSE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Help</h3>
            <ul className="mt-4 space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} AdFlowPro. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with trust, transparency, and accountability.
          </p>
        </div>
      </div>
    </footer>
  )
}
