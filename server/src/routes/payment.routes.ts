import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { uploadScreenshot } from '../middleware/upload.js'
import { submitPayment, getMyPayments, getPaymentById } from '../controllers/payment.controller.js'

const router = Router()

router.post('/', requireAuth, uploadScreenshot, submitPayment)
router.get('/', requireAuth, getMyPayments)
router.get('/:id', requireAuth, getPaymentById)

export default router
