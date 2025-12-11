<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancel">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-semibold mb-2">Load List: {{ savedList?.name }}</h3>
      <p class="text-sm text-gray-600 mb-4">{{ savedList?.items.length }} items in this list</p>
      
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Items to be added:</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
          <div
            v-for="(item, index) in itemsToAdd"
            :key="index"
            class="flex items-center justify-between p-2 bg-green-50 rounded"
          >
            <span class="text-sm font-medium">{{ item.title }}</span>
            <span v-if="item.quantity" class="text-sm text-gray-600">Qty: {{ item.quantity }}</span>
          </div>
          <div v-if="itemsToAdd.length === 0" class="text-sm text-gray-500 text-center py-4">
            All items from this list are already in your current list
          </div>
        </div>
      </div>

      <div v-if="existingItems.length > 0" class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Items already in your list (will be skipped):</h4>
        <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-3">
          <div
            v-for="(item, index) in existingItems"
            :key="index"
            class="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <span class="text-sm text-gray-600">{{ item.title }}</span>
            <span v-if="item.quantity" class="text-xs text-gray-500">Qty: {{ item.quantity }}</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <button
          @click="cancel"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          @click="confirm"
          :disabled="itemsToAdd.length === 0"
          class="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Load {{ itemsToAdd.length }} Items
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SavedList, SavedListItem, ListItem } from '@/types'

const props = defineProps<{
  show: boolean
  savedList?: SavedList
  currentItems: ListItem[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const currentItemTitles = computed(() => {
  return new Set(props.currentItems.map(item => item.title.toLowerCase()))
})

const itemsToAdd = computed(() => {
  if (!props.savedList) return []
  return props.savedList.items.filter(item => 
    !currentItemTitles.value.has(item.title.toLowerCase())
  )
})

const existingItems = computed(() => {
  if (!props.savedList) return []
  return props.savedList.items.filter(item => 
    currentItemTitles.value.has(item.title.toLowerCase())
  )
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}
</script>
