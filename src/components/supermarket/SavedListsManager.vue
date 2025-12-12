<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">Saved Lists</h2>
      <button
        @click="showCreateForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        + Create New List
      </button>
    </div>

    <SavedListForm
      v-if="showCreateForm || editingList"
      :saved-list="editingList"
      :available-items="currentItems"
      @save="handleSave"
      @cancel="handleCancel"
    />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="savedList in savedLists"
        :key="savedList.id"
        class="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold">{{ savedList.name }}</h3>
          <div class="flex space-x-2">
            <button
              @click="editList(savedList)"
              class="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              @click="deleteList(savedList.id)"
              class="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-2">{{ savedList.items.length }} items</p>
        <div v-if="calculateTotal(savedList) > 0" class="mb-4 bg-green-50 p-2 rounded">
          <p class="text-sm text-gray-600">Total:</p>
          <p class="text-xl font-bold text-green-600">€{{ calculateTotal(savedList).toFixed(2) }}</p>
        </div>
        <button
          @click="loadList(savedList)"
          class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Load List
        </button>
      </div>

      <div v-if="savedLists.length === 0" class="col-span-full text-center py-12 text-gray-500">
        No saved lists yet
      </div>
    </div>

    <LoadListDialog
      :show="showLoadDialog"
      :saved-list="listToLoad"
      :current-items="currentItems"
      @confirm="confirmLoadList"
      @cancel="showLoadDialog = false"
    />

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Saved List"
      message="Are you sure you want to delete this saved list?"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SavedList, ListItem, SavedListItem } from '@/types'
import { useSavedLists } from '@/composables/useSavedLists'
import { useAuthStore } from '@/stores/auth'
import SavedListForm from './SavedListForm.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import LoadListDialog from './LoadListDialog.vue'

defineProps<{
  currentItems: ListItem[]
}>()

const emit = defineEmits<{
  load: [items: SavedListItem[]]
}>()

const authStore = useAuthStore()
const { getSavedLists, createSavedList, updateSavedList, deleteSavedList } = useSavedLists()

const savedLists = ref<SavedList[]>([])
const showCreateForm = ref(false)
const editingList = ref<SavedList | undefined>(undefined)
const showDeleteConfirm = ref(false)
const deletingListId = ref<string | null>(null)
const loading = ref(false)
const showLoadDialog = ref(false)
const listToLoad = ref<SavedList | undefined>(undefined)

onMounted(async () => {
  await loadSavedLists()
})

const loadSavedLists = async () => {
  if (!authStore.userId) return
  
  try {
    savedLists.value = await getSavedLists(authStore.userId)
  } catch (err) {
    console.error('Failed to load saved lists:', err)
  }
}

const handleSave = async (savedListData: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!authStore.userId) return

  try {
    loading.value = true
    if (editingList.value) {
      await updateSavedList(authStore.userId, editingList.value.id, savedListData)
    } else {
      await createSavedList(authStore.userId, savedListData)
    }
    await loadSavedLists()
    showCreateForm.value = false
    editingList.value = undefined
  } catch (err) {
    console.error('Failed to save list:', err)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  showCreateForm.value = false
  editingList.value = undefined
}

const editList = (savedList: SavedList) => {
  editingList.value = savedList
  showCreateForm.value = false
}

const loadList = (savedList: SavedList) => {
  listToLoad.value = savedList
  showLoadDialog.value = true
}

const confirmLoadList = () => {
  if (listToLoad.value) {
    emit('load', listToLoad.value.items)
    showLoadDialog.value = false
    listToLoad.value = undefined
  }
}

const deleteList = (savedListId: string) => {
  deletingListId.value = savedListId
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!authStore.userId || !deletingListId.value) return

  try {
    await deleteSavedList(authStore.userId, deletingListId.value)
    await loadSavedLists()
  } catch (err) {
    console.error('Failed to delete list:', err)
  } finally {
    showDeleteConfirm.value = false
    deletingListId.value = null
  }
}

const calculateTotal = (savedList: SavedList): number => {
  return savedList.items.reduce((total, item) => {
    if (item.priceHistory && item.priceHistory.length > 0) {
      const sortedPrices = [...item.priceHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      const latestPrice = sortedPrices[0].price
      const quantity = item.quantity || 1
      return total + (latestPrice * quantity)
    }
    return total
  }, 0)
}
</script>


