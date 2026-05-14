import mongoose, { Schema, type Document } from 'mongoose'

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string
}

const notificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    is_read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true },
)

notificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
