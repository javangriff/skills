const MS_PER_DAY = 86_400_000

export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function clampToBusinessHours(date: Date, openHour = 9, closeHour = 17): Date {
  const result = new Date(date)
  const hour = result.getHours()
  if (hour < openHour) result.setHours(openHour, 0, 0, 0)
  else if (hour >= closeHour) result.setHours(closeHour, 0, 0, 0)
  return result
}

export function formatRange(start: Date, end: Date, locale = 'en-US'): string {
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}
