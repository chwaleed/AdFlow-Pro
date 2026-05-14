import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, type UserRole } from '../models/User.js'
import { env } from '../config/env.js'

export interface AuthRequest extends Request {
  user?: { _id: string; name: string; email: string; role: UserRole; status: string }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ ok: false, error: 'Authentication required' })
      return
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string }
    const user = await User.findById(decoded.userId).lean()

    if (!user) { res.status(401).json({ ok: false, error: 'User not found' }); return }
    if (user.status === 'suspended') { res.status(403).json({ ok: false, error: 'Account suspended' }); return }

    req.user = user as AuthRequest['user']
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ ok: false, error: 'Insufficient permissions' })
      return
    }
    next()
  }
}
