import type { ListItem } from './index'

export interface ReceiptItemJson {
  name: string
  price: number
  qty?: number
  unit_price?: number
  weight_kg?: number
  price_per_kg?: number
}

export interface ReceiptJson {
  receipt: {
    store?: string
    date: string
    items: ReceiptItemJson[]
  }
}

/** Stored as a lowercase slug (preset or any custom text). */
export type SupermarketCategory = string

export interface ParsedReceiptItem {
  title: string
  unitPrice: number
  quantity: number
  rawPrice: number
  isWeighed: boolean
  /** Inferred aisle (meat, produce, …); editable before import. */
  groceryCategory: string
  /** Original line from the uploaded JSON (used to rebuild file on export). */
  sourceItem: ReceiptItemJson
}

export interface ParsedReceipt {
  date: string
  store?: string
  supermarketCategory?: SupermarketCategory
  items: ParsedReceiptItem[]
  skippedCount: number
}

/** Result of parsing an uploaded receipt file (includes full JSON for local export). */
export interface ReceiptParseResult {
  parsed: ParsedReceipt
  raw: ReceiptJson
}

export interface ReceiptRow extends ParsedReceiptItem {
  include: boolean
  existingItem: ListItem | null
}
