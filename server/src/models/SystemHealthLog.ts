import mongoose, { Schema, type Document } from 'mongoose'

export interface ISystemHealthLog extends Document {
  source: string
  response_ms?: number
  status: 'ok' | 'error'
  message?: string
  checked_at: Date
}

const systemHealthLogSchema = new Schema<ISystemHealthLog>({
  source: { type: String, required: true },
  response_ms: { type: Number },
  status: { type: String, enum: ['ok', 'error'], required: true },
  message: { type: String },
  checked_at: { type: Date, default: Date.now },
})

systemHealthLogSchema.index({ source: 1, checked_at: -1 })

export const SystemHealthLog = mongoose.model<ISystemHealthLog>('SystemHealthLog', systemHealthLogSchema)
