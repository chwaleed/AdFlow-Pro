import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { SellerProfile } from '../models/SellerProfile.js'
import { env } from '../config/env.js'
import type { AuthRequest } from '../middleware/auth.js'

function signTokens(userId: string) {
  return {
    accessToken: jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES as string }),
    refreshToken: jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES as string }),
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string }

    if (await User.findOne({ email })) {
      res.status(409).json({ ok: false, error: 'Email already registered' }); return
    }

    const password_hash = await User.hashPassword(password)
    const user = await User.create({ name, email, password_hash })
    await SellerProfile.create({ user_id: user._id, display_name: name })

    const { accessToken, refreshToken } = signTokens(user._id.toString())
    await User.findByIdAndUpdate(user._id, { refresh_token: refreshToken })

    res.status(201).json({ ok: true, data: { user: user.toJSON(), accessToken, refreshToken } })
  } catch (err) { next(err) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string }

    const user = await User.findOne({ email }).select('+password_hash')
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ ok: false, error: 'Invalid email or password' }); return
    }
    if (user.status === 'suspended') {
      res.status(403).json({ ok: false, error: 'Account suspended' }); return
    }

    const { accessToken, refreshToken } = signTokens(user._id.toString())
    await User.findByIdAndUpdate(user._id, { refresh_token: refreshToken })

    res.json({ ok: true, data: { user: user.toJSON(), accessToken, refreshToken } })
  } catch (err) { next(err) }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) { res.status(401).json({ ok: false, error: 'Refresh token required' }); return }

    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { userId: string }
    const user = await User.findById(decoded.userId).select('+refresh_token')

    if (!user || user.refresh_token !== refreshToken) {
      res.status(401).json({ ok: false, error: 'Invalid refresh token' }); return
    }

    const tokens = signTokens(user._id.toString())
    await User.findByIdAndUpdate(user._id, { refresh_token: tokens.refreshToken })

    res.json({ ok: true, data: tokens })
  } catch (err) { next(err) }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await User.findByIdAndUpdate(req.user!._id, { refresh_token: null })
    res.json({ ok: true, data: null })
  } catch (err) { next(err) }
}

export function me(req: AuthRequest, res: Response) {
  res.json({ ok: true, data: { user: req.user } })
}
