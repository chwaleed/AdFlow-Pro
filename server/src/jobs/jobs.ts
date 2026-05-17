import cron from 'node-cron'
import mongoose from 'mongoose'
import { Ad } from '../models/Ad.js'
import { AuditLog } from '../models/AuditLog.js'
import { AdStatusHistory } from '../models/AdStatusHistory.js'
import { SystemHealthLog } from '../models/SystemHealthLog.js'
import { computeRankScore } from '../utils/ranking.js'
import { createNotification } from '../services/notification.service.js'
import type { IPackage } from '../models/Package.js'

async function logJob(name: string, status: 'ok' | 'error', meta: unknown) {
  await AuditLog.create({
    action_type: `cron_${name}`,
    target_type: 'System',
    target_id: new mongoose.Types.ObjectId(),
    new_value: { status, ...((meta as object) ?? {}) },
  }).catch(() => {})
}

// ── Publish scheduled ads ─────────────────────────────────────────────────────
export async function runPublishScheduled(): Promise<number> {
  const now = new Date()
  const ads = await Ad.find({ status: 'scheduled', publish_at: { $lte: now } })
    .populate<{ package_id: IPackage }>('package_id')

  let count = 0
  for (const ad of ads) {
    const pkg = ad.package_id as IPackage | null
    ad.status = 'published'
    ad.rank_score = computeRankScore({
      packageWeight: pkg?.weight ?? 1,
      isFeatured: ad.is_featured,
      publishAt: ad.publish_at ?? now,
      adminBoost: ad.admin_boost,
    })
    await ad.save()
    await AdStatusHistory.create({ ad_id: ad._id, previous_status: 'scheduled', new_status: 'published', note: 'Auto-published by scheduler' })
    createNotification({ user_id: ad.user_id, title: 'Your ad is live!', message: `"${ad.title}" is now published.`, type: 'success', link: '/dashboard' })
    count++
  }
  return count
}

// ── Expire published ads ──────────────────────────────────────────────────────
export async function runExpireAds(): Promise<number> {
  const now = new Date()
  const ads = await Ad.find({ status: 'published', expire_at: { $lte: now } })

  let count = 0
  for (const ad of ads) {
    ad.status = 'expired'
    await ad.save()
    await AdStatusHistory.create({ ad_id: ad._id, previous_status: 'published', new_status: 'expired', note: 'Auto-expired by scheduler' })
    createNotification({ user_id: ad.user_id, title: 'Ad expired', message: `"${ad.title}" has expired.`, type: 'warning', link: '/dashboard' })
    count++
  }
  return count
}

// ── Notify ads expiring within 48h ────────────────────────────────────────────
export async function runExpiringSoonNotify(): Promise<number> {
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const ads = await Ad.find({ status: 'published', expire_at: { $gt: now, $lte: in48h } })

  let count = 0
  for (const ad of ads) {
    createNotification({
      user_id: ad.user_id,
      title: 'Ad expiring soon',
      message: `"${ad.title}" expires in less than 48 hours.`,
      type: 'warning',
      link: '/dashboard',
    })
    count++
  }
  return count
}

// ── Rank recompute ────────────────────────────────────────────────────────────
export async function runRankRecompute(): Promise<number> {
  const ads = await Ad.find({ status: { $in: ['published', 'scheduled'] } })
    .populate<{ package_id: IPackage }>('package_id')
    .lean()

  const bulkOps = ads.map(ad => {
    const pkg = ad.package_id as IPackage | null
    return {
      updateOne: {
        filter: { _id: ad._id },
        update: { $set: { rank_score: computeRankScore({ packageWeight: pkg?.weight ?? 1, isFeatured: ad.is_featured, publishAt: ad.publish_at ?? new Date(), adminBoost: ad.admin_boost }) } },
      },
    }
  })
  if (bulkOps.length) await Ad.bulkWrite(bulkOps)
  return bulkOps.length
}

// ── DB heartbeat ──────────────────────────────────────────────────────────────
export async function runDbHeartbeat(): Promise<void> {
  const start = Date.now()
  await mongoose.connection.db!.admin().ping()
  await SystemHealthLog.create({ source: 'cron_heartbeat', response_ms: Date.now() - start, status: 'ok', checked_at: new Date() })
}

// ── Register all cron jobs ────────────────────────────────────────────────────
export function registerCronJobs() {
  // Every hour — publish scheduled ads
  cron.schedule('0 * * * *', async () => {
    try {
      const count = await runPublishScheduled()
      await logJob('publish_scheduled', 'ok', { published: count })
    } catch (err) {
      await logJob('publish_scheduled', 'error', { error: String(err) })
    }
  })

  // Daily at midnight — expire ads
  cron.schedule('0 0 * * *', async () => {
    try {
      const count = await runExpireAds()
      await logJob('expire_ads', 'ok', { expired: count })
    } catch (err) {
      await logJob('expire_ads', 'error', { error: String(err) })
    }
  })

  // Daily at 9am — expiring-soon notifications
  cron.schedule('0 9 * * *', async () => {
    try {
      const count = await runExpiringSoonNotify()
      await logJob('expiring_soon_notify', 'ok', { notified: count })
    } catch (err) {
      await logJob('expiring_soon_notify', 'error', { error: String(err) })
    }
  })

  // Every 6 hours — rank recompute
  cron.schedule('0 */6 * * *', async () => {
    try {
      const count = await runRankRecompute()
      await logJob('rank_recompute', 'ok', { updated: count })
    } catch (err) {
      await logJob('rank_recompute', 'error', { error: String(err) })
    }
  })

  // Every 5 minutes — DB heartbeat
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runDbHeartbeat()
    } catch (err) {
      await SystemHealthLog.create({ source: 'cron_heartbeat', response_ms: -1, status: 'error', checked_at: new Date() }).catch(() => {})
    }
  })

  console.log('[cron] 5 jobs registered')
}
