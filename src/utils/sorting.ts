import type { ListItem } from '@/types'

export const sortItems = (items: ListItem[]): ListItem[] => {
  return [...items].sort((a, b) => {
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

export const filterItems = (items: ListItem[], filter: 'all' | 'active' | 'expiring' | 'expired'): ListItem[] => {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

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


