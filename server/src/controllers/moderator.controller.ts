import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { Ad, type AdStatus } from '../models/Ad.js'
import { AdMedia } from '../models/AdMedia.js'
import { AdStatusHistory } from '../models/AdStatusHistory.js'
import { AuditLog } from '../models/AuditLog.js'
import { createNotification } from '../services/notification.service.js'

export async function getReviewQueue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit
    const statusParam = req.query.status as string | undefined
    const sort = (req.query.sort as string) || 'oldest'

    const allowedStatuses: AdStatus[] = ['submitted', 'under_review']
    const statusQuery = statusParam && allowedStatuses.includes(statusParam as AdStatus)
      ? [statusParam as AdStatus]
      : allowedStatuses

    const filter = { status: { $in: statusQuery } }
    const sortDir = sort === 'newest' ? -1 : 1

    const [items, total] = await Promise.all([
      Ad.find(filter)
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email')
        .populate('category_id', 'name slug')
        .populate('city_id', 'name slug')
        .populate('package_id', 'name label price duration_days')
        .lean(),
      Ad.countDocuments(filter),
    ])

    res.json({
      ok: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) { next(err) }
}

export async function getAdForReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const [ad, media, history] = await Promise.all([
      Ad.findById(id)
        .populate('user_id', 'name email')
        .populate('category_id', 'name slug')
        .populate('city_id', 'name slug')
        .populate('package_id', 'name label price duration_days')
        .lean(),
      AdMedia.find({ ad_id: id }).sort({ order: 1, is_primary: -1 }).lean(),
      AdStatusHistory.find({ ad_id: id })
        .sort({ createdAt: 1 })
        .populate('changed_by', 'name role')
        .lean(),
    ])

    if (!ad) {
      res.status(404).json({ ok: false, error: 'Ad not found' })
      return
    }

    res.json({ ok: true, data: { ad, media, history } })
  } catch (err) { next(err) }
}

export async function reviewAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { action, reason, note } = req.body as {
      action: 'approve_content' | 'reject' | 'flag' | 'add_note'
      reason?: string
      note?: string
    }

    const ad = await Ad.findById(id)
    if (!ad) {
      res.status(404).json({ ok: false, error: 'Ad not found' })
      return
    }

    const previousStatus = ad.status
    let newStatus: AdStatus = ad.status
    let historyNote = ''

    // Non-note actions are gated to reviewable statuses
    if (action !== 'add_note' && !['submitted', 'under_review'].includes(ad.status)) {
      res.status(422).json({
        ok: false,
        error: `Cannot perform "${action}" on an ad with status "${ad.status}"`,
      })
      return
    }

    switch (action) {
      case 'approve_content': {
        newStatus = 'payment_pending'
        historyNote = note || 'Content approved by moderator'
        break
      }
      case 'reject': {
        newStatus = 'rejected'
        ad.rejection_reason = reason
        historyNote = reason || ''
        break
      }
      case 'flag': {
        newStatus = 'under_review'
        const flagText = `[FLAGGED] ${note || reason || 'Flagged for review'}`
        ad.moderation_notes = ad.moderation_notes
          ? `${ad.moderation_notes}\n${flagText}`
          : flagText
        historyNote = flagText
        break
      }
      case 'add_note': {
        const noteText = note || ''
        ad.moderation_notes = ad.moderation_notes
          ? `${ad.moderation_notes}\n${noteText}`
          : noteText
        historyNote = noteText
        break
      }
    }

    ad.status = newStatus
    await ad.save()

    await Promise.all([
      AdStatusHistory.create({
        ad_id: ad._id,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: req.user!._id,
        note: historyNote,
      }),
      AuditLog.create({
        actor_id: req.user!._id,
        action_type: `moderator_${action}`,
        target_type: 'Ad',
        target_id: ad._id,
        old_value: { status: previousStatus },
        new_value: { status: newStatus },
        meta: { reason, note },
      }),
    ])

    if (action === 'approve_content') {
      createNotification({
        user_id: ad.user_id,
        title: 'Ad approved — proceed to payment',
        message: `Your ad "${ad.title}" has passed content review. Submit payment to continue.`,
        type: 'success',
        link: '/dashboard',
      })
    } else if (action === 'reject') {
      createNotification({
        user_id: ad.user_id,
        title: 'Ad rejected',
        message: `Your ad "${ad.title}" was rejected. Reason: ${reason ?? 'No reason provided.'}`,
        type: 'error',
        link: '/dashboard',
      })
    }

    res.json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}
