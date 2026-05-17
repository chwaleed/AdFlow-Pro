import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { Ad } from '../models/Ad.js'
import { Payment } from '../models/Payment.js'
import { Package } from '../models/Package.js'
import { AdStatusHistory } from '../models/AdStatusHistory.js'
import { AuditLog } from '../models/AuditLog.js'
import type { IPackage } from '../models/Package.js'
import type { AdStatus } from '../models/Ad.js'
import { createNotification } from '../services/notification.service.js'
import { computeRankScore } from '../utils/ranking.js'

// ── Milestone 3.2 ─────────────────────────────────────────────────────────────

export async function getPaymentQueue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = { status: 'submitted' as const }

    const [items, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email')
        .populate({
          path: 'ad_id',
          populate: [
            { path: 'category_id', select: 'name slug' },
            { path: 'city_id', select: 'name slug' },
            { path: 'package_id', select: 'name label price duration_days' },
          ],
          select: 'title slug status category_id city_id package_id',
        })
        .lean(),
      Payment.countDocuments(filter),
    ])

    res.json({
      ok: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) { next(err) }
}

export async function verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { action, note } = req.body as { action: 'verify' | 'reject'; note?: string }

    const payment = await Payment.findById(id)
    if (!payment) {
      res.status(404).json({ ok: false, error: 'Payment not found' })
      return
    }
    if (payment.status !== 'submitted') {
      res.status(422).json({ ok: false, error: `Payment is already "${payment.status}"` })
      return
    }

    const ad = await Ad.findById(payment.ad_id)
    if (!ad) {
      res.status(404).json({ ok: false, error: 'Associated ad not found' })
      return
    }

    const previousAdStatus = ad.status
    let newAdStatus = ad.status
    let historyNote = ''

    if (action === 'verify') {
      payment.status = 'verified'
      payment.verified_by = req.user!._id as unknown as import('mongoose').Types.ObjectId
      payment.verified_at = new Date()
      newAdStatus = 'payment_verified'
      historyNote = note || 'Payment verified by admin'
    } else {
      payment.status = 'rejected'
      payment.rejection_reason = note
      newAdStatus = 'payment_pending'
      historyNote = note || 'Payment rejected by admin'
    }

    ad.status = newAdStatus
    await Promise.all([payment.save(), ad.save()])

    await Promise.all([
      AdStatusHistory.create({
        ad_id: ad._id,
        previous_status: previousAdStatus,
        new_status: newAdStatus,
        changed_by: req.user!._id,
        note: historyNote,
      }),
      AuditLog.create({
        actor_id: req.user!._id,
        action_type: `admin_${action}_payment`,
        target_type: 'Payment',
        target_id: payment._id,
        old_value: { payment_status: 'submitted', ad_status: previousAdStatus },
        new_value: { payment_status: payment.status, ad_status: newAdStatus },
        meta: { note },
      }),
    ])

    if (action === 'verify') {
      createNotification({
        user_id: ad.user_id,
        title: 'Payment verified',
        message: `Your payment for "${ad.title}" has been verified. It will be published shortly.`,
        type: 'success',
        link: '/dashboard',
      })
    } else {
      createNotification({
        user_id: ad.user_id,
        title: 'Payment rejected',
        message: `Your payment for "${ad.title}" was rejected. ${note ? `Reason: ${note}` : 'Please resubmit with the correct details.'}`,
        type: 'error',
        link: '/dashboard',
      })
    }

    res.json({ ok: true, data: { payment, ad } })
  } catch (err) { next(err) }
}

// ── Milestone 3.3 ─────────────────────────────────────────────────────────────

export async function getPublishQueue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const statusList = ['payment_verified', 'scheduled'] as AdStatus[]
    const filter = { status: { $in: statusList } }

    const [items, total] = await Promise.all([
      Ad.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name email')
        .populate('category_id', 'name slug')
        .populate('city_id', 'name slug')
        .populate('package_id', 'name label price duration_days weight')
        .lean(),
      Ad.countDocuments(filter),
    ])

    res.json({
      ok: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) { next(err) }
}

export async function publishAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { publish_at: publishAtRaw } = req.body as { publish_at?: string | null }

    const ad = await Ad.findById(id).populate<{ package_id: IPackage }>('package_id')
    if (!ad) {
      res.status(404).json({ ok: false, error: 'Ad not found' })
      return
    }
    if (ad.status !== 'payment_verified') {
      res.status(422).json({
        ok: false,
        error: `Cannot publish an ad with status "${ad.status}". Must be "payment_verified".`,
      })
      return
    }
    if (!ad.package_id) {
      res.status(422).json({ ok: false, error: 'Ad has no package selected. Assign a package before publishing.' })
      return
    }

    const pkg = ad.package_id as IPackage
    const now = new Date()
    const publishAt = publishAtRaw ? new Date(publishAtRaw) : now

    if (isNaN(publishAt.getTime())) {
      res.status(400).json({ ok: false, error: 'Invalid publish_at date' })
      return
    }

    const expireAt = new Date(publishAt.getTime() + pkg.duration_days * 86_400_000)
    const newStatus = publishAt > now ? 'scheduled' : 'published'
    const rankScore = computeRankScore({
      packageWeight: pkg.weight || 1,
      isFeatured: ad.is_featured,
      publishAt,
      adminBoost: ad.admin_boost,
    })

    const previousStatus = ad.status
    ad.publish_at = publishAt
    ad.expire_at = expireAt
    ad.status = newStatus
    ad.rank_score = rankScore
    await ad.save()

    const historyNote = newStatus === 'scheduled'
      ? `Scheduled for ${publishAt.toISOString()}`
      : 'Published immediately by admin'

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
        action_type: `admin_${newStatus === 'scheduled' ? 'schedule' : 'publish'}_ad`,
        target_type: 'Ad',
        target_id: ad._id,
        old_value: { status: previousStatus },
        new_value: { status: newStatus, publish_at: publishAt, expire_at: expireAt },
      }),
    ])

    if (newStatus === 'published') {
      createNotification({
        user_id: ad.user_id,
        title: 'Your ad is live!',
        message: `"${ad.title}" is now published and visible to the public.`,
        type: 'success',
        link: '/dashboard',
      })
    } else {
      createNotification({
        user_id: ad.user_id,
        title: 'Ad scheduled',
        message: `"${ad.title}" is scheduled to go live on ${publishAt.toLocaleDateString()}.`,
        type: 'info',
        link: '/dashboard',
      })
    }

    res.json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}

export async function featureAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { is_featured, admin_boost } = req.body as { is_featured: boolean; admin_boost: number }

    const ad = await Ad.findById(id).populate<{ package_id: IPackage }>('package_id')
    if (!ad) {
      res.status(404).json({ ok: false, error: 'Ad not found' })
      return
    }

    const previousValues = { is_featured: ad.is_featured, admin_boost: ad.admin_boost, rank_score: ad.rank_score }

    ad.is_featured = is_featured
    ad.admin_boost = admin_boost ?? 0

    // Recompute rank_score for live/scheduled ads
    if (['published', 'scheduled'].includes(ad.status) && ad.package_id) {
      const pkg = ad.package_id as IPackage
      ad.rank_score = (pkg.weight || 1) * 100 + (is_featured ? 500 : 0) + ad.admin_boost
    }

    await ad.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_feature_ad',
      target_type: 'Ad',
      target_id: ad._id,
      old_value: previousValues,
      new_value: { is_featured, admin_boost: ad.admin_boost, rank_score: ad.rank_score },
    })

    res.json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}

// Lookup single ad for the admin panel detail view
export async function getAdForAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const ad = await Ad.findById(id)
      .populate('user_id', 'name email')
      .populate('category_id', 'name slug')
      .populate('city_id', 'name slug')
      .populate('package_id', 'name label price duration_days weight')
      .lean()

    if (!ad) {
      res.status(404).json({ ok: false, error: 'Ad not found' })
      return
    }

    res.json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}

// Lookup packages (for package assignment if needed)
export async function listPackages(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const packages = await Package.find({ is_active: true }).sort({ sort_order: 1 }).lean()
    res.json({ ok: true, data: { items: packages } })
  } catch (err) { next(err) }
}
