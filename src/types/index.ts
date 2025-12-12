export enum ListType {
  SUPERMARKET = 'supermarket',
  SUBSCRIPTIONS = 'subscriptions',
  PASSCODES = 'passcodes',
  TRAVEL = 'travel',
  MEETINGS = 'meetings',
  REMINDERS = 'reminders',
  GAMES = 'games'
}

export interface ListTypeConfig {
  type: ListType
  name: string
  color: string
  icon: string
}

export const LIST_TYPE_CONFIGS: Record<ListType, ListTypeConfig> = {
  [ListType.SUPERMARKET]: {
    type: ListType.SUPERMARKET,
    name: 'Supermarket',
    color: '#4caf50',
    icon: '🛒'
  },
  [ListType.SUBSCRIPTIONS]: {
    type: ListType.SUBSCRIPTIONS,
    name: 'Subscriptions',
    color: '#2196f3',
    icon: '💳'
  },
  [ListType.PASSCODES]: {
    type: ListType.PASSCODES,
    name: 'Passcodes',
    color: '#9c27b0',
    icon: '🔒'
  },
  [ListType.TRAVEL]: {
    type: ListType.TRAVEL,
    name: 'Travel',
    color: '#ff9800',
    icon: '🧳'
  },
  [ListType.MEETINGS]: {
    type: ListType.MEETINGS,
    name: 'Meetings',
    color: '#00bcd4',
    icon: '📅'
  },
  [ListType.REMINDERS]: {
    type: ListType.REMINDERS,
    name: 'Reminders',
    color: '#f44336',
    icon: '🔔'
  },
  [ListType.GAMES]: {
    type: ListType.GAMES,
    name: 'Games',
    color: '#e91e63',
    icon: '🎮'
  }
}

export type NotificationPreset = 1 | 3 | 6 | 24 | 72

export interface PriceEntry {
  id: string
  price: number
  date: string
  createdAt: string
}

export interface ListItem {
  id: string
  title: string
  description?: string
  tags: string[]
  checked: boolean
  expiryDate?: string
  notificationTime?: string
  notificationPresets: NotificationPreset[]
  notificationId?: string
  notificationIds?: string[]
  photoUrl?: string
  priceHistory: PriceEntry[]
  youtubeLink?: string
  gameStatus?: 'played' | 'will-play'
  createdAt: string
  updatedAt: string
}

export interface SavedListItem extends Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'> {
  quantity?: number
}

export interface SavedList {
  id: string
  name: string
  items: SavedListItem[]
  createdAt: string
  updatedAt: string
}

export type FilterType = 'all' | 'active' | 'expiring' | 'expired' | 'played' | 'will-play'

export interface ExpiryStatus {
  status: 'expired' | 'expiring-soon' | 'expiring' | 'ok'
  daysUntil: number
  color: string
}


