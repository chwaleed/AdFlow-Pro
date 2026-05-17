import type { Response, NextFunction } from 'express'
import type { Request } from 'express'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { AdMedia } from '../models/AdMedia.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function uploadMedia(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ ok: false, error: 'No file provided' })
      return
    }

    const { ad_id, is_primary, order } = req.body

    if (ad_id && !mongoose.isValidObjectId(ad_id)) {
      res.status(400).json({ ok: false, error: 'Invalid ad_id' })
      return
    }

    const media = await AdMedia.create({
      ad_id: ad_id ? new mongoose.Types.ObjectId(ad_id) : undefined,
      source_type: 'local',
      original_url: `/uploads/${req.file.filename}`,
      s3_key: req.file.filename,
      validation_status: 'valid',
      is_primary: is_primary === 'true' || is_primary === true,
      order: order ? Number(order) : 0,
    })

    res.status(201).json({ ok: true, data: { media } })
  } catch (err) {
    next(err)
  }
}

export async function confirmMedia(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { media_id, ad_id } = req.body

    if (!mongoose.isValidObjectId(media_id) || !mongoose.isValidObjectId(ad_id)) {
      res.status(400).json({ ok: false, error: 'Invalid media_id or ad_id' })
      return
    }

    const media = await AdMedia.findByIdAndUpdate(
      media_id,
      { ad_id: new mongoose.Types.ObjectId(ad_id) },
      { new: true },
    )

    if (!media) {
      res.status(404).json({ ok: false, error: 'Media not found' })
      return
    }

    res.json({ ok: true, data: { media } })
  } catch (err) {
    next(err)
  }
}

export async function deleteMedia(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ ok: false, error: 'Invalid media id' })
      return
    }

    const media = await AdMedia.findById(id)
    if (!media) {
      res.status(404).json({ ok: false, error: 'Media not found' })
      return
    }

    if (media.source_type === 'local' && media.s3_key) {
      const filePath = path.join(process.cwd(), 'uploads', media.s3_key)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await media.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
