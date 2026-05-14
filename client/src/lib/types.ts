export type AdStatus =
  | 'draft' | 'submitted' | 'under_review'
  | 'payment_pending' | 'payment_submitted' | 'payment_verified'
  | 'scheduled' | 'published' | 'expired' | 'archived' | 'rejected'

export interface Ad {
  _id: string
  title: string
  slug: string
  description: string
  price?: number
  phone?: string
  status: AdStatus
  user_id: string
  category_id?: { _id: string; name: string; slug: string }
  city_id?: { _id: string; name: string; slug: string }
  package_id?: { _id: string; name: string; label: string; price: number; duration_days: number }
  view_count: number
  is_featured: boolean
  publish_at?: string
  expire_at?: string
  rejection_reason?: string
  moderation_notes?: string
  media?: AdMedia[]
  createdAt: string
  updatedAt: string
}

export interface AdMedia {
  _id: string
  ad_id: string
  source_type: 's3' | 'youtube' | 'external'
  original_url: string
  thumbnail_url?: string
  s3_key?: string
  validation_status: 'pending' | 'valid' | 'failed'
}

export interface AdStatusHistoryEntry {
  _id: string
  ad_id: string
  previous_status?: AdStatus
  new_status: AdStatus
  changed_by?: { _id: string; name: string; role: string }
  note?: string
  createdAt: string
}

export interface Package {
  _id: string
  name: string
  label: string
  duration_days: number
  weight: number
  is_featured: boolean
  homepage_placement: boolean
  price: number
  refresh_rule: 'none' | 'manual' | 'auto'
  refresh_days?: number
  benefits: string[]
  is_active: boolean
}

export interface SellerProfile {
  _id: string
  user_id: string
  display_name?: string
  business_name?: string
  phone?: string
  city?: string
  bio?: string
  is_verified: boolean
  avatar_url?: string
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}
