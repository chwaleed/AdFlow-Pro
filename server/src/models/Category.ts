import mongoose, { Schema, type Document } from 'mongoose'

export interface ICategory extends Document {
  name: string
  slug: string
  icon?: string
  is_active: boolean
  sort_order: number
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Category = mongoose.model<ICategory>('Category', categorySchema)
