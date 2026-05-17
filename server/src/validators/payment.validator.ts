import { z } from 'zod'

export const submitPaymentSchema = z.object({
  ad_id: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.string().min(1).max(50),
  transaction_ref: z.string().min(3).max(100),
  sender_name: z.string().min(2).max(100),
})
