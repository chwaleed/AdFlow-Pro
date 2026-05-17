import mongoose from 'mongoose'
import { AuditLog } from '../models/AuditLog.js'
import { AdStatusHistory } from '../models/AdStatusHistory.js'

export async function logStatusChange(params: {
  ad_id: string
  previous_status: string
  new_status: string
  changed_by: string
  note?: string
}): Promise<void> {
  await AdStatusHistory.create({
    ad_id: new mongoose.Types.ObjectId(params.ad_id),
    previous_status: params.previous_status,
    new_status: params.new_status,
    changed_by: new mongoose.Types.ObjectId(params.changed_by),
    note: params.note,
  })
}

export async function logAudit(params: {
  actor_id: string
  action_type: string
  target_type: string
  target_id: string
  old_value?: unknown
  new_value?: unknown
}): Promise<void> {
  await AuditLog.create({
    actor_id: new mongoose.Types.ObjectId(params.actor_id),
    action_type: params.action_type,
    target_type: params.target_type,
    target_id: new mongoose.Types.ObjectId(params.target_id),
    old_value: params.old_value,
    new_value: params.new_value,
  })
}
