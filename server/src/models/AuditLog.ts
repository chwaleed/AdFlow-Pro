import mongoose, { Schema, type Document } from 'mongoose'

export interface IAuditLog extends Document {
  actor_id?: mongoose.Types.ObjectId
  action_type: string
  target_type: string
  target_id: mongoose.Types.ObjectId
  old_value?: unknown
  new_value?: unknown
  meta?: unknown
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor_id: { type: Schema.Types.ObjectId, ref: 'User' },
    action_type: { type: String, required: true },
    target_type: { type: String, required: true },
    target_id: { type: Schema.Types.ObjectId, required: true },
    old_value: { type: Schema.Types.Mixed },
    new_value: { type: Schema.Types.Mixed },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

auditLogSchema.index({ target_type: 1, target_id: 1 })
auditLogSchema.index({ actor_id: 1 })
auditLogSchema.index({ createdAt: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema)
