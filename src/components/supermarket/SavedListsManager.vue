<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
      <h2 class="text-2xl font-bold">Next list</h2>
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
          v-if="!showEditForm && nextList"
          type="button"
          @click="showEditForm = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Edit list
        </button>
      </div>
    </div>
    <p v-if="importFeedback" class="text-sm mb-4" :class="importFeedbackIsError ? 'text-red-600' : 'text-green-700'">
      {{ importFeedback }}
    </p>

    <SavedListForm
      v-if="showEditForm && nextList"
      variant="next"
      :saved-list="nextList"
      :available-items="currentItems"
      @save="handleSave"
      @cancel="handleCancel"
    />

    <div v-else-if="nextList" class="bg-white rounded-lg shadow p-4 border border-gray-200 mb-4">
      <p class="text-sm text-gray-600 mb-2">{{ nextList.items.length }} items</p>
      <div v-if="calculateTotal(nextList) > 0" class="mb-4 bg-green-50 p-2 rounded">
        <p class="text-sm text-gray-600">Total:</p>
        <p class="text-xl font-bold text-green-600">€{{ calculateTotal(nextList).toFixed(2) }}</p>
      </div>
      <button
        type="button"
        class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        @click="emitLoadFromNext"
      >
        Load into supermarket list
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SavedList, ListItem, SavedListItem } from '@/types'
import { useSavedLists } from '@/composables/useSavedLists'
import { useAuthStore } from '@/stores/auth'
import SavedListForm from './SavedListForm.vue'
import { importSavedListsFromJson, readJsonFile, mergeImportedListsIntoExisting } from '@/utils/savedListImport'

const props = defineProps<{
  currentItems: ListItem[]
}>()

const emit = defineEmits<{
  load: [items: SavedListItem[]]
}>()

const authStore = useAuthStore()
const { getOrCreateNextList, updateSavedList } = useSavedLists()

const nextList = ref<SavedList | null>(null)
const showEditForm = ref(false)
const importInputRef = ref<HTMLInputElement | null>(null)
const importFeedback = ref<string | null>(null)
const importFeedbackIsError = ref(false)

onMounted(async () => {
  await loadNextList()
})

const loadNextList = async () => {
  if (!authStore.userId) return
  try {
    nextList.value = await getOrCreateNextList(authStore.userId)
  } catch (err) {
    console.error('Failed to load next list:', err)
  }
}

const onImportJson = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !authStore.userId) return

  if (!nextList.value) await loadNextList()
  if (!nextList.value) return

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
    const merged = mergeImportedListsIntoExisting(nextList.value.items, result.lists)
    await updateSavedList(authStore.userId, nextList.value.id, { items: merged })
    await loadNextList()
    const skipMsg = result.skippedTitles.length
      ? ` Skipped (no matching item): ${result.skippedTitles.join(', ')}.`
      : ''
    importFeedback.value = `Merged into Next list.${skipMsg}`
  } catch (err) {
    importFeedback.value = (err as Error).message || 'Import failed.'
    importFeedbackIsError.value = true
  }
}

const handleSave = async (savedListData: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!authStore.userId || !nextList.value) return
  try {
    await updateSavedList(authStore.userId, nextList.value.id, savedListData)
    await loadNextList()
    showEditForm.value = false
  } catch (err) {
    console.error('Failed to save list:', err)
  }
}

const handleCancel = () => {
  showEditForm.value = false
}

const emitLoadFromNext = () => {
  if (nextList.value?.items?.length) {
    emit('load', nextList.value.items)
  }
}

const calculateTotal = (savedList: SavedList): number => {
  const listDate = savedList.date ? new Date(savedList.date).getTime() : Date.now()

  return savedList.items.reduce((total, item) => {
    if (item.listItemKind === 'text') return total
    if (item.priceHistory && item.priceHistory.length > 0) {
      const validPrices = item.priceHistory.filter((entry) => {
        const entryDate = new Date(entry.date).getTime()
        return entryDate <= listDate
      })

      if (validPrices.length > 0) {
        const sortedPrices = [...validPrices].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        const latestPrice = sortedPrices[0].price
        const quantity = item.quantity || 1
        return total + latestPrice * quantity
      }
    }
    return total
  }, 0)
}
</script>
