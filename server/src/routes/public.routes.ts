import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listAds, getAdBySlug, reportAd,
  getCategoryListing, getCityListing,
  getLandingData, getRandomQuestion,
  recomputeRankings,
} from '../controllers/public.controller.js'

const router = Router()

// Milestone 4.1 — Public ad browsing
router.get('/ads', listAds)
router.get('/ads/:slug', getAdBySlug)
router.post('/ads/:id/report', requireAuth, reportAd)

// Milestone 4.2 — Category / city listings + landing
router.get('/landing', getLandingData)
router.get('/questions/random', getRandomQuestion)
router.get('/categories/:slug/ads', getCategoryListing)
router.get('/cities/:slug/ads', getCityListing)

// Milestone 4.3 — Ranking recompute (admin-triggered)
router.post('/admin/recompute-rankings', recomputeRankings)

export default router
