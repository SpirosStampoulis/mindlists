<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">{{ isEditing ? 'Edit Saved List' : 'Create Saved List' }}</h3>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          List Name *
        </label>
        <input
          v-model="formData.name"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Items
        </label>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="item in availableItems"
            :key="item.id"
            class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              :checked="selectedItems.includes(item.id)"
              @change="toggleItem(item.id)"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span class="flex-1">{{ item.title }}</span>
            <input
              v-if="selectedItems.includes(item.id)"
              v-model.number="itemQuantities[item.id]"
              type="number"
              min="1"
              placeholder="Qty"
              @click.stop
              class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="loading || !formData.name"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : 'Save' }}
        </button>
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SavedList, ListItem, SavedListItem } from '@/types'

const props = defineProps<{
  savedList?: SavedList
  availableItems: ListItem[]
}>()

const emit = defineEmits<{
  save: [savedList: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>]
  cancel: []
}>()

const loading = ref(false)
const selectedItems = ref<string[]>([])
const itemQuantities = ref<Record<string, number>>({})
const formData = ref({
  name: props.savedList?.name || '',
  items: [] as SavedListItem[]
})

const isEditing = computed(() => !!props.savedList)

onMounted(() => {
  if (props.savedList) {
    selectedItems.value = props.savedList.items
      .map(savedItem => {
        const matchingItem = props.availableItems.find(
          item => item.title === savedItem.title
        )
        if (matchingItem?.id) {
          if (savedItem.quantity) {
            itemQuantities.value[matchingItem.id] = savedItem.quantity
          }
        }
        return matchingItem?.id
      })
      .filter((id): id is string => !!id)
  }
})

const toggleItem = (itemId: string) => {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
    delete itemQuantities.value[itemId]
  } else {
    selectedItems.value.push(itemId)
    itemQuantities.value[itemId] = 1
  }
}

const handleSubmit = () => {
  const selectedItemsData: SavedListItem[] = props.availableItems
    .filter(item => selectedItems.value.includes(item.id))
    .map(item => {
      const { id, createdAt, updatedAt, ...itemData } = item
      const cleanedItem: SavedListItem = { ...itemData } as SavedListItem
      
      if (itemQuantities.value[item.id]) {
        cleanedItem.quantity = itemQuantities.value[item.id]
      }
      
      return cleanedItem
    })

  emit('save', {
    name: formData.value.name,
    items: selectedItemsData
  })
}
</script>

