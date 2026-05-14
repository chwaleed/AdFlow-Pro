import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import AdStatusBadge from './AdStatusBadge'
import type { AdStatusHistoryEntry } from '@/lib/types'

interface Props {
  history: AdStatusHistoryEntry[]
}

function TimelineIcon({ status }: { status: string }) {
  if (status === 'published') return <CheckCircle className="h-4 w-4 text-success" />
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-destructive" />
  if (status === 'payment_pending') return <AlertCircle className="h-4 w-4 text-warning" />
  return <Clock className="h-4 w-4 text-info" />
}

export default function StatusTimeline({ history }: Props) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground">No status history yet.</p>
  }

  return (
    <ol className="relative border-l border-border ml-2 space-y-0">
      {history.map((entry, idx) => (
        <li key={entry._id} className="mb-8 ml-6 last:mb-0">
          {/* dot */}
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
            <TimelineIcon status={entry.new_status} />
          </span>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <AdStatusBadge status={entry.new_status} />
              {idx === 0 && (
                <span className="text-xs text-muted-foreground">(current)</span>
              )}
            </div>

            {entry.previous_status && (
              <p className="text-xs text-muted-foreground">
                From: <AdStatusBadge status={entry.previous_status} />
              </p>
            )}

            {entry.note && (
              <p className="mt-1 text-sm text-foreground/80 bg-muted rounded-md px-3 py-2">
                {entry.note}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {entry.changed_by && (
                <span>by {entry.changed_by.name}</span>
              )}
              <span>
                {new Date(entry.createdAt).toLocaleString('en-PK', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
