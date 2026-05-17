import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Package } from '../models/Package.js'
import { Category } from '../models/Category.js'
import { City } from '../models/City.js'
import { AuditLog } from '../models/AuditLog.js'

// ── Slug utility ──────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function uniqueSlug(base: string, model: { findOne: Function }, excludeId?: string): Promise<string> {
  let slug = slugify(base)
  let counter = 1
  while (true) {
    const q = excludeId ? { slug, _id: { $ne: excludeId } } : { slug }
    const existing = await model.findOne(q)
    if (!existing) return slug
    slug = `${slugify(base)}-${counter++}`
  }
}

// ── User management ───────────────────────────────────────────────────────────

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
    const skip = (page - 1) * limit
    const roleFilter = req.query.role as string | undefined
    const statusFilter = req.query.status as string | undefined

    const filter: Record<string, unknown> = {}
    const validRoles = ['client', 'moderator', 'admin', 'super_admin']
    if (roleFilter && validRoles.includes(roleFilter)) filter.role = roleFilter
    if (statusFilter && ['active', 'suspended'].includes(statusFilter)) filter.status = statusFilter

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password_hash -refresh_token').lean(),
      User.countDocuments(filter),
    ])

    res.json({ ok: true, data: { items, total, page, limit, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, role } = req.body as { status?: string; role?: string }

    if (role && req.user!.role !== 'super_admin') {
      res.status(403).json({ ok: false, error: 'Only super admins can change user roles' })
      return
    }

    const user = await User.findById(id)
    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found' })
      return
    }

    const oldValues: Record<string, unknown> = {}
    const newValues: Record<string, unknown> = {}

    if (status && status !== user.status) {
      oldValues.status = user.status
      user.status = status as 'active' | 'suspended'
      newValues.status = status
    }
    if (role && role !== user.role) {
      oldValues.role = user.role
      user.role = role as typeof user.role
      newValues.role = role
    }

    await user.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_update_user',
      target_type: 'User',
      target_id: user._id,
      old_value: oldValues,
      new_value: newValues,
    })

    res.json({ ok: true, data: { user } })
  } catch (err) { next(err) }
}

// ── Package management ────────────────────────────────────────────────────────

export async function listPackagesAdmin(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await Package.find().sort({ sort_order: 1, name: 1 }).lean()
    res.json({ ok: true, data: { items } })
  } catch (err) { next(err) }
}

export async function createPackage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = req.body
    const pkg = await Package.create({ ...data, is_active: true })

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_create_package',
      target_type: 'Package',
      target_id: pkg._id,
      new_value: data,
    })

    res.status(201).json({ ok: true, data: { package: pkg } })
  } catch (err) { next(err) }
}

export async function updatePackage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const data = req.body

    const pkg = await Package.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    if (!pkg) {
      res.status(404).json({ ok: false, error: 'Package not found' })
      return
    }

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_update_package',
      target_type: 'Package',
      target_id: pkg._id,
      new_value: data,
    })

    res.json({ ok: true, data: { package: pkg } })
  } catch (err) { next(err) }
}

export async function togglePackage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const pkg = await Package.findById(id)
    if (!pkg) {
      res.status(404).json({ ok: false, error: 'Package not found' })
      return
    }

    pkg.is_active = !pkg.is_active
    await pkg.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_toggle_package',
      target_type: 'Package',
      target_id: pkg._id,
      new_value: { is_active: pkg.is_active },
    })

    res.json({ ok: true, data: { package: pkg } })
  } catch (err) { next(err) }
}

// ── Category management ───────────────────────────────────────────────────────

export async function listCategoriesAdmin(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await Category.find().sort({ sort_order: 1, name: 1 }).lean()
    res.json({ ok: true, data: { items } })
  } catch (err) { next(err) }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, slug: slugInput, icon, sort_order } = req.body as {
      name: string; slug?: string; icon?: string; sort_order?: number
    }

    const slug = await uniqueSlug(slugInput || name, Category)
    const category = await Category.create({ name, slug, icon, sort_order: sort_order ?? 0, is_active: true })

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_create_category',
      target_type: 'Category',
      target_id: category._id,
      new_value: { name, slug },
    })

    res.status(201).json({ ok: true, data: { category } })
  } catch (err) { next(err) }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, slug: slugInput, icon, sort_order } = req.body as {
      name?: string; slug?: string; icon?: string; sort_order?: number
    }

    const category = await Category.findById(id)
    if (!category) {
      res.status(404).json({ ok: false, error: 'Category not found' })
      return
    }

    if (name) category.name = name
    if (icon !== undefined) category.icon = icon
    if (sort_order !== undefined) category.sort_order = sort_order

    if (slugInput || name) {
      category.slug = await uniqueSlug(slugInput || name || category.name, Category, id)
    }

    await category.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_update_category',
      target_type: 'Category',
      target_id: category._id,
      new_value: req.body,
    })

    res.json({ ok: true, data: { category } })
  } catch (err) { next(err) }
}

export async function toggleCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const category = await Category.findById(id)
    if (!category) {
      res.status(404).json({ ok: false, error: 'Category not found' })
      return
    }

    category.is_active = !category.is_active
    await category.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_toggle_category',
      target_type: 'Category',
      target_id: category._id,
      new_value: { is_active: category.is_active },
    })

    res.json({ ok: true, data: { category } })
  } catch (err) { next(err) }
}

// ── City management ───────────────────────────────────────────────────────────

export async function listCitiesAdmin(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await City.find().sort({ sort_order: 1, name: 1 }).lean()
    res.json({ ok: true, data: { items } })
  } catch (err) { next(err) }
}

export async function createCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, slug: slugInput, sort_order } = req.body as {
      name: string; slug?: string; sort_order?: number
    }

    const slug = await uniqueSlug(slugInput || name, City)
    const city = await City.create({ name, slug, sort_order: sort_order ?? 0, is_active: true })

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_create_city',
      target_type: 'City',
      target_id: city._id,
      new_value: { name, slug },
    })

    res.status(201).json({ ok: true, data: { city } })
  } catch (err) { next(err) }
}

export async function updateCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, slug: slugInput, sort_order } = req.body as {
      name?: string; slug?: string; sort_order?: number
    }

    const city = await City.findById(id)
    if (!city) {
      res.status(404).json({ ok: false, error: 'City not found' })
      return
    }

    if (name) city.name = name
    if (sort_order !== undefined) city.sort_order = sort_order
    if (slugInput || name) {
      city.slug = await uniqueSlug(slugInput || name || city.name, City, id)
    }

    await city.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_update_city',
      target_type: 'City',
      target_id: city._id,
      new_value: req.body,
    })

    res.json({ ok: true, data: { city } })
  } catch (err) { next(err) }
}

export async function toggleCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const city = await City.findById(id)
    if (!city) {
      res.status(404).json({ ok: false, error: 'City not found' })
      return
    }

    city.is_active = !city.is_active
    await city.save()

    await AuditLog.create({
      actor_id: req.user!._id,
      action_type: 'admin_toggle_city',
      target_type: 'City',
      target_id: city._id,
      new_value: { is_active: city.is_active },
    })

    res.json({ ok: true, data: { city } })
  } catch (err) { next(err) }
}
