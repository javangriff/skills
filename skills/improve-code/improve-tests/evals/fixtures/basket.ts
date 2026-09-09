export type BasketLine = { sku: string; price: number }

export class Basket {
  readonly lines: BasketLine[] = []

  add(line: BasketLine): void {
    this.lines.push(line)
  }

  total(): number {
    return this.lines.reduce((sum, line) => sum + line.price, 0)
  }
}
