import type { ListItem, FilterType } from '@/types'

export const sortItems = (items: ListItem[], listType?: string): ListItem[] => {
  return [...items].sort((a, b) => {
    if (listType === 'fitness' && a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }

    if (listType === 'games' || listType === 'supermarket') {
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1
      }
      const titleA = a.title.toLowerCase()
      const titleB = b.title.toLowerCase()
      return titleA.localeCompare(titleB)
    }

    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1
    }

    if (a.expiryDate && b.expiryDate) {
      const dateA = new Date(a.expiryDate).getTime()
      const dateB = new Date(b.expiryDate).getTime()
      if (dateA !== dateB) {
        return dateA - dateB
      }
    } else if (a.expiryDate) {
      return -1
    } else if (b.expiryDate) {
      return 1
    }

    const createdA = new Date(a.createdAt).getTime()
    const createdB = new Date(b.createdAt).getTime()
    return createdB - createdA
  })
}

export const filterItems = (items: ListItem[], filter: FilterType, listType?: string): ListItem[] => {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  if (listType === 'games') {
    switch (filter) {
      case 'played':
        return items.filter(item => item.gameStatus === 'played')
      case 'will-play':
        return items.filter(item => item.gameStatus === 'will-play')
      default:
        return items
    }
  }

  switch (filter) {
    case 'active':
      return items.filter(item => !item.checked)
    case 'expiring':
      return items.filter(item => {
        if (item.checked || !item.expiryDate) return false
        const expiryDate = new Date(item.expiryDate)
        return expiryDate <= sevenDaysFromNow && expiryDate >= now
      })
    case 'expired':
      return items.filter(item => {
        if (!item.expiryDate) return false
        const expiryDate = new Date(item.expiryDate)
        return expiryDate < now
      })
    default:
      return items
  }
}

export const SUPERMARKET_FILTER_UNCATEGORIZED = '__uncategorized__' as const

export type SupermarketFilterCategory = 'all' | typeof SUPERMARKET_FILTER_UNCATEGORIZED | string

export const filterSupermarketItems = (
  items: ListItem[],
  category: SupermarketFilterCategory
): ListItem[] => {
  if (category === 'all') {
    return items
  }
  if (category === SUPERMARKET_FILTER_UNCATEGORIZED) {
    return items.filter((item) => !item.supermarketCategory?.trim())
  }
  const want = category.trim().toLowerCase()
  return items.filter(
    (item) => (item.supermarketCategory || '').trim().toLowerCase() === want
  )
}

export const GROCERY_FILTER_UNCATEGORIZED = '__grocery_uncategorized__' as const

export type GroceryFilterCategory = 'all' | typeof GROCERY_FILTER_UNCATEGORIZED | string

export const filterGroceryCategoryItems = (
  items: ListItem[],
  category: GroceryFilterCategory
): ListItem[] => {
  if (category === 'all') {
    return items
  }
  if (category === GROCERY_FILTER_UNCATEGORIZED) {
    return items.filter((item) => !item.groceryCategory?.trim())
  }
  const want = category.trim().toLowerCase()
  return items.filter(
    (item) => (item.groceryCategory || '').trim().toLowerCase() === want
  )
}


