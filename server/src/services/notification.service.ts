import { Notification } from '../models/Notification.js'
import type mongoose from 'mongoose'

export async function createNotification(input: {
  user_id: string | mongoose.Types.ObjectId
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
}) {
  try {
    await Notification.create(input)
  } catch {
    // non-fatal — never let notification failure break the main flow
  }
}
