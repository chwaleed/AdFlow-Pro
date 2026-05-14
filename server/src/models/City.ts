import mongoose, { Schema, type Document } from 'mongoose'

export interface ICity extends Document {
  name: string
  slug: string
  is_active: boolean
  sort_order: number
}

const citySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const City = mongoose.model<ICity>('City', citySchema)
