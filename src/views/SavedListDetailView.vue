<template>
  <AppLayout>
    <div>
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/list/supermarket/saved')"
              class="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 class="text-2xl font-bold" style="color: #4caf50">
              🛒 {{ savedList?.name || 'Loading...' }}
            </h1>
          </div>
          <button
            @click="showImportReceipt = true"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            📥 Import Receipt
          </button>
        </div>
      </div>

      <LoadingSpinner v-if="loading" />

      <div v-else-if="savedList" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-1">List Information</p>
            <p v-if="savedList.date" class="text-sm text-gray-800">
              Date: <strong>{{ formatDate(savedList.date) }}</strong>
            </p>
            <p class="text-sm text-gray-800">
              Items: <strong>{{ savedList.items.length }}</strong>
            </p>
          </div>

          <div class="bg-green-50 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-lg font-medium text-gray-700">Total Amount:</span>
              <span class="text-2xl font-bold text-green-600">€{{ totalAmount.toFixed(2) }}</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ itemsWithPrice }} item{{ itemsWithPrice === 1 ? '' : 's' }} with prices
              <span v-if="itemsWithPrice === 0">(add prices to see a total)</span>
            </p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Items</h2>
          <div class="space-y-3">
            <div
              v-for="(item, index) in sortedItems"
              :key="index"
              class="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-3"
            >
              <div
                class="flex flex-col gap-1 flex-shrink-0"
                @click.stop
              >
                <button
                  @click="handleMoveUp(index)"
                  :disabled="index === 0"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  @click="handleMoveDown(index)"
                  :disabled="index === sortedItems.length - 1"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div class="flex-1">
                <img
                  v-if="item.photoUrl && !item.photoUrl.startsWith('blob:')"
                  :src="item.photoUrl"
                  :alt="item.title"
                  class="w-full h-48 object-cover rounded-lg mb-3"
                >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-3 mb-2">
                    <h3 class="text-lg font-medium text-gray-800">{{ item.title }}</h3>
                    <span v-if="item.quantity" class="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Qty: {{ item.quantity }}
                    </span>
                  </div>
                  <p v-if="item.description" class="text-sm text-gray-600 mt-1">{{ item.description }}</p>
                  <div v-if="getItemPrice(item) !== null" class="mt-2">
                    <p class="text-sm text-gray-600">
                      Price: <span class="font-semibold text-gray-900">€{{ getItemPrice(item)?.toFixed(2) }}</span>
                      <span v-if="item.quantity" class="ml-2">
                        (Total: €{{ ((getItemPrice(item) || 0) * (item.quantity || 1)).toFixed(2) }})
                      </span>
                    </p>
                    <p v-if="getItemPriceDate(item)" class="text-xs text-gray-500 mt-1">
                      Price from: {{ formatDate(getItemPriceDate(item)!) }}
                    </p>
                  </div>
                  <p v-else class="text-sm text-gray-400 mt-2">No price available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        Saved list not found
      </div>

      <ReceiptImportDialog
        v-if="showImportReceipt"
        :existing-items="supermarketItems"
        @done="showImportReceipt = false"
        @cancel="showImportReceipt = false"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { SavedList } from '@/types'
import { ListType } from '@/types'
import { useSavedLists } from '@/composables/useSavedLists'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ReceiptImportDialog from '@/components/supermarket/ReceiptImportDialog.vue'
import { formatDate as formatDateUtil } from '@/utils/date'

const route = useRoute()
const authStore = useAuthStore()
const listsStore = useListsStore()
const { getSavedList, updateSavedList } = useSavedLists()

const savedList = ref<SavedList | null>(null)
const loading = ref(true)
const showImportReceipt = ref(false)
const supermarketItems = computed(() => listsStore.getItems(ListType.SUPERMARKET))

const sortedItems = computed(() => {
  if (!savedList.value) return []
  const items = [...savedList.value.items]
  
  const itemsWithOrder = items.filter(item => item.order !== undefined && item.order !== null)
  const itemsWithoutOrder = items.filter(item => item.order === undefined || item.order === null)
  
  if (itemsWithOrder.length === 0 && itemsWithoutOrder.length > 0) {
    return itemsWithoutOrder.map((item, index) => ({ ...item, order: index }))
  }
  
  return items.sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })
})

onMounted(async () => {
  await loadSavedList()
  listsStore.subscribeToList(ListType.SUPERMARKET)
})

onUnmounted(() => {
  listsStore.unsubscribeAll()
})

const loadSavedList = async () => {
  if (!authStore.userId || !route.params.id) return

  try {
    loading.value = true
    const list = await getSavedList(authStore.userId, route.params.id as string)
    savedList.value = list
  } catch (err) {
    console.error('Failed to load saved list:', err)
  } finally {
    loading.value = false
  }
}

const toTimestamp = (value: any): number => {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime()
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return value.toDate().getTime()
    }
    if ('seconds' in value && 'nanoseconds' in value) {
      return (value.seconds as number) * 1000 + Math.floor((value.nanoseconds as number) / 1e6)
    }
  }
  return 0
}

const getItemPrice = (item: SavedList['items'][0]): number | null => {
  if (!savedList.value || !item.priceHistory || item.priceHistory.length === 0) {
    return null
  }

  const listDate = savedList.value.date ? new Date(savedList.value.date).getTime() : Date.now()
  
  const validPrices = item.priceHistory.filter(entry => {
    const entryDate = toTimestamp(entry.date || entry.createdAt)
    return entryDate <= listDate
  })

  if (validPrices.length === 0) return null

  const sorted = [...validPrices].sort((a, b) => {
    const aDate = toTimestamp(a.date || a.createdAt)
    const bDate = toTimestamp(b.date || b.createdAt)
    return bDate - aDate
  })

  const price = sorted[0]?.price
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  return isFinite(numericPrice as number) ? (numericPrice as number) : null
}

const getItemPriceDate = (item: SavedList['items'][0]): string | null => {
  if (!savedList.value || !item.priceHistory || item.priceHistory.length === 0) {
    return null
  }

  const listDate = savedList.value.date ? new Date(savedList.value.date).getTime() : Date.now()
  
  const validPrices = item.priceHistory.filter(entry => {
    const entryDate = toTimestamp(entry.date || entry.createdAt)
    return entryDate <= listDate
  })

  if (validPrices.length === 0) return null

  const sorted = [...validPrices].sort((a, b) => {
    const aDate = toTimestamp(a.date || a.createdAt)
    const bDate = toTimestamp(b.date || b.createdAt)
    return bDate - aDate
  })

  return sorted[0]?.date || sorted[0]?.createdAt || null
}

const totalAmount = computed(() => {
  if (!savedList.value) return 0
  
  return savedList.value.items.reduce((total, item) => {
    const price = getItemPrice(item)
    if (price !== null) {
      const quantity = item.quantity || 1
      return total + (price * quantity)
    }
    return total
  }, 0)
})

const itemsWithPrice = computed(() => {
  if (!savedList.value) return 0
  return savedList.value.items.filter(item => 
    getItemPrice(item) !== null
  ).length
})

const formatDate = (dateString: string): string => {
  return formatDateUtil(dateString)
}

const handleMoveUp = async (index: number) => {
  if (!savedList.value || !authStore.userId || index === 0) return
  
  try {
    const items = [...sortedItems.value]
    
    const updatedItems = items.map((it, idx) => {
      if (idx === index) {
        return { ...it, order: index - 1 }
      } else if (idx === index - 1) {
        return { ...it, order: index }
      }
      return { ...it, order: it.order ?? idx }
    })
    
    await updateSavedList(authStore.userId, savedList.value.id, { items: updatedItems })
    await loadSavedList()
  } catch (err) {
    console.error('Failed to move item up:', err)
  }
}

const handleMoveDown = async (index: number) => {
  if (!savedList.value || !authStore.userId || index === sortedItems.value.length - 1) return
  
  try {
    const items = [...sortedItems.value]
    
    const updatedItems = items.map((it, idx) => {
      if (idx === index) {
        return { ...it, order: index + 1 }
      } else if (idx === index + 1) {
        return { ...it, order: index }
      }
      return { ...it, order: it.order ?? idx }
    })
    
    await updateSavedList(authStore.userId, savedList.value.id, { items: updatedItems })
    await loadSavedList()
  } catch (err) {
    console.error('Failed to move item down:', err)
  }
}
</script>

