import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error & { code?: number; status?: number; statusCode?: number; keyValue?: Record<string, unknown> }, req: Request, res: Response, _next: NextFunction) {
  console.error(`[${req.method} ${req.url}]`, err.message)

  if (err.name === 'ValidationError') {
    res.status(400).json({ ok: false, error: err.message }); return
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field'
    res.status(409).json({ ok: false, error: `${field} already exists` }); return
  }
  if (err.name === 'CastError') {
    res.status(400).json({ ok: false, error: 'Invalid ID format' }); return
  }

  const status = err.status ?? err.statusCode ?? 500
  const message = status < 500 ? err.message : 'Internal server error'
  res.status(status).json({ ok: false, error: message })
}
