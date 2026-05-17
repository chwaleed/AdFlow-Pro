import type { Response, NextFunction } from 'express'
import type { Request } from 'express'
import mongoose from 'mongoose'
import { Ad } from '../models/Ad.js'
import { AdMedia } from '../models/AdMedia.js'
import { AdStatusHistory } from '../models/AdStatusHistory.js'
import { Category } from '../models/Category.js'
import { City } from '../models/City.js'
import { Package } from '../models/Package.js'
import { LearningQuestion } from '../models/LearningQuestion.js'
import { AuditLog } from '../models/AuditLog.js'
import { computeRankScore } from '../utils/ranking.js'
import type { IPackage } from '../models/Package.js'
import type { AuthRequest } from '../middleware/auth.js'

const PUBLISHED_FILTER = {
  status: 'published',
  publish_at: { $lte: new Date() },
  expire_at: { $gt: new Date() },
}

// ── Milestone 4.1 — Public Ad Browsing ────────────────────────────────────────

export async function listAds(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const sort = (req.query.sort as string) || 'rank'

    const filter: Record<string, unknown> = { ...PUBLISHED_FILTER }
    if (req.query.category) filter.category_id = new mongoose.Types.ObjectId(req.query.category as string)
    if (req.query.city) filter.city_id = new mongoose.Types.ObjectId(req.query.city as string)
    if (req.query.package) filter.package_id = new mongoose.Types.ObjectId(req.query.package as string)
    if (req.query.min_price || req.query.max_price) {
      const priceFilter: Record<string, number> = {}
      if (req.query.min_price) priceFilter.$gte = Number(req.query.min_price)
      if (req.query.max_price) priceFilter.$lte = Number(req.query.max_price)
      filter.price = priceFilter
    }
    if (req.query.q) filter.$text = { $search: req.query.q as string }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      rank: { rank_score: -1, createdAt: -1 },
      newest: { publish_at: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    }
    const sortObj = sortMap[sort] ?? sortMap.rank

    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category_id', 'name slug')
        .populate('city_id', 'name slug')
        .populate('package_id', 'name label is_featured')
        .lean(),
      Ad.countDocuments(filter),
    ])

    // Attach primary media
    const adIds = ads.map(a => a._id)
    const mediaList = await AdMedia.find({ ad_id: { $in: adIds }, is_primary: true }).lean()
    const mediaMap = new Map(mediaList.map(m => [m.ad_id.toString(), m]))
    const adsWithMedia = ads.map(a => ({ ...a, primary_media: mediaMap.get(a._id.toString()) ?? null }))

    res.json({ ok: true, data: { ads: adsWithMedia, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getAdBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const ad = await Ad.findOne({ slug, ...PUBLISHED_FILTER })
      .populate('user_id', 'name')
      .populate('category_id', 'name slug')
      .populate('city_id', 'name slug')
      .populate('package_id', 'name label is_featured duration_days')

    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }

    ad.view_count += 1
    await ad.save()

    const [media, history] = await Promise.all([
      AdMedia.find({ ad_id: ad._id }).sort({ is_primary: -1, order: 1 }).lean(),
      AdStatusHistory.find({ ad_id: ad._id }).sort({ createdAt: 1 }).lean(),
    ])

    res.json({ ok: true, data: { ad, media, history } })
  } catch (err) { next(err) }
}

export async function reportAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { reason } = req.body as { reason: string }

    if (!mongoose.isValidObjectId(id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    if (!reason?.trim()) { res.status(400).json({ ok: false, error: 'Reason is required' }); return }

    const ad = await Ad.findById(id)
    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }

    await AuditLog.create({
      actor_id: req.user?._id ? new mongoose.Types.ObjectId(req.user._id.toString()) : undefined,
      action_type: 'ad_reported',
      target_type: 'Ad',
      target_id: ad._id,
      new_value: { reason },
    })

    res.json({ ok: true })
  } catch (err) { next(err) }
}

// ── Milestone 4.2 — Category, City & Landing Composition ──────────────────────

export async function getCategoryListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const category = await Category.findOne({ slug, is_active: true }).lean()
    if (!category) { res.status(404).json({ ok: false, error: 'Category not found' }); return }

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))

    const filter = { ...PUBLISHED_FILTER, category_id: category._id }
    const [ads, total] = await Promise.all([
      Ad.find(filter).sort({ rank_score: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('city_id', 'name slug').populate('package_id', 'name label').lean(),
      Ad.countDocuments(filter),
    ])

    res.json({ ok: true, data: { category, ads, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getCityListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const city = await City.findOne({ slug, is_active: true }).lean()
    if (!city) { res.status(404).json({ ok: false, error: 'City not found' }); return }

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))

    const filter = { ...PUBLISHED_FILTER, city_id: city._id }
    const [ads, total] = await Promise.all([
      Ad.find(filter).sort({ rank_score: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('category_id', 'name slug').populate('package_id', 'name label').lean(),
      Ad.countDocuments(filter),
    ])

    res.json({ ok: true, data: { city, ads, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getLandingData(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date()
    const publishedFilter = { status: 'published', publish_at: { $lte: now }, expire_at: { $gt: now } }

    const [featuredAds, recentAds, categories, packages, question] = await Promise.all([
      Ad.find({ ...publishedFilter, is_featured: true })
        .sort({ rank_score: -1 }).limit(6)
        .populate('category_id', 'name slug').populate('city_id', 'name slug')
        .populate('package_id', 'name label').lean(),
      Ad.find(publishedFilter)
        .sort({ publish_at: -1 }).limit(12)
        .populate('category_id', 'name slug').populate('city_id', 'name slug').lean(),
      Category.find({ is_active: true }).sort({ sort_order: 1, name: 1 }).lean(),
      Package.find({ is_active: true }).sort({ weight: -1 }).lean(),
      LearningQuestion.aggregate([{ $match: { is_active: true } }, { $sample: { size: 1 } }]),
    ])

    // Attach primary media to featured + recent ads
    const allIds = [...featuredAds, ...recentAds].map(a => a._id)
    const mediaList = await AdMedia.find({ ad_id: { $in: allIds }, is_primary: true }).lean()
    const mediaMap = new Map(mediaList.map(m => [m.ad_id.toString(), m]))
    const withMedia = (ads: typeof featuredAds) => ads.map(a => ({ ...a, primary_media: mediaMap.get(a._id.toString()) ?? null }))

    res.json({
      ok: true,
      data: {
        featured_ads: withMedia(featuredAds),
        recent_ads: withMedia(recentAds),
        categories,
        packages,
        question: question[0] ?? null,
      },
    })
  } catch (err) { next(err) }
}

export async function getRandomQuestion(_req: Request, res: Response, next: NextFunction) {
  try {
    const [question] = await LearningQuestion.aggregate([
      { $match: { is_active: true } },
      { $sample: { size: 1 } },
    ])
    res.json({ ok: true, data: { question: question ?? null } })
  } catch (err) { next(err) }
}

// ── Milestone 4.3 — Ranking Engine ────────────────────────────────────────────

export async function recomputeRankings(_req: Request, res: Response, next: NextFunction) {
  try {
    const ads = await Ad.find({ status: { $in: ['published', 'scheduled'] } })
      .populate<{ package_id: IPackage }>('package_id')
      .lean()

    let updated = 0
    const bulkOps = ads.map(ad => {
      const pkg = ad.package_id as IPackage | null
      const rankScore = computeRankScore({
        packageWeight: pkg?.weight ?? 1,
        isFeatured: ad.is_featured,
        publishAt: ad.publish_at ?? new Date(),
        adminBoost: ad.admin_boost,
      })
      updated++
      return {
        updateOne: {
          filter: { _id: ad._id },
          update: { $set: { rank_score: rankScore } },
        },
      }
    })

    if (bulkOps.length > 0) await Ad.bulkWrite(bulkOps)

    res.json({ ok: true, data: { updated } })
  } catch (err) { next(err) }
}
