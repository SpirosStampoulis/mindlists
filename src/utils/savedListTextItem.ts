import type { SavedListItem } from '@/types'

export function createTextLineSavedItem(
  title: string,
  order: number,
  textLineId: string,
  quantity = 1
): SavedListItem {
  const q = quantity >= 1 ? Math.floor(quantity) : 1
  return {
    title: title.trim(),
    tags: [],
    checked: false,
    notificationPresets: [],
    priceHistory: [],
    listItemKind: 'text',
    textLineId,
    order,
    quantity: q > 1 ? q : undefined
  }
}
