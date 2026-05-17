import { z } from 'zod'

export const updateUserSchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
  role: z.enum(['client', 'moderator', 'admin', 'super_admin']).optional(),
}).refine((d) => d.status !== undefined || d.role !== undefined, {
  message: 'At least one of status or role must be provided',
})

export const createPackageSchema = z.object({
  name: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(50),
  duration_days: z.coerce.number().int().min(1).max(365),
  weight: z.coerce.number().int().min(1).max(10),
  price: z.coerce.number().min(0),
  is_featured: z.boolean().default(false),
  homepage_placement: z.boolean().default(false),
  refresh_rule: z.enum(['none', 'manual', 'auto']).default('none'),
  refresh_days: z.coerce.number().int().min(1).optional(),
  benefits: z.array(z.string().trim().min(1)).default([]),
  sort_order: z.coerce.number().int().default(0),
})

export const updatePackageSchema = createPackageSchema.partial()

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  sort_order: z.coerce.number().int().default(0),
})

export const updateCategorySchema = createCategorySchema.partial()

export const createCitySchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: z.string().trim().optional(),
  sort_order: z.coerce.number().int().default(0),
})

export const updateCitySchema = createCitySchema.partial()
