import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createAd, updateAd, submitAd, getMyAds, getMyAd, deleteAd,
} from '../controllers/client-ads.controller.js'

const router = Router()

router.get('/', requireAuth, getMyAds)
router.post('/', requireAuth, createAd)
router.get('/:id', requireAuth, getMyAd)
router.patch('/:id', requireAuth, updateAd)
router.delete('/:id', requireAuth, deleteAd)
router.post('/:id/submit', requireAuth, submitAd)

export default router
