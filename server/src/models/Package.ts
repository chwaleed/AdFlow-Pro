import mongoose, { Schema, type Document } from 'mongoose'

export interface IPackage extends Document {
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
  sort_order: number
}

const packageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true },
    duration_days: { type: Number, required: true },
    weight: { type: Number, required: true, default: 1 },
    is_featured: { type: Boolean, default: false },
    homepage_placement: { type: Boolean, default: false },
    price: { type: Number, required: true },
    refresh_rule: { type: String, enum: ['none', 'manual', 'auto'], default: 'none' },
    refresh_days: { type: Number },
    benefits: [{ type: String }],
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Package = mongoose.model<IPackage>('Package', packageSchema)
