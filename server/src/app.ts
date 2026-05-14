import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(mongoSanitize())
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

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

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `${req.method} ${req.url} not found` })
})

app.use(errorHandler)

export default app
