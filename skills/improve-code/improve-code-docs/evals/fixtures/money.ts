/** Smallest currency unit (cents) — all amounts are integers to avoid float drift. */
export type Money = number

/**
 * Adds two amounts, guarding against float inputs that would corrupt the integer invariant.
 * @param a First amount in cents
 * @param b Second amount in cents
 * @returns The sum in cents
 * @throws If either input is not an integer
 */
export function add(a: Money, b: Money): Money {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new RangeError('Money must be an integer number of cents')
  }
  return a + b
}

/**
 * Splits an amount into `n` parts as evenly as possible, distributing the remainder
 * one cent at a time so the parts always sum back to the original — no cent is lost.
 * @param amount Total in cents
 * @param n Number of parts
 * @returns Array of `n` amounts in cents
 */
export function split(amount: Money, n: number): Money[] {
  const base = Math.floor(amount / n)
  const remainder = amount - base * n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Formats cents as a localized currency string.
 * @param amount Amount in cents
 * @param currency ISO 4217 code, e.g. 'USD'
 * @param locale BCP 47 locale tag
 * @returns Formatted string, e.g. '$12.34'
 */
export function format(amount: Money, currency: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / 100)
}
