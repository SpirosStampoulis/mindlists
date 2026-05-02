import type {
  ParsedReceipt,
  ParsedReceiptItem,
  ReceiptItemJson,
  ReceiptJson,
  ReceiptParseResult,
  SupermarketCategory
} from '@/types/receipt'
import { inferGroceryCategory } from '@/utils/groceryCategories'

const SKIP_RE = /\b(BCRS|DEPOSIT|REF\.?\s*DEP|DISCOUNT|OFFER|REFUND|VOUCHER)\b/i

export const detectSupermarket = (store?: string): SupermarketCategory | undefined => {
  const s = (store || '').toLowerCase()
  if (s.includes('lidl')) return 'lidl'
  if (s.includes('pavi')) return 'pavi'
  if (s.includes('spar')) return 'spar'
  if (s.includes('coop')) return 'coop'
  if (s.includes('welbee')) return 'welbees'
  if (s.includes('carrefour')) return 'carrefour'
  if (s.includes('penny')) return 'penny'
  return undefined
}

export const resolveUnitPrice = (it: ReceiptItemJson): number => {
  if (typeof it.unit_price === 'number' && isFinite(it.unit_price)) return it.unit_price
  if (
    typeof it.price_per_kg === 'number' &&
    isFinite(it.price_per_kg) &&
    typeof it.weight_kg === 'number'
  ) {
    return it.price_per_kg
  }
  if (typeof it.qty === 'number' && it.qty > 1) return it.price / it.qty
  return it.price
}

export const isSkippableLine = (it: ReceiptItemJson): boolean => {
  if (typeof it.price !== 'number' || it.price < 0) return true
  if (!it.name || typeof it.name !== 'string') return true
  if (SKIP_RE.test(it.name)) return true
  return false
}

const normalizeTitle = (raw: string): string => {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase())
}

const validateShape = (data: unknown): ReceiptJson => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: expected an object at the root.')
  }
  const root = data as { receipt?: unknown }
  if (!root.receipt || typeof root.receipt !== 'object') {
    throw new Error('Invalid receipt JSON: missing top-level "receipt" object.')
  }
  const r = root.receipt as { date?: unknown; items?: unknown; store?: unknown }
  if (typeof r.date !== 'string' || !r.date) {
    throw new Error('Invalid receipt JSON: "receipt.date" is required (string, e.g. "2026-04-26").')
  }
  if (!Array.isArray(r.items) || r.items.length === 0) {
    throw new Error('Invalid receipt JSON: "receipt.items" must be a non-empty array.')
  }
  return data as ReceiptJson
}

export const parseReceiptJson = (data: unknown): ReceiptParseResult => {
  const json = validateShape(data)
  const raw = JSON.parse(JSON.stringify(data)) as ReceiptJson
  const { date, store, items } = json.receipt

  const parsedItems: ParsedReceiptItem[] = []
  let skippedCount = 0

  for (const raw of items) {
    if (isSkippableLine(raw)) {
      skippedCount += 1
      continue
    }
    const unitPrice = resolveUnitPrice(raw)
    if (!isFinite(unitPrice) || unitPrice <= 0) {
      skippedCount += 1
      continue
    }
    const isWeighed =
      typeof raw.weight_kg === 'number' && typeof raw.price_per_kg === 'number'
    parsedItems.push({
      title: normalizeTitle(raw.name),
      unitPrice: Math.round(unitPrice * 100) / 100,
      quantity: typeof raw.qty === 'number' && raw.qty > 0 ? raw.qty : 1,
      rawPrice: raw.price,
      isWeighed,
      groceryCategory: inferGroceryCategory(raw.name),
      sourceItem: JSON.parse(JSON.stringify(raw)) as ReceiptItemJson
    })
  }

  const parsed: ParsedReceipt = {
    date,
    store,
    supermarketCategory: detectSupermarket(store),
    items: parsedItems,
    skippedCount
  }

  return {
    parsed,
    raw
  }
}

export const parseReceiptFile = async (file: File): Promise<ReceiptParseResult> => {
  if (!file) throw new Error('No file provided.')
  const isJson =
    file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
  if (!isJson) {
    throw new Error('Please upload a .json file exported from a receipt.')
  }
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new Error('Could not read the file. Please try again.')
  }
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (err: any) {
    throw new Error('Invalid JSON: ' + (err?.message || 'could not parse file.'))
  }
  return parseReceiptJson(data)
}
