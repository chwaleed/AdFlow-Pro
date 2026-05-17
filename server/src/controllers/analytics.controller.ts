import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Ad } from '../models/Ad.js'
import { Payment } from '../models/Payment.js'
import { AuditLog } from '../models/AuditLog.js'
import { AdStatusHistory } from '../models/AdStatusHistory.js'
import { SystemHealthLog } from '../models/SystemHealthLog.js'

function dateRange(req: Request): { from: Date; to: Date } {
  const to = req.query.to ? new Date(req.query.to as string) : new Date()
  const from = req.query.from ? new Date(req.query.from as string) : new Date(to.getTime() - 30 * 86_400_000)
  return { from, to }
}

export async function getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req)
    const dateFilter = { createdAt: { $gte: from, $lte: to } }

    const [
      listingsByStatus,
      revenueTotal,
      revenueByPackage,
      moderationStats,
      adsByCategory,
      adsByCity,
      recentCronRuns,
    ] = await Promise.all([
      // Listings by status
      Ad.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Revenue total (verified payments in range)
      Payment.aggregate([
        { $match: { status: 'verified', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Revenue by package
      Payment.aggregate([
        { $match: { status: 'verified', ...dateFilter } },
        { $lookup: { from: 'ads', localField: 'ad_id', foreignField: '_id', as: 'ad' } },
        { $unwind: { path: '$ad', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'packages', localField: 'ad.package_id', foreignField: '_id', as: 'pkg' } },
        { $unwind: { path: '$pkg', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { pkg_id: '$pkg._id', pkg_name: '$pkg.name' }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
      ]),

      // Moderation: approved vs rejected
      AdStatusHistory.aggregate([
        { $match: { new_status: { $in: ['payment_pending', 'rejected'] }, ...dateFilter } },
        { $group: { _id: '$new_status', count: { $sum: 1 } } },
      ]),

      // Ads by category (published)
      Ad.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category_id', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ['$cat.name', 'Uncategorized'] }, count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Ads by city (published)
      Ad.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$city_id', count: { $sum: 1 } } },
        { $lookup: { from: 'cities', localField: '_id', foreignField: '_id', as: 'city' } },
        { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ['$city.name', 'Unknown'] }, count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Last cron run per job
      AuditLog.aggregate([
        { $match: { action_type: { $regex: '^cron_' } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$action_type', last_run: { $first: '$createdAt' }, last_status: { $first: '$new_value' } } },
      ]),
    ])

    const approved = moderationStats.find(s => s._id === 'payment_pending')?.count ?? 0
    const rejected = moderationStats.find(s => s._id === 'rejected')?.count ?? 0
    const total = approved + rejected
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : null

    res.json({
      ok: true,
      data: {
        range: { from, to },
        listings: {
          by_status: listingsByStatus,
          total: listingsByStatus.reduce((s, r) => s + r.count, 0),
        },
        revenue: {
          total: revenueTotal[0]?.total ?? 0,
          count: revenueTotal[0]?.count ?? 0,
          by_package: revenueByPackage,
        },
        moderation: {
          approved,
          rejected,
          approval_rate_pct: approvalRate,
        },
        taxonomy: {
          by_category: adsByCategory,
          by_city: adsByCity,
        },
        operations: {
          cron_jobs: recentCronRuns,
        },
      },
    })
  } catch (err) { next(err) }
}

export async function getRevenueCSV(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = dateRange(req)
    const payments = await Payment.find({ status: 'verified', createdAt: { $gte: from, $lte: to } })
      .populate('user_id', 'name email')
      .populate({ path: 'ad_id', select: 'title package_id', populate: { path: 'package_id', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean()

    const header = 'Date,Client,Email,Ad Title,Package,Amount,Method,Transaction Ref\n'
    const rows = payments.map(p => {
      const user = p.user_id as { name: string; email: string } | null
      const ad = p.ad_id as { title: string; package_id: { name: string } | null } | null
      return [
        new Date(p.createdAt as Date).toISOString().split('T')[0],
        user?.name ?? '',
        user?.email ?? '',
        ad?.title ?? '',
        (ad?.package_id as { name?: string } | null)?.name ?? '',
        p.amount,
        p.method,
        p.transaction_ref,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    }).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="revenue.csv"')
    res.send(header + rows)
  } catch (err) { next(err) }
}

// ── 4.6 Health & Audit ────────────────────────────────────────────────────────

export async function getDbHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const start = Date.now()
    await mongoose.connection.db!.admin().ping()
    const pingMs = Date.now() - start

    const writeStart = Date.now()
    const doc = await SystemHealthLog.create({ source: 'api_health_check', response_ms: pingMs, status: 'ok', checked_at: new Date() })
    const writeMs = Date.now() - writeStart
    await SystemHealthLog.findByIdAndDelete(doc._id)

    res.json({ ok: true, data: { ping_ms: pingMs, write_ms: writeMs, status: 'ok' } })
  } catch (err) {
    res.status(503).json({ ok: false, error: 'Database unreachable' })
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
    const filter: Record<string, unknown> = {}

    if (req.query.action_type) filter.action_type = req.query.action_type
    if (req.query.target_type) filter.target_type = req.query.target_type
    if (req.query.actor_id && mongoose.isValidObjectId(req.query.actor_id as string))
      filter.actor_id = new mongoose.Types.ObjectId(req.query.actor_id as string)
    if (req.query.from || req.query.to) {
      const dateF: Record<string, Date> = {}
      if (req.query.from) dateF.$gte = new Date(req.query.from as string)
      if (req.query.to) dateF.$lte = new Date(req.query.to as string)
      filter.createdAt = dateF
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor_id', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ])

    res.json({ ok: true, data: { logs, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getStatusHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
    const filter: Record<string, unknown> = {}

    if (req.query.ad_id && mongoose.isValidObjectId(req.query.ad_id as string))
      filter.ad_id = new mongoose.Types.ObjectId(req.query.ad_id as string)
    if (req.query.new_status) filter.new_status = req.query.new_status

    const [history, total] = await Promise.all([
      AdStatusHistory.find(filter)
        .populate('ad_id', 'title slug')
        .populate('changed_by', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdStatusHistory.countDocuments(filter),
    ])

    res.json({ ok: true, data: { history, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getHealthLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
    const logs = await SystemHealthLog.find()
      .sort({ checked_at: -1 })
      .limit(limit)
      .lean()
    res.json({ ok: true, data: { logs } })
  } catch (err) { next(err) }
}
