import mongoose, { Schema, type Document } from 'mongoose'

export interface IAdMedia extends Document {
  ad_id: mongoose.Types.ObjectId
  source_type: 's3' | 'youtube' | 'external' | 'local'
  original_url: string
  thumbnail_url?: string
  s3_key?: string
  validation_status: 'pending' | 'valid' | 'failed'
  is_primary: boolean
  order: number
}

const adMediaSchema = new Schema<IAdMedia>(
  {
    ad_id: { type: Schema.Types.ObjectId, ref: 'Ad' },
    source_type: { type: String, enum: ['s3', 'youtube', 'external', 'local'], required: true },
    original_url: { type: String, required: true },
    thumbnail_url: { type: String },
    s3_key: { type: String },
    validation_status: { type: String, enum: ['pending', 'valid', 'failed'], default: 'pending' },
    is_primary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

adMediaSchema.index({ ad_id: 1, order: 1 })

export const AdMedia = mongoose.model<IAdMedia>('AdMedia', adMediaSchema)
