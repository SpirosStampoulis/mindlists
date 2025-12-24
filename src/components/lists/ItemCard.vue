<template>
  <div
    class="bg-white rounded-lg shadow p-4 border-l-4 transition-all"
    :class="[
      listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && item.checked ? 'opacity-60' : '',
      listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && expiryStatus.color === 'red' ? 'border-red-500' : '',
      listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && expiryStatus.color === 'orange' ? 'border-orange-500' : '',
      listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && expiryStatus.color === 'yellow' ? 'border-yellow-500' : '',
      listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && expiryStatus.color === 'green' ? 'border-green-500' : '',
      listType === 'fitness' ? 'border-orange-500' : '',
      listType === 'diet' ? 'border-green-500' : '',
      listType === 'batteries' ? 'border-yellow-500' : ''
    ]"
  >
    <div class="flex items-start space-x-3">
      <div
        v-if="draggable"
        class="flex flex-col gap-1 flex-shrink-0"
        @click.stop
      >
        <button
          @click="handleMoveUp"
          :disabled="isFirst"
          class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          @click="handleMoveDown"
          :disabled="isLast"
          class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div class="flex-1 min-w-0" @click="$emit('click')">
        <div class="flex items-center justify-between">
          <h4
            class="text-lg font-medium text-gray-900"
            :class="{ 'line-through': item.checked && listType !== 'games' }"
          >
            {{ item.title }}
          </h4>
          <img
            v-if="listType !== 'passcodes' && item.photoUrl && !item.photoUrl.startsWith('blob:')"
            :src="item.photoUrl"
            alt="Item photo"
            class="w-12 h-12 object-cover rounded"
          />
        </div>
        <p v-if="listType !== 'travel' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && item.description" class="text-sm text-gray-600 mt-1">
          {{ item.description }}
        </p>
        <div v-if="listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'diet' && listType !== 'batteries' && item.expiryDate" class="mt-2 text-sm" :class="getExpiryColorClass()">
          {{ formatExpiryDate(item.expiryDate) }}
        </div>
        <div v-if="listType !== 'travel' && listType !== 'passcodes' && item.priceHistory && item.priceHistory.length > 0" class="mt-2">
          <span class="text-sm font-semibold text-gray-900">
            €{{ item.priceHistory[0].price.toFixed(2) }}
          </span>
        </div>
        <div v-if="listType === 'supermarket' && item.supermarketCategory" class="mt-2">
          <span class="px-2 py-1 text-xs rounded font-medium bg-green-100 text-green-800 capitalize">
            {{ item.supermarketCategory }}
          </span>
        </div>
        <div v-if="(listType === 'games' || listType === 'fitness') && item.youtubeLink" class="mt-2">
          <a
            :href="item.youtubeLink"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center text-sm text-red-600 hover:text-red-800 font-medium"
          >
            <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Play on YouTube
          </a>
        </div>
        <div v-if="listType === 'fitness'" class="mt-2">
          <span
            :class="[
              'px-2 py-1 text-xs rounded font-medium',
              item.isDayOff
                ? 'bg-gray-100 text-gray-800'
                : 'bg-orange-100 text-orange-800'
            ]"
          >
            {{ item.isDayOff ? 'Day Off' : 'Exercise Day' }}
          </span>
        </div>
        <div v-if="listType === 'diet' && item.dayOfWeek" class="mt-2">
          <span class="px-2 py-1 text-xs rounded font-medium bg-green-100 text-green-800 capitalize">
            {{ item.dayOfWeek }}
          </span>
        </div>
        <div v-if="listType === 'diet' && item.meals" class="mt-3 space-y-2">
          <div v-if="item.meals.lunch" class="text-sm">
            <span class="font-medium text-gray-700">Lunch:</span>
            <span class="text-gray-600 ml-2">{{ item.meals.lunch }}</span>
          </div>
          <div v-if="item.meals.dinner" class="text-sm">
            <span class="font-medium text-gray-700">Dinner:</span>
            <span class="text-gray-600 ml-2">{{ item.meals.dinner }}</span>
          </div>
          <div v-if="item.meals.snacks" class="text-sm">
            <span class="font-medium text-gray-700">Snacks:</span>
            <span class="text-gray-600 ml-2">{{ item.meals.snacks }}</span>
          </div>
        </div>
        <div v-if="listType === 'batteries'" class="mt-2 flex flex-wrap gap-2">
          <span
            v-if="item.batteryType"
            class="px-2 py-1 text-xs rounded font-medium bg-yellow-100 text-yellow-800 uppercase"
          >
            {{ item.batteryType }}
          </span>
          <span
            v-if="item.batteryCount"
            class="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-800"
          >
            {{ item.batteryCount }} {{ item.batteryCount === 1 ? 'battery' : 'batteries' }}
          </span>
        </div>
        <div v-if="listType === 'games'" class="mt-2 flex flex-wrap gap-2">
          <span
            v-if="item.gameStatus"
            :class="[
              'px-2 py-1 text-xs rounded font-medium',
              item.gameStatus === 'played'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            ]"
          >
            {{ item.gameStatus === 'played' ? 'Played' : 'Will Play' }}
          </span>
          <span
            v-if="item.platform"
            class="px-2 py-1 text-xs rounded font-medium bg-purple-100 text-purple-800"
          >
            {{ item.platform === 'switch' ? 'Switch' : 'PC' }}
          </span>
          <span
            v-if="item.finishedYear"
            class="px-2 py-1 text-xs rounded font-medium bg-indigo-100 text-indigo-800"
          >
            Finished {{ item.finishedYear }}
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

const props = defineProps<{
  item: ListItem
  listType: ListType
  draggable?: boolean
  dragIndex?: number
  isFirst?: boolean
  isLast?: boolean
}>()

const emit = defineEmits<{
  moveUp: [index: number]
  moveDown: [index: number]
  click: []
}>()

const expiryStatus = computed(() => getExpiryStatus(props.item.expiryDate))

const getExpiryColorClass = () => {
  const status = expiryStatus.value
  if (status.color === 'red') return 'text-red-600'
  if (status.color === 'orange') return 'text-orange-600'
  if (status.color === 'yellow') return 'text-yellow-600'
  return 'text-green-600'
}

const handleMoveUp = () => {
  if (props.dragIndex !== undefined) {
    emit('moveUp', props.dragIndex)
  }
}

const handleMoveDown = () => {
  if (props.dragIndex !== undefined) {
    emit('moveDown', props.dragIndex)
  }
}

</script>

