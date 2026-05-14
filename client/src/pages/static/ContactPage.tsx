import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const CONTACT_INFO = [
  { icon: Mail,    label: 'Email',          value: 'support@adflowpro.pk' },
  { icon: Phone,   label: 'WhatsApp',       value: '+92 300 000 0000' },
  { icon: MapPin,  label: 'Location',       value: 'Karachi, Pakistan' },
  { icon: Clock,   label: 'Business Hours', value: 'Mon–Sat, 9 AM – 6 PM PKT' },
]

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Get in Touch</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-4 text-muted-foreground">
          Have a question, dispute, or feedback? Our support team typically responds within one business day.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/40 p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">Before contacting us</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Check the <a href="/faq" className="text-accent hover:underline">FAQ page</a> — most questions are answered there.</li>
          <li>For ad-specific issues, check your dashboard for status notes from our moderation team.</li>
          <li>For payment disputes, include your transaction reference number in your message.</li>
          <li>For account suspension inquiries, email with your registered email address.</li>
        </ul>
      </div>
    </div>
  )
}
