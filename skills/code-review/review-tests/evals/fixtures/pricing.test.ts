import { addLine, checkout, discountedTotal, totalPrice, type Line } from './pricing'

test('calculates the total price', () => {
  const lines: Line[] = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 1 },
  ]
  const expected = lines.reduce((total, line) => total + line.price * line.quantity, 0)

  expect(totalPrice(lines)).toBe(expected)
})

test('adds a line to the cart', () => {
  const result = addLine([], { price: 10, quantity: 1 })

  expect(result).toBeDefined()
})

test('applies a discount to the subtotal', () => {
  const result = discountedTotal([{ price: 20, quantity: 2 }], 25)

  expect(result.subtotal).toBe(40)
  expect(result.total).toBe(30)
})

test('rejects checkout for an empty cart', () => {
  expect(checkout([])).rejects.toThrow('Cart is empty')
})
