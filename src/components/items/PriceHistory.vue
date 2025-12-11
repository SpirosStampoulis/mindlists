<template>
  <div>
    <h3 class="text-lg font-semibold mb-4">Price History</h3>
    
    <div v-if="priceHistory.length > 0" class="mb-4">
      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Latest Price</p>
            <p class="text-2xl font-bold text-gray-900">€{{ latestPrice.toFixed(2) }}</p>
          </div>
          <div v-if="priceTrend" class="text-right">
            <p class="text-sm text-gray-600">Trend</p>
            <p :class="priceTrend.color === 'green' ? 'text-green-600' : 'text-red-600'" class="text-xl font-bold">
              {{ priceTrend.symbol }} {{ priceTrend.percentage }}%
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="(entry, index) in sortedHistory"
          :key="entry.id"
          class="flex items-center justify-between p-3 bg-white border rounded-lg"
        >
          <div>
            <p class="font-medium">€{{ entry.price.toFixed(2) }}</p>
            <p class="text-sm text-gray-600">{{ formatDate(entry.date) }}</p>
            <p v-if="index < sortedHistory.length - 1" class="text-xs text-gray-500">
              Change: €{{ getPriceChange(index).toFixed(2) }}
            </p>
          </div>
          <button
            @click="$emit('remove', entry.id)"
            class="text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      No price history yet
    </div>

    <div class="mt-4 p-4 bg-blue-50 rounded-lg">
      <h4 class="font-medium mb-2">Add Price Entry</h4>
      <div class="flex space-x-2">
        <input
          v-model.number="newPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="newPriceDate"
          type="date"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          @click="addPrice"
          :disabled="!newPrice || !newPriceDate"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PriceEntry } from '@/types'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  priceHistory: PriceEntry[]
}>()

const emit = defineEmits<{
  add: [price: number, date: string]
  remove: [entryId: string]
}>()

const newPrice = ref<number | null>(null)
const newPriceDate = ref('')

const sortedHistory = computed(() => {
  return [...props.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const latestPrice = computed(() => {
  if (sortedHistory.value.length === 0) return 0
  return sortedHistory.value[0].price
})

const priceTrend = computed(() => {
  if (sortedHistory.value.length < 2) return null

  const oldest = sortedHistory.value[sortedHistory.value.length - 1].price
  const newest = sortedHistory.value[0].price
  const change = newest - oldest
  const percentage = ((change / oldest) * 100).toFixed(1)

  return {
    symbol: change >= 0 ? '↑' : '↓',
    percentage: Math.abs(parseFloat(percentage)),
    color: change >= 0 ? 'red' : 'green'
  }
})

const getPriceChange = (index: number): number => {
  if (index >= sortedHistory.value.length - 1) return 0
  const current = sortedHistory.value[index].price
  const next = sortedHistory.value[index + 1].price
  return current - next
}

const addPrice = () => {
  if (newPrice.value !== null && newPriceDate.value) {
    emit('add', newPrice.value, newPriceDate.value)
    newPrice.value = null
    newPriceDate.value = ''
  }
}
</script>

