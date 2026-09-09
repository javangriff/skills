export type Line = { price: number; quantity: number }

export function totalPrice(lines: Line[]): number {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0)
}

export function addLine(lines: Line[], line: Line): Line[] {
  return [...lines, line]
}

export function discountedTotal(lines: Line[], percent: number): {
  subtotal: number
  total: number
} {
  const subtotal = totalPrice(lines)
  return { subtotal, total: subtotal * (1 - percent / 100) }
}

export async function checkout(lines: Line[]): Promise<string> {
  if (lines.length === 0) throw new Error('Cart is empty')
  return 'confirmed'
}
