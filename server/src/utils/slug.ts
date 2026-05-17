import { Ad } from '../models/Ad.js'

export async function generateSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let slug = base
  let counter = 2
  while (await Ad.findOne({ slug }).lean()) {
    slug = `${base}-${counter++}`
  }
  return slug
}
