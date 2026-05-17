import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { sanitizeMongoBody } from './middleware/sanitizeMongoBody.js'
import authRoutes from './routes/auth.routes.js'
import moderatorRoutes from './routes/moderator.routes.js'
import adminRoutes from './routes/admin.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import mediaRoutes from './routes/media.routes.js'
import taxonomyRoutes from './routes/taxonomy.routes.js'
import clientAdsRoutes from './routes/client-ads.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import publicRoutes from './routes/public.routes.js'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(sanitizeMongoBody)

if (env.NODE_ENV === 'development') app.use(morgan('dev'))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { ok: false, error: 'Too many requests, please try again later' },
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'ok', env: env.NODE_ENV } })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api', taxonomyRoutes)
app.use('/api', publicRoutes)
app.use('/api/client/ads', clientAdsRoutes)
app.use('/api/client/payments', paymentRoutes)
app.use('/api/moderator', moderatorRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `${req.method} ${req.url} not found` })
})

app.use(errorHandler)

export default app
