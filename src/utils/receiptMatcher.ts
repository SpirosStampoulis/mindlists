import type { ListItem } from '@/types'
import type { ParsedReceipt, ReceiptRow } from '@/types/receipt'

export const normalizeTitle = (s: string): string => {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export const matchReceiptItems = (
  parsed: ParsedReceipt,
  existing: ListItem[]
): ReceiptRow[] => {
  const byTitle = new Map<string, ListItem>()
  for (const item of existing) {
    byTitle.set(normalizeTitle(item.title), item)
  }
  return parsed.items.map((p) => ({
    ...p,
    include: true,
    existingItem: byTitle.get(normalizeTitle(p.title)) ?? null
  }))
}

export const getLatestPrice = (item: ListItem | null): number | null => {
  if (!item || !item.priceHistory || item.priceHistory.length === 0) return null
  const sorted = [...item.priceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const price = sorted[0]?.price
  const numeric = typeof price === 'string' ? parseFloat(price) : price
  return isFinite(numeric as number) ? (numeric as number) : null
}
