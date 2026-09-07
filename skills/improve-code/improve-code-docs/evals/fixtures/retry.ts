export async function withRetry<T>(fn: () => Promise<T>, attempts: number, delayMs: number): Promise<T> {
  if (attempts < 1) throw new RangeError('attempts must be >= 1')
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, delayMs * 2 ** i))
    }
  }
  throw lastError
}
