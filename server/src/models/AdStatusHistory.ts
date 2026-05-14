import mongoose, { Schema, type Document } from 'mongoose'

export interface IAdStatusHistory extends Document {
  ad_id: mongoose.Types.ObjectId
  previous_status?: string
  new_status: string
  changed_by?: mongoose.Types.ObjectId
  note?: string
}

const adStatusHistorySchema = new Schema<IAdStatusHistory>(
  {
    ad_id: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
    previous_status: { type: String },
    new_status: { type: String, required: true },
    changed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { timestamps: true },
)

adStatusHistorySchema.index({ ad_id: 1, createdAt: 1 })

export const AdStatusHistory = mongoose.model<IAdStatusHistory>('AdStatusHistory', adStatusHistorySchema)
