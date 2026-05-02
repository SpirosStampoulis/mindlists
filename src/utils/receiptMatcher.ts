import type { ListItem } from '@/types'
import type { ParsedReceipt, ReceiptRow } from '@/types/receipt'
import { timestampMs } from '@/utils/mergeListItems'

export const normalizeTitle = (s: string): string => {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/** When several items share a title, receipt updates use the oldest row (by createdAt). */
export const matchReceiptItems = (
  parsed: ParsedReceipt,
  existing: ListItem[]
): ReceiptRow[] => {
  const byTitle = new Map<string, ListItem[]>()
  for (const item of existing) {
    const k = normalizeTitle(item.title)
    if (!byTitle.has(k)) byTitle.set(k, [])
    byTitle.get(k)!.push(item)
  }
  const pickExisting = (key: string): ListItem | null => {
    const group = byTitle.get(key)
    if (!group?.length) return null
    const sorted = [...group].sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt))
    return sorted[0]
  }
  return parsed.items.map((p) => ({
    ...p,
    include: true,
    existingItem: pickExisting(normalizeTitle(p.title))
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
