const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
]

export function parseYouTubeUrl(url: string): string | null {
  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern)
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  }
  return null
}

export function validateExternalImageUrl(url: string): boolean {
  if (!url.startsWith('https://')) return false
  if (url.length > 2000) return false
  if (/youtu(be\.com|\.be)/.test(url)) return false
  const lower = url.toLowerCase()
  return /\.(jpg|jpeg|png|webp|gif)(\?|#|$)/.test(lower)
}

export function normalizeMediaInput(input: { url: string }): {
  source_type: 'youtube' | 'external'
  original_url: string
  thumbnail_url?: string
  validation_status: 'valid' | 'failed'
} {
  const ytThumb = parseYouTubeUrl(input.url)
  if (ytThumb) {
    return { source_type: 'youtube', original_url: input.url, thumbnail_url: ytThumb, validation_status: 'valid' }
  }
  if (validateExternalImageUrl(input.url)) {
    return { source_type: 'external', original_url: input.url, validation_status: 'valid' }
  }
  return { source_type: 'external', original_url: input.url, validation_status: 'failed' }
}
