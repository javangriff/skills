import { Basket } from './basket'

const basket = new Basket()

test('adds a line', () => {
  basket.add({ sku: 'book', price: 20 })

  expect(basket.lines).toHaveLength(1)
})

test('calculates the total', () => {
  expect(basket.total()).toBe(20)
})
