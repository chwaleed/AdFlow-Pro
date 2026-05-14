import mongoose, { Schema, type Document } from 'mongoose'

export interface IPayment extends Document {
  ad_id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  amount: number
  method: string
  transaction_ref: string
  sender_name: string
  screenshot_url?: string
  screenshot_s3_key?: string
  status: 'submitted' | 'verified' | 'rejected'
  verified_by?: mongoose.Types.ObjectId
  verified_at?: Date
  rejection_reason?: string
  notes?: string
}

const paymentSchema = new Schema<IPayment>(
  {
    ad_id: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true, trim: true },
    transaction_ref: { type: String, required: true, trim: true },
    sender_name: { type: String, required: true, trim: true },
    screenshot_url: { type: String },
    screenshot_s3_key: { type: String },
    status: { type: String, enum: ['submitted', 'verified', 'rejected'], default: 'submitted' },
    verified_by: { type: Schema.Types.ObjectId, ref: 'User' },
    verified_at: { type: Date },
    rejection_reason: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
)

// Block duplicate transaction references globally
paymentSchema.index({ transaction_ref: 1 }, { unique: true, sparse: true })
paymentSchema.index({ ad_id: 1 })
paymentSchema.index({ user_id: 1 })

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
