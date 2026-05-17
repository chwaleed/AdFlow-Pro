import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import {
  getPackages, getPackageById, createPackage, updatePackage, deletePackage,
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  getCities, getCityById, createCity, updateCity, deleteCity,
} from '../controllers/taxonomy.controller.js'

const router = Router()

// Packages
router.get('/packages', getPackages)
router.get('/packages/:id', getPackageById)
router.post('/packages', requireAuth, requireRole('super_admin'), createPackage)
router.patch('/packages/:id', requireAuth, requireRole('super_admin'), updatePackage)
router.delete('/packages/:id', requireAuth, requireRole('super_admin'), deletePackage)

// Categories
router.get('/categories', getCategories)
router.get('/categories/:id', getCategoryById)
router.post('/categories', requireAuth, requireRole('super_admin'), createCategory)
router.patch('/categories/:id', requireAuth, requireRole('super_admin'), updateCategory)
router.delete('/categories/:id', requireAuth, requireRole('super_admin'), deleteCategory)

// Cities
router.get('/cities', getCities)
router.get('/cities/:id', getCityById)
router.post('/cities', requireAuth, requireRole('super_admin'), createCity)
router.patch('/cities/:id', requireAuth, requireRole('super_admin'), updateCity)
router.delete('/cities/:id', requireAuth, requireRole('super_admin'), deleteCity)

export default router
