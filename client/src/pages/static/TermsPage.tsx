const LAST_UPDATED = 'May 2026'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Legal</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-foreground">
        <Section title="1. Acceptance of Terms">
          By creating an account or using AdFlowPro, you agree to these Terms of Service. If you do not agree, you may not use the platform.
        </Section>

        <Section title="2. User Accounts">
          You must provide accurate information when registering. You are responsible for maintaining the security of your account credentials. AdFlowPro reserves the right to suspend accounts that violate these terms.
        </Section>

        <Section title="3. Ad Listings">
          All listings are subject to human content moderation before going live. You must own or have rights to sell any item you list. Misleading, fraudulent, or prohibited listings will be removed and may result in account suspension.
        </Section>

        <Section title="4. Payments">
          Payments are made externally (bank transfer, EasyPaisa, JazzCash) and verified by our admin team. Packages are non-refundable once the listing goes live, except in cases of technical error on our part.
        </Section>

        <Section title="5. Prohibited Content">
          The following are strictly prohibited: illegal items, counterfeit goods, adult content, weapons, drugs, financial instruments, and any content that violates Pakistani law. See our <a href="/usage-policy" className="text-accent hover:underline">Usage Policy</a> for the complete list.
        </Section>

        <Section title="6. Intellectual Property">
          You retain ownership of content you post. By posting, you grant AdFlowPro a non-exclusive license to display your content on the platform for the duration of your listing.
        </Section>

        <Section title="7. Limitation of Liability">
          AdFlowPro is a listing platform and is not a party to any transaction between buyers and sellers. We are not liable for the quality, legality, or accuracy of listed items, or for any dispute between users.
        </Section>

        <Section title="8. Modifications">
          We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
        </Section>

        <Section title="9. Governing Law">
          These terms are governed by the laws of Pakistan. Disputes shall be resolved in the courts of Karachi.
        </Section>

        <Section title="10. Contact">
          For questions about these terms, contact us at <a href="/contact" className="text-accent hover:underline">our support page</a>.
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}
