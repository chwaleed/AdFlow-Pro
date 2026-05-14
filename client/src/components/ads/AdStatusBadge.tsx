import type { AdStatus } from '@/lib/types'

interface StatusConfig {
  label: string
  className: string
}

const STATUS_MAP: Record<AdStatus, StatusConfig> = {
  draft:             { label: 'Draft',             className: 'bg-muted text-muted-foreground border border-border' },
  submitted:         { label: 'Submitted',          className: 'bg-info/10 text-info border border-info/20' },
  under_review:      { label: 'Under Review',       className: 'bg-info/10 text-info border border-info/20' },
  payment_pending:   { label: 'Payment Pending',    className: 'bg-warning/10 text-warning border border-warning/20' },
  payment_submitted: { label: 'Payment Submitted',  className: 'bg-warning/10 text-warning border border-warning/20 animate-pulse' },
  payment_verified:  { label: 'Payment Verified',   className: 'bg-success/10 text-success border border-success/20' },
  scheduled:         { label: 'Scheduled',          className: 'bg-info/10 text-info border border-info/20' },
  published:         { label: 'Published',          className: 'bg-success text-success-foreground border border-success' },
  expired:           { label: 'Expired',            className: 'bg-muted text-muted-foreground border border-border opacity-70' },
  archived:          { label: 'Archived',           className: 'bg-muted text-muted-foreground border border-border opacity-60' },
  rejected:          { label: 'Rejected',           className: 'bg-destructive/10 text-destructive border border-destructive/20' },
}

interface Props {
  status: AdStatus
  className?: string
}

export default function AdStatusBadge({ status, className = '' }: Props) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
