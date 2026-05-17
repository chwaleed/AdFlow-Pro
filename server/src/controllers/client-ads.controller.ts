import type { Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Ad } from '../models/Ad.js'
import { AdMedia } from '../models/AdMedia.js'
import { generateSlug } from '../utils/slug.js'
import { logStatusChange, logAudit } from '../utils/audit.js'
import { createAdSchema, updateAdSchema } from '../validators/client-ads.validator.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function createAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createAdSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: parsed.error.errors[0]?.message })
      return
    }

    const slug = await generateSlug(parsed.data.title)
    const ad = await Ad.create({
      ...parsed.data,
      slug,
      user_id: req.user!._id,
      status: 'draft',
    })

    await logAudit({ actor_id: req.user!._id, action_type: 'ad_created', target_type: 'Ad', target_id: ad._id.toString() })

    res.status(201).json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}

export async function updateAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }

    const ad = await Ad.findById(id)
    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }
    if (ad.user_id.toString() !== req.user!._id.toString()) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }
    if (ad.status !== 'draft') { res.status(400).json({ ok: false, error: 'Only draft ads can be edited' }); return }

    const parsed = updateAdSchema.safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ ok: false, error: parsed.error.errors[0]?.message }); return }

    if (parsed.data.title && parsed.data.title !== ad.title) {
      parsed.data.title && Object.assign(parsed.data, { slug: await generateSlug(parsed.data.title) })
    }

    Object.assign(ad, parsed.data)
    await ad.save()

    res.json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}

export async function submitAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }

    const ad = await Ad.findById(id)
    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }
    if (ad.user_id.toString() !== req.user!._id.toString()) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }
    if (ad.status !== 'draft') { res.status(400).json({ ok: false, error: 'Only draft ads can be submitted' }); return }

    if (!ad.title || !ad.description || !ad.category_id) {
      res.status(400).json({ ok: false, error: 'Title, description, and category are required before submitting' })
      return
    }

    const previousStatus = ad.status
    ad.status = 'submitted'
    await ad.save()

    await logStatusChange({ ad_id: id, previous_status: previousStatus, new_status: 'submitted', changed_by: req.user!._id, note: 'Client submitted ad' })
    await logAudit({ actor_id: req.user!._id, action_type: 'ad_submitted', target_type: 'Ad', target_id: id, old_value: previousStatus, new_value: 'submitted' })

    res.json({ ok: true, data: { ad } })
  } catch (err) { next(err) }
}

export async function getMyAds(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const filter: Record<string, unknown> = { user_id: req.user!._id }
    if (req.query.status) filter.status = req.query.status

    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .populate('category_id', 'name')
        .populate('city_id', 'name')
        .populate('package_id', 'name price')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ad.countDocuments(filter),
    ])

    res.json({ ok: true, data: { ads, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getMyAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }

    const ad = await Ad.findById(id)
      .populate('category_id', 'name')
      .populate('city_id', 'name')
      .populate('package_id', 'name price duration_days')

    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }
    if (ad.user_id.toString() !== req.user!._id.toString()) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }

    const media = await AdMedia.find({ ad_id: id }).sort({ order: 1 })

    res.json({ ok: true, data: { ad, media } })
  } catch (err) { next(err) }
}

export async function deleteAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }

    const ad = await Ad.findById(id)
    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }
    if (ad.user_id.toString() !== req.user!._id.toString()) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }
    if (ad.status !== 'draft') { res.status(400).json({ ok: false, error: 'Only draft ads can be deleted' }); return }

    ad.status = 'archived'
    await ad.save()

    await logAudit({ actor_id: req.user!._id, action_type: 'ad_archived', target_type: 'Ad', target_id: id })

    res.json({ ok: true })
  } catch (err) { next(err) }
}
