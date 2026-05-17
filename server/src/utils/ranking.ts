const FEATURED_BONUS = 500
const MAX_FRESHNESS_BONUS = 300
const FRESHNESS_HALF_LIFE_DAYS = 7

export function freshnessDecay(publishAt: Date): number {
  const ageMs = Date.now() - publishAt.getTime()
  const ageDays = ageMs / 86_400_000
  return Math.round(MAX_FRESHNESS_BONUS * Math.pow(0.5, ageDays / FRESHNESS_HALF_LIFE_DAYS))
}

export function computeRankScore(params: {
  packageWeight: number
  isFeatured: boolean
  publishAt: Date
  adminBoost: number
}): number {
  return (params.packageWeight * 100)
    + (params.isFeatured ? FEATURED_BONUS : 0)
    + freshnessDecay(params.publishAt)
    + params.adminBoost
}
