import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import type { RequestHandler } from 'express'

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin'
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    cb(null, name)
  },
})

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, WebP, and GIF allowed'))
}

const screenshotFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, WebP, and PDF allowed'))
}

function wrap(middleware: RequestHandler): RequestHandler {
  return (req, res, next) => {
    (middleware as (req: typeof req, res: typeof res, cb: (err?: unknown) => void) => void)(req, res, (err?: unknown) => {
      if (!err) return next()
      const msg = err instanceof multer.MulterError ? err.message
        : err instanceof Error ? err.message
        : 'File upload error'
      res.status(400).json({ ok: false, error: msg })
    })
  }
}

const imageUpload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } })
const screenshotUpload = multer({ storage, fileFilter: screenshotFilter, limits: { fileSize: 5 * 1024 * 1024 } })

export const uploadSingle = wrap(imageUpload.single('file'))
export const uploadMultiple = wrap(imageUpload.array('files', 5))
export const uploadScreenshot = wrap(screenshotUpload.single('screenshot'))
