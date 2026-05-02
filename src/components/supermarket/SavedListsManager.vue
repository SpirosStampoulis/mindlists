<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
      <h2 class="text-2xl font-bold">Saved Lists</h2>
      <div class="flex flex-wrap gap-2">
        <input
          ref="importInputRef"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="onImportJson"
        />
        <button
          type="button"
          @click="importInputRef?.click()"
          class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
        >
          Import JSON
        </button>
        <button
          @click="showCreateForm = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create New List
        </button>
      </div>
    </div>
    <p v-if="importFeedback" class="text-sm mb-4" :class="importFeedbackIsError ? 'text-red-600' : 'text-green-700'">
      {{ importFeedback }}
    </p>

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
          @click="navigateToDetail(savedList.id)"
          class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          View List
        </button>
      </div>

      <div v-if="savedLists.length === 0" class="col-span-full text-center py-12 text-gray-500">
        No saved lists yet
      </div>
    </div>


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
import { useRouter } from 'vue-router'
import type { SavedList, ListItem } from '@/types'
import { useSavedLists } from '@/composables/useSavedLists'
import { useAuthStore } from '@/stores/auth'
import SavedListForm from './SavedListForm.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { importSavedListsFromJson, readJsonFile } from '@/utils/savedListImport'

defineProps<{
  currentItems: ListItem[]
}>()

const router = useRouter()
const authStore = useAuthStore()
const { getSavedLists, createSavedList, updateSavedList, deleteSavedList } = useSavedLists()

const savedLists = ref<SavedList[]>([])
const showCreateForm = ref(false)
const editingList = ref<SavedList | undefined>(undefined)
const showDeleteConfirm = ref(false)
const deletingListId = ref<string | null>(null)
const loading = ref(false)
const importInputRef = ref<HTMLInputElement | null>(null)
const importFeedback = ref<string | null>(null)
const importFeedbackIsError = ref(false)

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

const onImportJson = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !authStore.userId) return

  importFeedback.value = null
  importFeedbackIsError.value = false

  try {
    const json = await readJsonFile(file)
    const result = importSavedListsFromJson(json, props.currentItems)
    if (!result.ok) {
      importFeedback.value = result.error
      importFeedbackIsError.value = true
      return
    }
    for (const list of result.lists) {
      await createSavedList(authStore.userId, list)
    }
    await loadSavedLists()
    const skipMsg = result.skippedTitles.length
      ? ` Skipped (no matching item): ${result.skippedTitles.join(', ')}.`
      : ''
    importFeedback.value = `Imported ${result.lists.length} list(s).${skipMsg}`
  } catch (err) {
    importFeedback.value = (err as Error).message || 'Import failed.'
    importFeedbackIsError.value = true
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

const navigateToDetail = (savedListId: string) => {
  router.push(`/list/supermarket/saved/${savedListId}`)
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
  const listDate = savedList.date ? new Date(savedList.date).getTime() : Date.now()
  
  return savedList.items.reduce((total, item) => {
    if (item.priceHistory && item.priceHistory.length > 0) {
      const validPrices = item.priceHistory.filter(entry => {
        const entryDate = new Date(entry.date).getTime()
        return entryDate <= listDate
      })
      
      if (validPrices.length > 0) {
        const sortedPrices = [...validPrices].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        const latestPrice = sortedPrices[0].price
        const quantity = item.quantity || 1
        return total + (latestPrice * quantity)
      }
    }
    return total
  }, 0)
}
</script>


