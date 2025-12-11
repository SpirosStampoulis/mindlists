import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useFirestore } from '@/composables/useFirestore'
import { useAuthStore } from './auth'
import { useRealtimeSubscription } from '@/composables/useRealtimeSubscription'
import type { ListItem, ListType } from '@/types'
import { LIST_TYPE_CONFIGS } from '@/types'

export const useListsStore = defineStore('lists', () => {
  const itemsByList = ref<Record<ListType, ListItem[]>>({} as Record<ListType, ListItem[]>)
  const loading = ref<Record<ListType, boolean>>({} as Record<ListType, boolean>)
  const { subscribeToItems } = useFirestore()
  const { addSubscription, clearSubscriptions } = useRealtimeSubscription()

  const getItems = (listType: ListType): ListItem[] => {
    return itemsByList.value[listType] || []
  }

  const getItemCount = (listType: ListType): number => {
    return getItems(listType).length
  }

  const getExpiringCount = (listType: ListType): number => {
    const items = getItems(listType)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return items.filter(item => {
      if (item.checked || !item.expiryDate) return false
      const expiryDate = new Date(item.expiryDate)
      return expiryDate <= sevenDaysFromNow
    }).length
  }

  const subscribeToList = (listType: ListType) => {
    const authStore = useAuthStore()
    const userId = authStore.userId

    if (!userId) return

    loading.value[listType] = true

    const unsubscribe = subscribeToItems(userId, listType, (items) => {
      itemsByList.value[listType] = items
      loading.value[listType] = false
    })

    addSubscription(unsubscribe)
  }

  const subscribeToAllLists = () => {
    const listTypes = Object.keys(LIST_TYPE_CONFIGS) as ListType[]
    listTypes.forEach(listType => {
      subscribeToList(listType)
    })
  }

  const unsubscribeAll = () => {
    clearSubscriptions()
    itemsByList.value = {} as Record<ListType, ListItem[]>
  }

  return {
    itemsByList,
    loading,
    getItems,
    getItemCount,
    getExpiringCount,
    subscribeToList,
    subscribeToAllLists,
    unsubscribeAll
  }
})


