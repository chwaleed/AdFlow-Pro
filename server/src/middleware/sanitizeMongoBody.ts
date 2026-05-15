import type { NextFunction, Request, Response } from 'express'

function stripMongoOperators(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripMongoOperators)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const input = value as Record<string, unknown>
  const output: Record<string, unknown> = {}

  for (const [key, nestedValue] of Object.entries(input)) {
    if (key.startsWith('$') || key.includes('.')) continue
    output[key] = stripMongoOperators(nestedValue)
  }

  return output
}

export function sanitizeMongoBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripMongoOperators(req.body)
  }
  next()
}
