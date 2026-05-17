import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { Notification } from '../models/Notification.js'

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit
    const unreadOnly = req.query.unread === 'true'

    const filter: Record<string, unknown> = { user_id: req.user!._id }
    if (unreadOnly) filter.is_read = false

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user_id: req.user!._id, is_read: false }),
    ])

    res.json({
      ok: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit), unreadCount },
    })
  } catch (err) { next(err) }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user!._id },
      { is_read: true },
      { new: true },
    )
    if (!notification) {
      res.status(404).json({ ok: false, error: 'Notification not found' })
      return
    }
    res.json({ ok: true, data: { notification } })
  } catch (err) { next(err) }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany({ user_id: req.user!._id, is_read: false }, { is_read: true })
    res.json({ ok: true, data: null })
  } catch (err) { next(err) }
}
