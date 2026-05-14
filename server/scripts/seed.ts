import mongoose from 'mongoose'
import { User } from '../src/models/User.js'
import { SellerProfile } from '../src/models/SellerProfile.js'
import { Package } from '../src/models/Package.js'
import { Category } from '../src/models/Category.js'
import { City } from '../src/models/City.js'
import { LearningQuestion } from '../src/models/LearningQuestion.js'

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) {
  console.error('MONGODB_URI not set. Run: bun --env-file ../.env scripts/seed.ts')
  process.exit(1)
}

async function seed() {
  await mongoose.connect(MONGO_URI!)
  console.log('Connected to MongoDB')

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { name: 'Super Admin',  email: 'superadmin@adflow.dev', password: 'Admin@1234', role: 'super_admin' as const },
    { name: 'Moderator',    email: 'moderator@adflow.dev',  password: 'Mod@12345',  role: 'moderator'   as const },
    { name: 'Admin',        email: 'admin@adflow.dev',      password: 'Admin@1234', role: 'admin'        as const },
    { name: 'Test Client',  email: 'client@adflow.dev',     password: 'Client@123', role: 'client'       as const },
  ]

  for (const u of users) {
    const existing = await User.findOne({ email: u.email })
    if (existing) { console.log(`  skip user: ${u.email}`); continue }
    const password_hash = await User.hashPassword(u.password)
    const user = await User.create({ name: u.name, email: u.email, password_hash, role: u.role })
    await SellerProfile.create({ user_id: user._id, display_name: u.name })
    console.log(`  created user: ${u.email} [${u.role}]`)
  }

  // ── Packages ───────────────────────────────────────────────────────────────
  const packages = [
    {
      name: 'basic', label: 'Basic', duration_days: 30, weight: 1,
      is_featured: false, homepage_placement: false, price: 0,
      refresh_rule: 'none' as const, sort_order: 1,
      benefits: ['30-day listing', 'Standard visibility', 'Up to 3 images'],
    },
    {
      name: 'standard', label: 'Standard', duration_days: 60, weight: 3,
      is_featured: false, homepage_placement: false, price: 999,
      refresh_rule: 'manual' as const, refresh_days: 15, sort_order: 2,
      benefits: ['60-day listing', 'Higher ranking', 'Up to 8 images', '1 manual refresh'],
    },
    {
      name: 'premium', label: 'Premium', duration_days: 90, weight: 8,
      is_featured: true, homepage_placement: true, price: 2499,
      refresh_rule: 'auto' as const, refresh_days: 7, sort_order: 3,
      benefits: ['90-day listing', 'Featured badge', 'Homepage placement', 'Auto-refresh every 7 days', 'Up to 15 images', 'Priority review'],
    },
  ]

  for (const p of packages) {
    const existing = await Package.findOne({ name: p.name })
    if (existing) { console.log(`  skip package: ${p.name}`); continue }
    await Package.create(p)
    console.log(`  created package: ${p.label}`)
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Vehicles',          slug: 'vehicles',          icon: 'car',          sort_order: 1 },
    { name: 'Property',          slug: 'property',          icon: 'building',     sort_order: 2 },
    { name: 'Electronics',       slug: 'electronics',       icon: 'cpu',          sort_order: 3 },
    { name: 'Furniture',         slug: 'furniture',         icon: 'sofa',         sort_order: 4 },
    { name: 'Jobs',              slug: 'jobs',              icon: 'briefcase',    sort_order: 5 },
    { name: 'Services',          slug: 'services',          icon: 'wrench',       sort_order: 6 },
    { name: 'Fashion',           slug: 'fashion',           icon: 'shirt',        sort_order: 7 },
    { name: 'Home Appliances',   slug: 'home-appliances',   icon: 'refrigerator', sort_order: 8 },
  ]

  for (const c of categories) {
    const existing = await Category.findOne({ slug: c.slug })
    if (existing) { console.log(`  skip category: ${c.slug}`); continue }
    await Category.create(c)
    console.log(`  created category: ${c.name}`)
  }

  // ── Cities ─────────────────────────────────────────────────────────────────
  const cities = [
    { name: 'Karachi',    slug: 'karachi',    sort_order: 1 },
    { name: 'Lahore',     slug: 'lahore',     sort_order: 2 },
    { name: 'Islamabad',  slug: 'islamabad',  sort_order: 3 },
    { name: 'Rawalpindi', slug: 'rawalpindi', sort_order: 4 },
    { name: 'Peshawar',   slug: 'peshawar',   sort_order: 5 },
    { name: 'Quetta',     slug: 'quetta',     sort_order: 6 },
  ]

  for (const c of cities) {
    const existing = await City.findOne({ slug: c.slug })
    if (existing) { console.log(`  skip city: ${c.slug}`); continue }
    await City.create(c)
    console.log(`  created city: ${c.name}`)
  }

  // ── Learning Questions ─────────────────────────────────────────────────────
  const questions = [
    { question: 'What is the most important factor in a good ad title?',                       answer: 'Clarity and specificity — include the item name, key spec, and condition.',                    topic: 'Listing Tips',   difficulty: 'easy'   as const },
    { question: 'How should you price an item for the fastest sale?',                          answer: 'Research similar listings and price 10–15% below market to attract immediate interest.',        topic: 'Pricing',        difficulty: 'easy'   as const },
    { question: 'Why should you include multiple high-quality photos?',                        answer: 'Ads with 5+ photos get 3× more inquiries — buyers need to inspect visually before contacting.', topic: 'Photography',     difficulty: 'easy'   as const },
    { question: 'What details should every vehicle ad include?',                               answer: 'Year, make, model, mileage, fuel type, transmission, condition, and service history.',          topic: 'Vehicles',        difficulty: 'medium' as const },
    { question: 'How can you protect yourself from scammers when selling online?',             answer: 'Never share bank details upfront, meet in public, verify payment before handing over goods.',   topic: 'Safety',          difficulty: 'medium' as const },
    { question: 'What is the benefit of renewing (refreshing) an old listing?',               answer: 'Fresh listings appear at the top of sorted results, gaining visibility again for free.',         topic: 'Listing Tips',   difficulty: 'easy'   as const },
    { question: 'How does the Premium package boost your ad ranking?',                        answer: 'It assigns a higher package weight and enables auto-refresh, so the rank score stays high.',     topic: 'Packages',        difficulty: 'medium' as const },
    { question: 'What information is required in a property listing to attract serious buyers?', answer: 'Location, size (sq ft/marla), price, type (flat/house), bedrooms, floors, and contact.',     topic: 'Property',        difficulty: 'medium' as const },
    { question: 'Why is a unique transaction reference important when submitting payment?',    answer: 'It prevents duplicate payment submissions and helps admins verify the exact transfer quickly.',  topic: 'Payments',        difficulty: 'hard'   as const },
    { question: 'What happens if your ad is rejected during content moderation?',             answer: 'You receive a reason note and can edit and resubmit the ad without losing your draft.',          topic: 'Moderation',      difficulty: 'hard'   as const },
  ]

  for (const q of questions) {
    const existing = await LearningQuestion.findOne({ question: q.question })
    if (existing) { console.log(`  skip question: ${q.question.slice(0, 40)}...`); continue }
    await LearningQuestion.create(q)
    console.log(`  created question: ${q.question.slice(0, 50)}...`)
  }

  console.log('\nSeed complete.')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
