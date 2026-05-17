import type { Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Package } from '../models/Package.js'
import { Category } from '../models/Category.js'
import { City } from '../models/City.js'
import type { AuthRequest } from '../middleware/auth.js'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '')
}

async function uniqueSlug(model: { findOne: (q: object) => { lean: () => Promise<unknown> } }, base: string): Promise<string> {
  let slug = base
  let n = 2
  while (await model.findOne({ slug }).lean()) slug = `${base}-${n++}`
  return slug
}

// Packages
export async function getPackages(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const packages = await Package.find({ is_active: true }).sort({ weight: -1 })
    res.json({ ok: true, data: { packages } })
  } catch (err) { next(err) }
}

export async function getPackageById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const pkg = await Package.findById(req.params.id)
    if (!pkg) { res.status(404).json({ ok: false, error: 'Package not found' }); return }
    res.json({ ok: true, data: { package: pkg } })
  } catch (err) { next(err) }
}

export async function createPackage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pkg = await Package.create(req.body)
    res.status(201).json({ ok: true, data: { package: pkg } })
  } catch (err) { next(err) }
}

export async function updatePackage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!pkg) { res.status(404).json({ ok: false, error: 'Package not found' }); return }
    res.json({ ok: true, data: { package: pkg } })
  } catch (err) { next(err) }
}

export async function deletePackage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const pkg = await Package.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true })
    if (!pkg) { res.status(404).json({ ok: false, error: 'Package not found' }); return }
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// Categories
export async function getCategories(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const categories = await Category.find({ is_active: true }).sort({ name: 1 })
    res.json({ ok: true, data: { categories } })
  } catch (err) { next(err) }
}

export async function getCategoryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const category = await Category.findById(req.params.id)
    if (!category) { res.status(404).json({ ok: false, error: 'Category not found' }); return }
    res.json({ ok: true, data: { category } })
  } catch (err) { next(err) }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const slug = await uniqueSlug(Category as Parameters<typeof uniqueSlug>[0], toSlug(req.body.name || ''))
    const category = await Category.create({ ...req.body, slug })
    res.status(201).json({ ok: true, data: { category } })
  } catch (err) { next(err) }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const updates = { ...req.body }
    if (req.body.name) updates.slug = await uniqueSlug(Category as Parameters<typeof uniqueSlug>[0], toSlug(req.body.name))
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!category) { res.status(404).json({ ok: false, error: 'Category not found' }); return }
    res.json({ ok: true, data: { category } })
  } catch (err) { next(err) }
}

export async function deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const category = await Category.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true })
    if (!category) { res.status(404).json({ ok: false, error: 'Category not found' }); return }
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// Cities
export async function getCities(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cities = await City.find({ is_active: true }).sort({ name: 1 })
    res.json({ ok: true, data: { cities } })
  } catch (err) { next(err) }
}

export async function getCityById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const city = await City.findById(req.params.id)
    if (!city) { res.status(404).json({ ok: false, error: 'City not found' }); return }
    res.json({ ok: true, data: { city } })
  } catch (err) { next(err) }
}

export async function createCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const slug = await uniqueSlug(City as Parameters<typeof uniqueSlug>[0], toSlug(req.body.name || ''))
    const city = await City.create({ ...req.body, slug })
    res.status(201).json({ ok: true, data: { city } })
  } catch (err) { next(err) }
}

export async function updateCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const updates = { ...req.body }
    if (req.body.name) updates.slug = await uniqueSlug(City as Parameters<typeof uniqueSlug>[0], toSlug(req.body.name))
    const city = await City.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!city) { res.status(404).json({ ok: false, error: 'City not found' }); return }
    res.json({ ok: true, data: { city } })
  } catch (err) { next(err) }
}

export async function deleteCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ ok: false, error: 'Invalid id' }); return }
    const city = await City.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true })
    if (!city) { res.status(404).json({ ok: false, error: 'City not found' }); return }
    res.json({ ok: true })
  } catch (err) { next(err) }
}
