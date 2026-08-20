import { readFileSync } from 'node:fs'

export function readFile(path: string): string {
  return readFileSync(path, 'utf8')
}

export function mergeDefaults<T extends object>(value: Partial<T>, defaults: T): T {
  return { ...defaults, ...value }
}

export function deepClone<T>(value: T): T {
  return structuredClone(value)
}

export function normalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]))
}

export function parseConfig(raw: string): Record<string, unknown> {
  const parsed = JSON.parse(raw)
  return normalizeKeys(parsed)
}

export function validateConfig(config: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (typeof config.host !== 'string') errors.push('host must be a string')
  if (typeof config.port !== 'number') errors.push('port must be a number')
  return errors
}
