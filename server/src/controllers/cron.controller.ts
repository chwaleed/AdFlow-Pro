import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import {
  runPublishScheduled,
  runExpireAds,
  runExpiringSoonNotify,
  runRankRecompute,
  runDbHeartbeat,
} from '../jobs/jobs.js'

const JOBS: Record<string, () => Promise<unknown>> = {
  publish_scheduled: runPublishScheduled,
  expire_ads: runExpireAds,
  expiring_soon_notify: runExpiringSoonNotify,
  rank_recompute: runRankRecompute,
  db_heartbeat: runDbHeartbeat,
}

export async function triggerJob(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = req.headers['x-cron-secret']
    if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
      res.status(403).json({ ok: false, error: 'Forbidden' })
      return
    }

    const { job } = req.params
    const fn = JOBS[job]
    if (!fn) {
      res.status(404).json({ ok: false, error: `Unknown job: ${job}. Valid: ${Object.keys(JOBS).join(', ')}` })
      return
    }

    const result = await fn()
    res.json({ ok: true, data: { job, result } })
  } catch (err) {
    next(err)
  }
}
