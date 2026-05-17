import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', getNotifications)
router.patch('/read-all', markAllRead)
router.patch('/:id/read', markRead)

export default router
