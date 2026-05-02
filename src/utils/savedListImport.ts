import type { ListItem, SavedList, SavedListItem } from '@/types'

export type ImportSavedListsResult =
  | { ok: true; lists: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>[]; skippedTitles: string[] }
  | { ok: false; error: string }

const normTitle = (s: string) => s.trim().toLowerCase()

function titleToItemMap(items: ListItem[]): Map<string, ListItem> {
  const m = new Map<string, ListItem>()
  for (const it of items) {
    m.set(normTitle(it.title), it)
  }
  return m
}

function listItemToSavedItem(item: ListItem, order: number, quantity?: number): SavedListItem {
  const { id, createdAt, updatedAt, ...rest } = item
  const cleaned: SavedListItem = { ...rest } as SavedListItem
  if (quantity !== undefined && quantity >= 1) cleaned.quantity = quantity
  cleaned.order = order
  return cleaned
}

function parseDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const d = new Date(value.trim())
  if (Number.isNaN(d.getTime())) return undefined
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

type RawEntry = { title?: unknown; quantity?: unknown }

function parseEntry(raw: unknown): { title: string; quantity?: number } | null {
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t ? { title: t } : null
  }
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as RawEntry
  if (typeof o.title !== 'string') return null
  const title = o.title.trim()
  if (!title) return null
  let quantity: number | undefined
  if (typeof o.quantity === 'number' && Number.isFinite(o.quantity) && o.quantity >= 1) {
    quantity = Math.floor(o.quantity)
  }
  return quantity !== undefined ? { title, quantity } : { title }
}

function parseOneList(
  obj: Record<string, unknown>,
  map: Map<string, ListItem>
): {
  list: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>
  skipped: string[]
} | null {
  const name =
    typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'Imported list'
  const date = parseDate(obj.date)
  const rawItems = Array.isArray(obj.items) ? obj.items : []
  if (rawItems.length === 0) return null

  const skipped: string[] = []
  const savedItems: SavedListItem[] = []

  for (const raw of rawItems) {
    const entry = parseEntry(raw)
    if (!entry) continue
    const match = map.get(normTitle(entry.title))
    if (!match) {
      skipped.push(entry.title)
      continue
    }
    savedItems.push(
      listItemToSavedItem(match, savedItems.length, entry.quantity)
    )
  }

  if (savedItems.length === 0) return null

  return {
    list: { name, date, items: savedItems },
    skipped
  }
}

export function importSavedListsFromJson(
  data: unknown,
  availableItems: ListItem[]
): ImportSavedListsResult {
  const map = titleToItemMap(availableItems)
  const chunks: Record<string, unknown>[] = []

  if (Array.isArray(data)) {
    for (const el of data) {
      if (typeof el === 'object' && el !== null) chunks.push(el as Record<string, unknown>)
    }
  } else if (typeof data === 'object' && data !== null) {
    chunks.push(data as Record<string, unknown>)
  } else {
    return { ok: false, error: 'JSON must be an object or an array of list objects.' }
  }

  if (chunks.length === 0) {
    return { ok: false, error: 'No list objects found in JSON.' }
  }

  const lists: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const skippedTitles: string[] = []

  for (const chunk of chunks) {
    const parsed = parseOneList(chunk, map)
    if (parsed) {
      lists.push(parsed.list)
      skippedTitles.push(...parsed.skipped)
    }
  }

  if (lists.length === 0) {
    return {
      ok: false,
      error:
        'No lists could be imported. Add matching supermarket items first, or fix titles in JSON (matching is case-insensitive).'
    }
  }

  return { ok: true, lists, skippedTitles: [...new Set(skippedTitles)] }
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '')
        resolve(JSON.parse(text))
      } catch {
        reject(new Error('Invalid JSON file.'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsText(file)
  })
}
