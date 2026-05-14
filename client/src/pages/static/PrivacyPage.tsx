const LAST_UPDATED = 'May 2026'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <Section title="1. Information We Collect">
          We collect the information you provide at registration (name, email, password hash), the content of your listings, payment proof screenshots you upload, and standard server logs (IP address, browser type, timestamps).
        </Section>

        <Section title="2. How We Use Your Information">
          Your information is used to operate the platform (listing moderation, payment verification, notifications), to improve the service, and to comply with legal obligations. We do not sell your personal data to third parties.
        </Section>

        <Section title="3. Data Storage">
          Ad images and payment screenshots are stored on AWS S3 in private buckets. Access is restricted to the AdFlowPro moderation and admin team. Database records are stored on MongoDB Atlas with encryption at rest.
        </Section>

        <Section title="4. Cookies">
          We use session cookies for authentication and local storage for theme preferences. We do not use third-party tracking cookies.
        </Section>

        <Section title="5. Data Sharing">
          Your public listing content (title, description, photos, city, category) is visible to all visitors. Your contact information is visible only to logged-in users on a listing's detail page. We do not share private data with advertisers.
        </Section>

        <Section title="6. Data Retention">
          Active listings are retained for the duration of your package. Expired listings are archived for 90 days then permanently deleted. Account data is retained until you request deletion.
        </Section>

        <Section title="7. Your Rights">
          You may request access to, correction of, or deletion of your personal data by contacting us at the email on our <a href="/contact" className="text-accent hover:underline">Contact page</a>. We will respond within 14 business days.
        </Section>

        <Section title="8. Security">
          Passwords are hashed with bcrypt (cost factor 12). Access tokens are short-lived (15 minutes). HTTPS is enforced on all connections. However, no system is 100% secure and we cannot guarantee absolute security.
        </Section>

        <Section title="9. Changes to This Policy">
          We will notify registered users via email of material changes to this policy at least 14 days before they take effect.
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-base font-semibold text-foreground mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  )
}
