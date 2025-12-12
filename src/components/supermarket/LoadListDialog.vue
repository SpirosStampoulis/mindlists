<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancel">
    <div class="relative bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <button
        @click="cancel"
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        ✕
      </button>
      <h3 class="text-xl font-semibold mb-2 pr-8">Load List: {{ savedList?.name }}</h3>
      <p class="text-sm text-gray-600 mb-4">{{ savedList?.items.length }} items in this list</p>
      
      <div class="mb-4 bg-green-50 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-lg font-medium text-gray-700">Total Amount:</span>
          <span class="text-2xl font-bold text-green-600">€{{ totalAmount.toFixed(2) }}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          {{ itemsWithPrice }} item{{ itemsWithPrice === 1 ? '' : 's' }} with prices
          <span v-if="itemsWithPrice === 0">(add prices to see a total)</span>
        </p>
      </div>

      <div v-if="savedList?.items?.length" class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">
          {{ savedList?.items.length }} items in this list
        </h4>
        <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-3">
          <div
            v-for="(item, index) in savedList?.items"
            :key="index"
            class="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div>
              <span class="text-sm font-medium text-gray-800">{{ item.title }}</span>
              <span v-if="item.quantity" class="ml-2 text-xs text-gray-500">Qty: {{ item.quantity }}</span>
            </div>
            <span v-if="getItemLatestPrice(item) !== null" class="text-sm font-semibold text-gray-900">
              €{{ getItemLatestPrice(item)?.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SavedList, ListItem, PriceEntry } from '@/types'

const props = defineProps<{
  show: boolean
  savedList?: SavedList
  currentItems: ListItem[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const currentItemsMap = computed(() => {
  const map = new Map<string, ListItem>()
  props.currentItems.forEach(item => {
    map.set(item.title.toLowerCase(), item)
  })
  return map
})

const toTimestamp = (value: any): number => {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime()
  if (typeof value === 'object') {
    // Firestore Timestamp support
    if (typeof value.toDate === 'function') {
      return value.toDate().getTime()
    }
    if ('seconds' in value && 'nanoseconds' in value) {
      return (value.seconds as number) * 1000 + Math.floor((value.nanoseconds as number) / 1e6)
    }
  }
  return 0
}

const getLatestPriceFromHistory = (priceHistory?: PriceEntry[]): number | null => {
  if (!priceHistory || priceHistory.length === 0) return null
  const sorted = [...priceHistory].sort((a, b) => {
    const aDate = toTimestamp(a.date || a.createdAt)
    const bDate = toTimestamp(b.date || b.createdAt)
    return bDate - aDate
  })
  const price = sorted[0]?.price
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  return isFinite(numericPrice as number) ? (numericPrice as number) : null
}

const getItemLatestPrice = (item: SavedList['items'][0]): number | null => {
  // Prefer price from the matching current item (fresh data)
  const matched = currentItemsMap.value.get(item.title.toLowerCase())
  const fromCurrent = matched ? getLatestPriceFromHistory(matched.priceHistory) : null
  if (fromCurrent !== null) return fromCurrent

  // Fallback to the saved item's own price history
  return getLatestPriceFromHistory(item.priceHistory)
}

const totalAmount = computed(() => {
  if (!props.savedList) return 0
  
  return props.savedList.items.reduce((total, item) => {
    const latestPrice = getItemLatestPrice(item)
    if (latestPrice !== null) {
      const quantity = item.quantity || 1
      return total + (latestPrice * quantity)
    }
    return total
  }, 0)
})

const itemsWithPrice = computed(() => {
  if (!props.savedList) return 0
  return props.savedList.items.filter(item => 
    getItemLatestPrice(item) !== null
  ).length
})

const cancel = () => {
  emit('cancel')
}
</script>

