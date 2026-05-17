import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { uploadSingle } from '../middleware/upload.js'
import { uploadMedia, confirmMedia, deleteMedia } from '../controllers/media.controller.js'

const router = Router()

router.post('/upload', requireAuth, uploadSingle, uploadMedia)
router.post('/confirm', requireAuth, confirmMedia)
router.delete('/:id', requireAuth, deleteMedia)

export default router
