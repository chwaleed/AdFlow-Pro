import { z } from 'zod'

export const createAdSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(5000),
  category_id: z.string().optional(),
  city_id: z.string().optional(),
  package_id: z.string().optional(),
  price: z.number().positive().optional(),
  phone: z.string().max(20).optional(),
})

export const updateAdSchema = createAdSchema.partial()
