import { Router } from 'express'
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { registerSchema, loginSchema, validate } from '../validators/auth.validator.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', requireAuth, logout)
router.get('/me', requireAuth, me)

export default router
