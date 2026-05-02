<template>
  <AppLayout>
    <div>
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/')"
              class="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 class="text-2xl font-bold" style="color: #4caf50">
              🛒 Next list
            </h1>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              @click="$router.push('/item/supermarket')"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Item
            </button>
            <button
              v-if="!showEditForm && nextList"
              @click="showEditForm = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit list
            </button>
            <input
              ref="importJsonInputRef"
              type="file"
              accept=".json,application/json"
              class="hidden"
              @change="onImportJson"
            />
            <button
              type="button"
              @click="importJsonInputRef?.click()"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              Import JSON
            </button>
            <button
              @click="showImportReceipt = true"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              📥 Import Receipt
            </button>
          </div>
        </div>
      </div>

      <p
        v-if="importJsonFeedback"
        class="text-sm mb-4"
        :class="importJsonFeedbackIsError ? 'text-red-600' : 'text-green-700'"
      >
        {{ importJsonFeedback }}
      </p>

      <LoadingSpinner v-if="loadingList" />

      <SavedListForm
        v-else-if="showEditForm && nextList"
        variant="next"
        :saved-list="nextList"
        :available-items="currentItems"
        @save="handleSave"
        @cancel="handleCancel"
      />

      <div v-else-if="nextList" class="space-y-6">
        <SearchBar v-model="previewSearch" placeholder="Search Next list preview…" />
        <div
          class="bg-white rounded-lg shadow p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
          @click="showEditForm = true"
        >
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-semibold">{{ nextList.name }}</h2>
            <span class="text-sm text-blue-600">Tap to edit</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">{{ nextList.items.length }} items</p>
          <div v-if="calculateTotal(nextList) > 0" class="mb-4 bg-green-50 p-2 rounded">
            <p class="text-sm text-gray-600">Total (priced catalog items):</p>
            <p class="text-xl font-bold text-green-600">€{{ calculateTotal(nextList).toFixed(2) }}</p>
          </div>
          <p
            v-if="previewSearch.trim() && !filteredPreviewItems.length"
            class="text-sm text-amber-800"
          >
            No items match your search.
          </p>
          <ul v-else class="text-sm text-gray-700 space-y-1 max-h-56 overflow-y-auto">
            <li v-for="(row, idx) in filteredPreviewItems" :key="previewKey(row, idx)">
              <span v-if="row.listItemKind === 'text'" class="text-gray-500">(text)</span>
              {{ row.title }}<span v-if="row.quantity && row.quantity > 1"> ×{{ row.quantity }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-8">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 class="text-xl font-bold">All Items</h2>
        </div>

        <div class="mb-6 max-w-xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-800">Merge two items</h3>
          <p class="mt-1 text-xs text-gray-500">
            Pick the row to keep, then the row to merge in (that document is removed). Data from both is combined; if both have a photo, the newer upload wins.
          </p>
          <div class="mt-3 space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Keep (this item stays)</label>
              <select
                v-model="mergeKeepId"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">— Select —</option>
                <option v-for="it in itemsForMergeSelect" :key="'keep-' + it.id" :value="it.id">
                  {{ it.title }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Merge from (this item is deleted)</label>
              <select
                v-model="mergeRemoveId"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">— Select —</option>
                <option v-for="it in itemsForMergeSelect" :key="'rem-' + it.id" :value="it.id">
                  {{ it.title }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
              :disabled="!canMerge"
              @click="runManualMerge"
            >
              {{ mergeBusy ? 'Merging…' : 'Merge selected' }}
            </button>
          </div>
        </div>

        <SupermarketFilter v-model="supermarketFilter" :items="items" />
        <GroceryCategoryFilter v-model="groceryFilter" :items="items" />
        <LoadingSpinner v-if="loadingItems" />
        <ItemList
          v-else
          :items="filteredItems"
          :list-type="ListType.SUPERMARKET"
        />
      </div>

      <ReceiptImportDialog
        v-if="showImportReceipt"
        :existing-items="currentItems"
        @done="showImportReceipt = false"
        @cancel="showImportReceipt = false"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import type { SavedList, SavedListItem, ListItem } from '@/types'
import { ListType } from '@/types'
import { useSavedLists } from '@/composables/useSavedLists'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'
import AppLayout from '@/components/layout/AppLayout.vue'
import SavedListForm from '@/components/supermarket/SavedListForm.vue'
import ItemList from '@/components/lists/ItemList.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import SearchBar from '@/components/shared/SearchBar.vue'
import SupermarketFilter from '@/components/supermarket/SupermarketFilter.vue'
import GroceryCategoryFilter from '@/components/supermarket/GroceryCategoryFilter.vue'
import ReceiptImportDialog from '@/components/supermarket/ReceiptImportDialog.vue'
import { useItemsStore } from '@/stores/items'
import { importSavedListsFromJson, readJsonFile, mergeImportedListsIntoExisting } from '@/utils/savedListImport'
import {
  filterSupermarketItems,
  filterGroceryCategoryItems,
  SUPERMARKET_FILTER_UNCATEGORIZED,
  GROCERY_FILTER_UNCATEGORIZED
} from '@/utils/sorting'

const authStore = useAuthStore()
const listsStore = useListsStore()
const itemsStore = useItemsStore()
const { getOrCreateNextList, updateSavedList } = useSavedLists()

const nextList = ref<SavedList | null>(null)
const showEditForm = ref(false)
const showImportReceipt = ref(false)
const importJsonInputRef = ref<HTMLInputElement | null>(null)
const importJsonFeedback = ref<string | null>(null)
const importJsonFeedbackIsError = ref(false)
const mergeBusy = ref(false)
const mergeKeepId = ref('')
const mergeRemoveId = ref('')
const previewSearch = ref('')
const loadingList = ref(true)
const loadingItems = computed(() => listsStore.loading[ListType.SUPERMARKET] || false)

const currentItems = computed(() => listsStore.getItems(ListType.SUPERMARKET))
const items = computed(() => listsStore.getItems(ListType.SUPERMARKET))
const supermarketFilter = ref<string>('all')
const groceryFilter = ref<string>('all')
const filteredItems = computed(() => {
  const byStore = filterSupermarketItems(items.value, supermarketFilter.value)
  return filterGroceryCategoryItems(byStore, groceryFilter.value)
})

const itemsForMergeSelect = computed((): ListItem[] =>
  [...items.value].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
)

const canMerge = computed(
  () =>
    !!mergeKeepId.value &&
    !!mergeRemoveId.value &&
    mergeKeepId.value !== mergeRemoveId.value &&
    !mergeBusy.value
)

const sortedPreviewItems = computed(() => {
  if (!nextList.value) return []
  const list = [...nextList.value.items]
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

const filteredPreviewItems = computed(() => {
  const rows = sortedPreviewItems.value
  const q = previewSearch.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((r) => r.title.toLowerCase().includes(q))
})

function previewKey(row: SavedListItem, idx: number) {
  if (row.listItemKind === 'text' && row.textLineId) return row.textLineId
  return `${row.title}-${idx}`
}

watch([items, supermarketFilter], () => {
  const f = supermarketFilter.value
  if (f === 'all') return
  if (f === SUPERMARKET_FILTER_UNCATEGORIZED) {
    if (!items.value.some((i) => !i.supermarketCategory?.trim())) {
      supermarketFilter.value = 'all'
    }
    return
  }
  const want = f.trim().toLowerCase()
  const has = items.value.some(
    (i) => (i.supermarketCategory || '').trim().toLowerCase() === want
  )
  if (!has) supermarketFilter.value = 'all'
})

watch([items, groceryFilter], () => {
  const f = groceryFilter.value
  if (f === 'all') return
  if (f === GROCERY_FILTER_UNCATEGORIZED) {
    if (!items.value.some((i) => !i.groceryCategory?.trim())) {
      groceryFilter.value = 'all'
    }
    return
  }
  const want = f.trim().toLowerCase()
  const has = items.value.some((i) => (i.groceryCategory || '').trim().toLowerCase() === want)
  if (!has) groceryFilter.value = 'all'
})

onMounted(async () => {
  await loadNextList()
  listsStore.subscribeToList(ListType.SUPERMARKET)
})

onUnmounted(() => {
  listsStore.unsubscribeAll()
})

const loadNextList = async () => {
  if (!authStore.userId) {
    loadingList.value = false
    return
  }
  try {
    loadingList.value = true
    nextList.value = await getOrCreateNextList(authStore.userId)
  } catch (err) {
    console.error('Failed to load next list:', err)
  } finally {
    loadingList.value = false
  }
}

const onImportJson = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !authStore.userId) return

  if (!nextList.value) await loadNextList()
  if (!nextList.value) return

  importJsonFeedback.value = null
  importJsonFeedbackIsError.value = false

  try {
    const json = await readJsonFile(file)
    const result = importSavedListsFromJson(json, currentItems.value)
    if (!result.ok) {
      importJsonFeedback.value = result.error
      importJsonFeedbackIsError.value = true
      return
    }
    const merged = mergeImportedListsIntoExisting(nextList.value.items, result.lists)
    await updateSavedList(authStore.userId, nextList.value.id, { items: merged })
    await loadNextList()
    const skipMsg = result.skippedTitles.length
      ? ` Skipped (no matching item): ${result.skippedTitles.join(', ')}.`
      : ''
    importJsonFeedback.value = `Merged into Next list.${skipMsg}`
  } catch (err) {
    importJsonFeedback.value = (err as Error).message || 'Import failed.'
    importJsonFeedbackIsError.value = true
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

const runManualMerge = async () => {
  if (!canMerge.value) return
  if (
    !confirm(
      'The second item will be permanently removed. Its fields will be merged into the first item. Continue?'
    )
  ) {
    return
  }
  mergeBusy.value = true
  try {
    await itemsStore.mergeTwoSupermarketItems(mergeKeepId.value, mergeRemoveId.value)
    mergeRemoveId.value = ''
    alert('Items merged.')
  } catch (e: unknown) {
    alert((e as Error).message || 'Merge failed.')
  } finally {
    mergeBusy.value = false
  }
}
</script>
