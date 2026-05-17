import { z } from 'zod'

export const verifyPaymentSchema = z.object({
  action: z.enum(['verify', 'reject']),
  note: z.string().trim().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'reject' && !data.note?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Rejection note is required when rejecting a payment',
      path: ['note'],
    })
  }
})

export const publishAdSchema = z.object({
  publish_at: z.string().optional().nullable(),
})

export const featureAdSchema = z.object({
  is_featured: z.boolean(),
  admin_boost: z.coerce.number().int().min(0).max(10000).default(0),
})
