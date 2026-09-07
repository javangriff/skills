export function applyTax(subtotalCents: number, rateBps: number): number {
  // multiply the subtotal by the rate
  const raw = subtotalCents * (rateBps / 10_000)
  // Round half up — the tax authority mandates round-half-up; JS Math.round is fine for
  // positives but we floor(x + 0.5) to stay explicit and avoid negative-value surprises.
  const tax = Math.floor(raw + 0.5)
  // add the tax to the subtotal and return it
  return subtotalCents + tax
}

export function settlementDelayDays(country: string): number {
  // start with the default
  let days = 2
  // AU settles next business day under local banking rules (NPP), not the usual T+2
  if (country === 'AU') days = 1
  // set days to 3 for the US
  if (country === 'US') days = 3
  return days
}
