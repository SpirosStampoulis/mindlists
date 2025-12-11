<template>
  <div
    class="bg-white rounded-lg shadow p-4 border-l-4 transition-all"
    :class="[
      item.checked ? 'opacity-60' : '',
      expiryStatus.color === 'red' ? 'border-red-500' : '',
      expiryStatus.color === 'orange' ? 'border-orange-500' : '',
      expiryStatus.color === 'yellow' ? 'border-yellow-500' : '',
      expiryStatus.color === 'green' ? 'border-green-500' : ''
    ]"
  >
    <div class="flex items-start space-x-3">
      <input
        type="checkbox"
        :checked="item.checked"
        @change="handleToggle"
        class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4
            class="text-lg font-medium text-gray-900"
            :class="{ 'line-through': item.checked }"
          >
            {{ item.title }}
          </h4>
          <img
            v-if="item.photoUrl && !item.photoUrl.startsWith('blob:')"
            :src="item.photoUrl"
            alt="Item photo"
            class="w-12 h-12 object-cover rounded"
          />
        </div>
        <p v-if="item.description" class="text-sm text-gray-600 mt-1">
          {{ item.description }}
        </p>
        <div v-if="item.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
          <span
            v-for="tag in item.tags"
            :key="tag"
            class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
          >
            {{ tag }}
          </span>
        </div>
        <div v-if="item.expiryDate" class="mt-2 text-sm" :class="getExpiryColorClass()">
          {{ formatExpiryDate(item.expiryDate) }}
        </div>
        <div v-if="item.priceHistory && item.priceHistory.length > 0" class="mt-2">
          <span class="text-sm font-semibold text-gray-900">
            €{{ item.priceHistory[0].price.toFixed(2) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ListItem, ListType } from '@/types'
import { formatExpiryDate, getExpiryStatus } from '@/utils/date'
import { useItemsStore } from '@/stores/items'

const props = defineProps<{
  item: ListItem
  listType: ListType
}>()

const itemsStore = useItemsStore()

const expiryStatus = computed(() => getExpiryStatus(props.item.expiryDate))

const handleToggle = async () => {
  await itemsStore.toggleChecked(props.listType, props.item.id, !props.item.checked)
}

const getExpiryColorClass = () => {
  const status = expiryStatus.value
  if (status.color === 'red') return 'text-red-600'
  if (status.color === 'orange') return 'text-orange-600'
  if (status.color === 'yellow') return 'text-yellow-600'
  return 'text-green-600'
}
</script>

