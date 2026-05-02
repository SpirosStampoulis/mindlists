import type { ReceiptItemJson, ReceiptJson, ReceiptRow } from '@/types/receipt'
import { isSkippableLine, resolveUnitPrice } from '@/utils/receiptParser'

const round2 = (n: number) => Math.round(n * 100) / 100

const cloneItem = (it: ReceiptItemJson): ReceiptItemJson =>
  JSON.parse(JSON.stringify(it)) as ReceiptItemJson

const rowToJsonItem = (row: ReceiptRow): ReceiptItemJson => {
  const out = cloneItem(row.sourceItem)
  out.name = row.title

  if (row.isWeighed && typeof out.weight_kg === 'number' && isFinite(out.weight_kg)) {
    out.price_per_kg = round2(row.unitPrice)
    out.price = round2(row.unitPrice * out.weight_kg)
    delete out.qty
    delete out.unit_price
    return out
  }

  if (row.quantity > 1) {
    out.qty = row.quantity
    out.unit_price = round2(row.unitPrice)
    out.price = round2(row.unitPrice * row.quantity)
    delete out.weight_kg
    delete out.price_per_kg
    return out
  }

  out.price = round2(row.unitPrice * row.quantity)
  delete out.qty
  delete out.unit_price
  if (!row.isWeighed) {
    delete out.weight_kg
    delete out.price_per_kg
  }
  return out
}

/**
 * Rebuilds `receipt.items` from the original file order: parser-skipped lines
 * stay unchanged; each importable line uses the preview row (or original if unchecked).
 */
export const buildMergedReceipt = (
  raw: ReceiptJson,
  rows: ReceiptRow[],
  receiptDate: string
): ReceiptJson => {
  const out = JSON.parse(JSON.stringify(raw)) as ReceiptJson
  out.receipt.date = receiptDate

  let rowIdx = 0
  const nextItems: ReceiptItemJson[] = []

  for (const orig of raw.receipt.items) {
    if (isSkippableLine(orig)) {
      nextItems.push(cloneItem(orig))
      continue
    }
    const up = resolveUnitPrice(orig)
    if (!isFinite(up) || up <= 0) {
      nextItems.push(cloneItem(orig))
      continue
    }
    const row = rows[rowIdx++]
    if (!row) {
      nextItems.push(cloneItem(orig))
      continue
    }
    if (!row.include) {
      nextItems.push(cloneItem(row.sourceItem))
    } else {
      nextItems.push(rowToJsonItem(row))
    }
  }

  out.receipt.items = nextItems
  return out
}

export type SaveReceiptOutcome = 'picker' | 'download'

/**
 * Saves JSON to disk via the File System Access API when available (Chrome/Edge),
 * otherwise triggers a browser download.
 */
export const saveReceiptJsonToDisk = async (
  data: ReceiptJson,
  suggestedName: string
): Promise<SaveReceiptOutcome> => {
  const text = JSON.stringify(data, null, 2)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const name = suggestedName.endsWith('.json') ? suggestedName : `${suggestedName}.json`

  const picker = (globalThis as typeof globalThis & {
    showSaveFilePicker?: (options: {
      suggestedName?: string
      types?: { description: string; accept: Record<string, string[]> }[]
    }) => Promise<{ createWritable: () => Promise<FileSystemWritableFileStream> }>
  }).showSaveFilePicker

  if (typeof picker === 'function') {
    const handle = await picker({
      suggestedName: name,
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
    })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return 'picker'
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return 'download'
}
