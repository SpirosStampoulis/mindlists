<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">
      {{ isNextVariant ? 'Edit Next list' : isEditing ? 'Edit Saved List' : 'Create Saved List' }}
    </h3>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="!isNextVariant">
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

      <!-- Next list: cards added / not added -->
      <template v-if="isNextVariant">
        <SearchBar v-model="nextListSearch" placeholder="Search Next list items…" />

        <div>
          <h4 class="text-sm font-semibold text-gray-800 mb-2">On Next list</h4>
          <p class="text-xs text-gray-500 mb-3">Click a card to remove it from the list.</p>
          <div
            v-if="!hasAnythingOnList"
            class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
          >
            Nothing here yet — add items from below or as text.
          </div>
          <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto">
            <p
              v-if="nextListSearchNorm && !catalogAddedFiltered.length && !textLinesFiltered.length"
              class="col-span-full rounded-lg border border-amber-100 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900"
            >
              No items on the list match your search.
            </p>
            <button
              v-for="item in catalogAddedFiltered"
              :key="'on-' + item.id"
              type="button"
              class="flex flex-col items-start rounded-lg border border-green-200 bg-green-50 p-3 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50"
              @click="removeCatalogItem(item.id)"
            >
              <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
              <span class="mt-1 text-xs text-gray-500">Click to remove</span>
              <label class="mt-2 flex w-full items-center gap-2 text-xs text-gray-600" @click.stop>
                <span class="shrink-0">Qty</span>
                <input
                  v-model.number="itemQuantities[item.id]"
                  type="number"
                  min="1"
                  class="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
            </button>
            <button
              v-for="row in textLinesFiltered"
              :key="'txt-' + row.textLineId"
              type="button"
              class="flex flex-col items-start rounded-lg border border-green-200 bg-green-50 p-3 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50"
              @click="removeTextLine(row.textLineId)"
            >
              <span class="text-xs font-medium uppercase text-gray-500">Text</span>
              <span class="text-sm font-medium text-gray-900">{{ row.title }}</span>
              <span class="mt-1 text-xs text-gray-500">Click to remove</span>
              <label class="mt-2 flex w-full items-center gap-2 text-xs text-gray-600" @click.stop>
                <span class="shrink-0">Qty</span>
                <input
                  v-model.number="row.quantity"
                  type="number"
                  min="1"
                  class="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
            </button>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-semibold text-gray-800 mb-2">Not on list yet</h4>
          <p class="text-xs text-gray-500 mb-3">Click a card to add it to Next list above.</p>
          <div
            v-if="catalogNotAdded.length === 0"
            class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500"
          >
            All catalog items are on the list.
          </div>
          <div
            v-else-if="!catalogNotAddedFiltered.length"
            class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900"
          >
            {{ nextListSearchNorm ? 'No catalog items match your search.' : '' }}
          </div>
          <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto">
            <button
              v-for="item in catalogNotAddedFiltered"
              :key="'off-' + item.id"
              type="button"
              class="rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-green-400 hover:bg-green-50"
              @click="addCatalogItem(item.id)"
            >
              <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
              <span class="mt-1 block text-xs text-gray-500">Click to add</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Add as text only
          </label>
          <div class="mb-2 flex flex-wrap gap-2">
            <input
              v-model="newTextLine"
              type="text"
              placeholder="e.g. birthday candles"
              class="min-w-[12rem] flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keydown.enter.prevent="addTextLine"
            />
            <button
              type="button"
              class="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
              @click="addTextLine"
            >
              Add line
            </button>
          </div>
        </div>
      </template>

      <!-- Default: checkbox catalog -->
      <div v-else>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Items
        </label>
        <div class="max-h-64 space-y-2 overflow-y-auto">
          <div
            v-for="item in availableItems"
            :key="item.id"
            class="flex items-center space-x-2 rounded p-2 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :checked="selectedItems.includes(item.id)"
              class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              @change="toggleItem(item.id)"
            />
            <span class="flex-1">{{ item.title }}</span>
            <input
              v-if="selectedItems.includes(item.id)"
              v-model.number="itemQuantities[item.id]"
              type="number"
              min="1"
              placeholder="Qty"
              class="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click.stop
            />
          </div>
        </div>
      </div>

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="!isNextVariant && !formData.name"
          class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SavedList, ListItem, SavedListItem } from '@/types'
import { NEXT_LIST_DISPLAY_NAME } from '@/constants/savedLists'
import { createTextLineSavedItem } from '@/utils/savedListTextItem'
import SearchBar from '@/components/shared/SearchBar.vue'

type TextLineDraft = { textLineId: string; title: string; quantity: number }

const props = defineProps<{
  savedList?: SavedList
  availableItems: ListItem[]
  variant?: 'default' | 'next'
}>()

const emit = defineEmits<{
  save: [savedList: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>]
  cancel: []
}>()

const isNextVariant = computed(() => props.variant === 'next')

const selectedItems = ref<string[]>([])
const itemQuantities = ref<Record<string, number>>({})
const nextListSearch = ref('')
const textLines = ref<TextLineDraft[]>([])
const newTextLine = ref('')

const formData = ref({
  name: '',
  items: [] as SavedListItem[]
})

const isEditing = computed(() => !!props.savedList)

const catalogAddedOrdered = computed((): ListItem[] => {
  return selectedItems.value
    .map((id) => props.availableItems.find((i) => i.id === id))
    .filter((i): i is ListItem => !!i)
})

const catalogNotAdded = computed((): ListItem[] => {
  const set = new Set(selectedItems.value)
  return [...props.availableItems]
    .filter((i) => !set.has(i.id))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
})

const nextListSearchNorm = computed(() => nextListSearch.value.trim().toLowerCase())

function titleMatchesNextSearch(title: string): boolean {
  const q = nextListSearchNorm.value
  if (!q) return true
  return title.toLowerCase().includes(q)
}

const catalogAddedFiltered = computed((): ListItem[] =>
  catalogAddedOrdered.value.filter((i) => titleMatchesNextSearch(i.title))
)

const textLinesFiltered = computed((): TextLineDraft[] =>
  textLines.value.filter((r) => titleMatchesNextSearch(r.title))
)

const catalogNotAddedFiltered = computed((): ListItem[] =>
  catalogNotAdded.value.filter((i) => titleMatchesNextSearch(i.title))
)

const hasAnythingOnList = computed(
  () => catalogAddedOrdered.value.length > 0 || textLines.value.length > 0
)

function syncFromSavedList() {
  const sl = props.savedList
  formData.value.name = sl?.name || ''
  selectedItems.value = []
  itemQuantities.value = {}
  textLines.value = []

  if (!sl) return

  const catalogSaved = sl.items.filter((si) => si.listItemKind !== 'text')
  selectedItems.value = catalogSaved
    .map((savedItem) => {
      const matchingItem = props.availableItems.find((item) => item.title === savedItem.title)
      if (matchingItem?.id && savedItem.quantity) {
        itemQuantities.value[matchingItem.id] = savedItem.quantity
      }
      return matchingItem?.id
    })
    .filter((id): id is string => !!id)

  for (const id of selectedItems.value) {
    if (itemQuantities.value[id] === undefined) {
      itemQuantities.value[id] = 1
    }
  }

  textLines.value = sl.items
    .filter((si) => si.listItemKind === 'text')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((si) => ({
      textLineId: si.textLineId || crypto.randomUUID(),
      title: si.title,
      quantity: si.quantity && si.quantity >= 1 ? si.quantity : 1
    }))
}

watch(
  () => props.savedList,
  () => syncFromSavedList(),
  { immediate: true, deep: true }
)

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

const addCatalogItem = (itemId: string) => {
  if (selectedItems.value.includes(itemId)) return
  selectedItems.value.push(itemId)
  itemQuantities.value[itemId] = itemQuantities.value[itemId] ?? 1
}

const removeCatalogItem = (itemId: string) => {
  const i = selectedItems.value.indexOf(itemId)
  if (i > -1) selectedItems.value.splice(i, 1)
  delete itemQuantities.value[itemId]
}

const addTextLine = () => {
  const t = newTextLine.value.trim()
  if (!t) return
  textLines.value.push({
    textLineId: crypto.randomUUID(),
    title: t,
    quantity: 1
  })
  newTextLine.value = ''
}

const removeTextLine = (id: string) => {
  textLines.value = textLines.value.filter((r) => r.textLineId !== id)
}

const handleSubmit = () => {
  const selectedItemsData: SavedListItem[] = selectedItems.value.map((itemId, index) => {
    const item = props.availableItems.find((i) => i.id === itemId)!
    const { id, createdAt, updatedAt, ...itemData } = item
    const cleanedItem: SavedListItem = { ...itemData } as SavedListItem
    cleanedItem.listItemKind = 'catalog'

    if (itemQuantities.value[item.id]) {
      cleanedItem.quantity = itemQuantities.value[item.id]
    }

    cleanedItem.order = index

    return cleanedItem
  })

  const baseOrder = selectedItemsData.length
  const textSaved: SavedListItem[] = textLines.value.map((row, i) =>
    createTextLineSavedItem(row.title, baseOrder + i, row.textLineId, row.quantity)
  )

  const nameOut = isNextVariant.value ? NEXT_LIST_DISPLAY_NAME : formData.value.name.trim()

  emit('save', {
    name: nameOut,
    items: [...selectedItemsData, ...textSaved]
  })
}
</script>
