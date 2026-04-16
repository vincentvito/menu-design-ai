/**
 * Tiny, display-only formatting helpers. Deliberately dependency-free.
 */

export function getInitials(input: string): string {
  const trimmed = input?.trim() ?? ''
  if (!trimmed) return '?'
  if (trimmed.includes('@')) return trimmed.charAt(0).toUpperCase()
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function greetingKey(
  date = new Date(),
): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = date.getHours()
  if (h < 12) return 'greetingMorning'
  if (h < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function timeAgo(iso: string, now = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  const days = Math.round(hours / 24)
  return rtf.format(days, 'day')
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

export function formatPrice(n: number): string {
  return priceFormatter.format(n)
}
