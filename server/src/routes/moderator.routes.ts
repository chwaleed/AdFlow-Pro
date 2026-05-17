import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../validators/auth.validator.js'
import { reviewActionSchema } from '../validators/moderator.validator.js'
import { getReviewQueue, getAdForReview, reviewAd } from '../controllers/moderator.controller.js'

const router = Router()

router.use(requireAuth, requireRole('moderator', 'admin', 'super_admin'))

router.get('/review-queue', getReviewQueue)
router.get('/ads/:id', getAdForReview)
router.patch('/ads/:id/review', validate(reviewActionSchema), reviewAd)

export default router
