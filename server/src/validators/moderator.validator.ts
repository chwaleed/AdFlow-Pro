import { z } from 'zod'

export const reviewActionSchema = z.object({
  action: z.enum(['approve_content', 'reject', 'flag', 'add_note']),
  reason: z.string().trim().max(500).optional(),
  note: z.string().trim().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'reject' && !data.reason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Rejection reason is required',
      path: ['reason'],
    })
  }
  if (data.action === 'add_note' && !data.note) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Note content is required',
      path: ['note'],
    })
  }
})
