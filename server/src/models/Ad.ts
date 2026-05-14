import mongoose, { Schema, type Document } from 'mongoose'

export const AD_STATUSES = [
  'draft', 'submitted', 'under_review', 'payment_pending', 'payment_submitted',
  'payment_verified', 'scheduled', 'published', 'expired', 'archived', 'rejected',
] as const
export type AdStatus = (typeof AD_STATUSES)[number]

export interface IAd extends Document {
  user_id: mongoose.Types.ObjectId
  package_id?: mongoose.Types.ObjectId
  title: string
  slug: string
  category_id?: mongoose.Types.ObjectId
  city_id?: mongoose.Types.ObjectId
  description: string
  price?: number
  phone?: string
  status: AdStatus
  publish_at?: Date
  expire_at?: Date
  rank_score: number
  admin_boost: number
  view_count: number
  is_featured: boolean
  rejection_reason?: string
  moderation_notes?: string
}

const adSchema = new Schema<IAd>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    package_id: { type: Schema.Types.ObjectId, ref: 'Package' },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category' },
    city_id: { type: Schema.Types.ObjectId, ref: 'City' },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number },
    phone: { type: String, trim: true },
    status: { type: String, enum: AD_STATUSES, default: 'draft' },
    publish_at: { type: Date },
    expire_at: { type: Date },
    rank_score: { type: Number, default: 0 },
    admin_boost: { type: Number, default: 0 },
    view_count: { type: Number, default: 0 },
    is_featured: { type: Boolean, default: false },
    rejection_reason: { type: String },
    moderation_notes: { type: String },
  },
  { timestamps: true },
)

adSchema.index({ status: 1, expire_at: 1 })
adSchema.index({ rank_score: -1 })
adSchema.index({ user_id: 1, status: 1 })
adSchema.index({ category_id: 1, status: 1 })
adSchema.index({ city_id: 1, status: 1 })
adSchema.index({ publish_at: 1, status: 1 })
adSchema.index({ title: 'text', description: 'text' })

export const Ad = mongoose.model<IAd>('Ad', adSchema)
