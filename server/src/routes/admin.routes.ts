import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../validators/auth.validator.js'
import { verifyPaymentSchema, publishAdSchema, featureAdSchema } from '../validators/admin.validator.js'
import {
  getPaymentQueue, verifyPayment,
  getPublishQueue, publishAd, featureAd,
  getAdForAdmin, listPackages,
} from '../controllers/admin.controller.js'
import {
  updateUserSchema,
  createPackageSchema, updatePackageSchema,
  createCategorySchema, updateCategorySchema,
  createCitySchema, updateCitySchema,
} from '../validators/console.validator.js'
import {
  listUsers, updateUser,
  listPackagesAdmin, createPackage, updatePackage, togglePackage,
  listCategoriesAdmin, createCategory, updateCategory, toggleCategory,
  listCitiesAdmin, createCity, updateCity, toggleCity,
} from '../controllers/console.controller.js'

const router = Router()

router.use(requireAuth, requireRole('admin', 'super_admin'))

// Payment verification (Milestone 3.2)
router.get('/payment-queue', getPaymentQueue)
router.patch('/payments/:id/verify', validate(verifyPaymentSchema), verifyPayment)

// Publishing & scheduling (Milestone 3.3)
router.get('/publish-queue', getPublishQueue)
router.patch('/ads/:id/publish', validate(publishAdSchema), publishAd)
router.patch('/ads/:id/feature', validate(featureAdSchema), featureAd)

// Shared helpers
router.get('/ads/:id', getAdForAdmin)
router.get('/packages', listPackages)

// Console — User management (Milestone 3.4)
router.get('/console/users', listUsers)
router.patch('/console/users/:id', validate(updateUserSchema), updateUser)

// Console — Package management (super_admin only for writes)
router.get('/console/packages', listPackagesAdmin)
router.post('/console/packages', requireRole('super_admin'), validate(createPackageSchema), createPackage)
router.patch('/console/packages/:id/toggle', requireRole('super_admin'), togglePackage)
router.patch('/console/packages/:id', requireRole('super_admin'), validate(updatePackageSchema), updatePackage)

// Console — Category management
router.get('/console/categories', listCategoriesAdmin)
router.post('/console/categories', validate(createCategorySchema), createCategory)
router.patch('/console/categories/:id/toggle', toggleCategory)
router.patch('/console/categories/:id', validate(updateCategorySchema), updateCategory)

// Console — City management
router.get('/console/cities', listCitiesAdmin)
router.post('/console/cities', validate(createCitySchema), createCity)
router.patch('/console/cities/:id/toggle', toggleCity)
router.patch('/console/cities/:id', validate(updateCitySchema), updateCity)

export default router
