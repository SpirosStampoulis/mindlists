import type { ListItem, PriceEntry, SavedListItem } from '@/types'

export function timestampMs(iso?: string): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

function hasUsablePhoto(url?: string): boolean {
  return !!url && !url.startsWith('blob:') && !url.startsWith('data:')
}

/** When both have photos, keep the one from the item with the more recent `updatedAt`. */
export function pickMergedPhotoUrl(keeper: ListItem, other: ListItem): string | undefined {
  const k = hasUsablePhoto(keeper.photoUrl)
  const o = hasUsablePhoto(other.photoUrl)
  if (!k && !o) return keeper.photoUrl || other.photoUrl
  if (k && !o) return keeper.photoUrl
  if (!k && o) return other.photoUrl
  return timestampMs(keeper.updatedAt) >= timestampMs(other.updatedAt) ? keeper.photoUrl : other.photoUrl
}

export function mergePriceHistories(a: PriceEntry[] = [], b: PriceEntry[] = []): PriceEntry[] {
  const seen = new Set<string>()
  const out: PriceEntry[] = []
  for (const e of [...a, ...b]) {
    const key = e.id || `${e.date}|${e.price}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out.sort((x, y) => timestampMs(y.date) - timestampMs(x.date))
}

function mergeTags(a: string[], b: string[]): string[] {
  return [...new Set([...(a || []), ...(b || [])])]
}

function mergeDescriptions(a?: string, b?: string): string | undefined {
  const x = (a || '').trim()
  const y = (b || '').trim()
  if (!x) return y || undefined
  if (!y || x === y) return x
  return `${x}\n${y}`
}

function pickNonEmpty<T extends string | undefined>(primary?: T, secondary?: T): T | undefined {
  const p = primary?.trim()
  if (p) return primary
  const s = secondary?.trim()
  return (s ? secondary : undefined) as T | undefined
}

function mergeNotificationPresets(
  a: ListItem['notificationPresets'],
  b: ListItem['notificationPresets']
): ListItem['notificationPresets'] {
  return [...new Set([...(a || []), ...(b || [])])].sort((x, y) => x - y) as ListItem['notificationPresets']
}

function mergeNotificationIds(a?: string[], b?: string[]): string[] | undefined {
  const u = [...new Set([...(a || []), ...(b || [])])]
  return u.length ? u : undefined
}

function earliestExpiry(a?: string, b?: string): string | undefined {
  if (!a) return b
  if (!b) return a
  return timestampMs(a) <= timestampMs(b) ? a : b
}

function mergeMeals(
  a?: ListItem['meals'],
  b?: ListItem['meals']
): ListItem['meals'] | undefined {
  if (!a && !b) return undefined
  return {
    breakfast: pickNonEmpty(a?.breakfast, b?.breakfast),
    lunch: pickNonEmpty(a?.lunch, b?.lunch),
    dinner: pickNonEmpty(a?.dinner, b?.dinner),
    snacks: pickNonEmpty(a?.snacks, b?.snacks)
  }
}

/**
 * Combine two supermarket catalog rows into one in-memory row (keeper id + createdAt preserved).
 */
export function mergeTwoListItems(keeper: ListItem, other: ListItem): ListItem {
  const photoUrl = pickMergedPhotoUrl(keeper, other)

  return {
    ...keeper,
    title: keeper.title,
    description: mergeDescriptions(keeper.description, other.description),
    tags: mergeTags(keeper.tags, other.tags ?? []),
    checked: keeper.checked || other.checked,
    expiryDate: earliestExpiry(keeper.expiryDate, other.expiryDate),
    notificationTime: pickNonEmpty(keeper.notificationTime, other.notificationTime),
    notificationPresets: mergeNotificationPresets(
      keeper.notificationPresets,
      other.notificationPresets ?? []
    ),
    notificationId: pickNonEmpty(keeper.notificationId, other.notificationId),
    notificationIds: mergeNotificationIds(keeper.notificationIds, other.notificationIds),
    photoUrl,
    priceHistory: mergePriceHistories(keeper.priceHistory, other.priceHistory ?? []),
    youtubeLink: pickNonEmpty(keeper.youtubeLink, other.youtubeLink),
    gameStatus: keeper.gameStatus ?? other.gameStatus,
    platform: keeper.platform ?? other.platform,
    finishedYear: keeper.finishedYear ?? other.finishedYear,
    order:
      keeper.order != null && other.order != null
        ? Math.min(keeper.order, other.order)
        : (keeper.order ?? other.order),
    isDayOff: keeper.isDayOff || other.isDayOff,
    dayOfWeek: keeper.dayOfWeek ?? other.dayOfWeek,
    meals: mergeMeals(keeper.meals, other.meals),
    supermarketCategory: pickNonEmpty(keeper.supermarketCategory, other.supermarketCategory),
    groceryCategory: pickNonEmpty(keeper.groceryCategory, other.groceryCategory),
    batteryType: keeper.batteryType ?? other.batteryType,
    batteryCount: keeper.batteryCount ?? other.batteryCount
  }
}

function maxTimeFromPricesAndUpdated(it: Pick<ListItem, 'priceHistory' | 'updatedAt'>): string {
  let m = timestampMs(it.updatedAt)
  for (const e of it.priceHistory || []) {
    m = Math.max(m, timestampMs(e.date), timestampMs(e.createdAt))
  }
  return new Date(m || 0).toISOString()
}

/** Merge a saved-list catalog snapshot into an existing list item (same title). */
export function mergeSavedCatalogIntoListItem(existing: ListItem, saved: SavedListItem): ListItem {
  const { listItemKind: _k, textLineId: _t, quantity: _q, ...rest } = saved
  const pseudo: ListItem = {
    ...(rest as ListItem),
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: maxTimeFromPricesAndUpdated({
      updatedAt: existing.updatedAt,
      priceHistory: saved.priceHistory || []
    })
  }
  return mergeTwoListItems(existing, pseudo)
}

export function listItemToUpdatePayload(merged: ListItem): Partial<ListItem> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = merged
  const out: Partial<ListItem> = {}
  for (const [key, val] of Object.entries(rest)) {
    if (val !== undefined) {
      ;(out as Record<string, unknown>)[key] = val
    }
  }
  return out
}
