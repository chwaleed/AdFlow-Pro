import mongoose, { Schema, type Document } from 'mongoose'

export interface ISellerProfile extends Document {
  user_id: mongoose.Types.ObjectId
  display_name?: string
  business_name?: string
  phone?: string
  city?: string
  bio?: string
  is_verified: boolean
  avatar_url?: string
}

const sellerProfileSchema = new Schema<ISellerProfile>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    display_name: { type: String, trim: true },
    business_name: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    is_verified: { type: Boolean, default: false },
    avatar_url: { type: String },
  },
  { timestamps: true },
)

export const SellerProfile = mongoose.model<ISellerProfile>('SellerProfile', sellerProfileSchema)
