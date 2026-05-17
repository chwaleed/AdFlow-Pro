import type { Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Payment } from '../models/Payment.js'
import { Ad } from '../models/Ad.js'
import { logStatusChange, logAudit } from '../utils/audit.js'
import { submitPaymentSchema } from '../validators/payment.validator.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function submitPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = submitPaymentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: parsed.error.errors[0]?.message })
      return
    }

    const { ad_id, amount, method, transaction_ref, sender_name } = parsed.data

    if (!mongoose.isValidObjectId(ad_id)) { res.status(400).json({ ok: false, error: 'Invalid ad_id' }); return }

    const ad = await Ad.findById(ad_id)
    if (!ad) { res.status(404).json({ ok: false, error: 'Ad not found' }); return }
    if (ad.user_id.toString() !== req.user!._id.toString()) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }
    if (ad.status !== 'payment_pending') {
      res.status(400).json({ ok: false, error: 'Ad is not in payment_pending status' })
      return
    }

    const paymentData: Record<string, unknown> = {
      ad_id: new mongoose.Types.ObjectId(ad_id),
      user_id: new mongoose.Types.ObjectId(req.user!._id),
      amount,
      method,
      transaction_ref,
      sender_name,
      status: 'submitted',
    }

    if (req.file) {
      paymentData.screenshot_url = `/uploads/${req.file.filename}`
      paymentData.screenshot_s3_key = req.file.filename
    }

    const payment = await Payment.create(paymentData)

    const previousStatus = ad.status
    ad.status = 'payment_submitted'
    await ad.save()

    await logStatusChange({ ad_id: ad._id.toString(), previous_status: previousStatus, new_status: 'payment_submitted', changed_by: req.user!._id, note: 'Payment submitted' })
    await logAudit({ actor_id: req.user!._id, action_type: 'payment_submitted', target_type: 'Payment', target_id: payment._id.toString(), new_value: { amount, method } })

    res.status(201).json({ ok: true, data: { payment } })
  } catch (err: unknown) {
    const e = err as { code?: number }
    if (e.code === 11000) {
      res.status(409).json({ ok: false, error: 'Transaction reference already used' })
      return
    }
    next(err)
  }
}

export async function getMyPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const filter: Record<string, unknown> = { user_id: req.user!._id }
    if (req.query.ad_id) {
      if (!mongoose.isValidObjectId(req.query.ad_id as string)) { res.status(400).json({ ok: false, error: 'Invalid ad_id' }); return }
      filter.ad_id = new mongoose.Types.ObjectId(req.query.ad_id as string)
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter).populate('ad_id', 'title status').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Payment.countDocuments(filter),
    ])

    res.json({ ok: true, data: { payments, total, page, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function getPaymentById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }

    const payment = await Payment.findById(id).populate('ad_id', 'title status')
    if (!payment) { res.status(404).json({ ok: false, error: 'Payment not found' }); return }
    if (payment.user_id.toString() !== req.user!._id.toString()) { res.status(403).json({ ok: false, error: 'Forbidden' }); return }

    res.json({ ok: true, data: { payment } })
  } catch (err) { next(err) }
}
