import type { ListItem } from '@/types'

export const searchItems = (items: ListItem[], query: string): ListItem[] => {
  if (!query.trim()) {
    return items
  }

  const lowerQuery = query.toLowerCase().trim()

  return items.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(lowerQuery)
    const descriptionMatch = item.description?.toLowerCase().includes(lowerQuery)
    const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))

    return titleMatch || descriptionMatch || tagsMatch
  })
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}




