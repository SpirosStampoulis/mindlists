<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-4">
        <button
          @click="$router.back()"
          class="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <h1 class="text-2xl font-bold" :style="{ color: config.color }">
          {{ config.icon }} {{ config.name }}
        </h1>
      </div>
      <div class="flex space-x-2">
        <button
          v-if="listType === 'supermarket'"
          @click="showSavedLists = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📋 Saved Lists
        </button>
        <button
          @click="$router.push(`/item/${listType}`)"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + {{ listType === 'games' ? 'Add Game' : 'Add Item' }}
        </button>
      </div>
    </div>

    <div v-if="showSavedLists && listType === 'supermarket'" class="mb-6">
      <SavedListsManager
        :current-items="items"
        @load="handleLoadSavedList"
      />
    </div>

    <SearchBar v-model="searchQuery" />
    
    <FilterButtons
      v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes'"
      v-model="filter"
      :list-type="listType"
    />

    <LoadingSpinner v-if="loading" />
    <ItemList
      v-else
      :items="filteredAndSearchedItems"
      :list-type="listType"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ListType, FilterType } from '@/types'
import { LIST_TYPE_CONFIGS } from '@/types'
import { useListsStore } from '@/stores/lists'
import { searchItems, debounce } from '@/utils/search'
import { filterItems } from '@/utils/sorting'
import SearchBar from '@/components/shared/SearchBar.vue'
import FilterButtons from '@/components/shared/FilterButtons.vue'
import ItemList from './ItemList.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import SavedListsManager from '@/components/supermarket/SavedListsManager.vue'
import { useItemsStore } from '@/stores/items'
import type { SavedListItem } from '@/types'

const route = useRoute()
const listType = route.params.type as ListType
const config = LIST_TYPE_CONFIGS[listType]

const listsStore = useListsStore()
const itemsStore = useItemsStore()
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const filter = ref<FilterType>('all')
const showSavedLists = ref(false)

const items = computed(() => listsStore.getItems(listType))
const loading = computed(() => listsStore.loading[listType] || false)

const debouncedSearch = debounce((query: string) => {
  debouncedSearchQuery.value = query
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

const searchedItems = computed(() => {
  return searchItems(items.value, debouncedSearchQuery.value)
})

const filteredAndSearchedItems = computed(() => {
  return filterItems(searchedItems.value, filter.value, listType)
})

onMounted(() => {
  listsStore.subscribeToList(listType)
})

onUnmounted(() => {
  listsStore.unsubscribeAll()
})

const handleLoadSavedList = async (itemsToLoad: SavedListItem[]) => {
  try {
    const currentItemTitles = new Set(items.value.map(item => item.title.toLowerCase()))
    
    for (const item of itemsToLoad) {
      const itemTitleLower = item.title.toLowerCase()
      if (!currentItemTitles.has(itemTitleLower)) {
        const { quantity, ...itemToCreate } = item
        await itemsStore.create(listType, {
          ...itemToCreate,
          checked: false
        })
      }
    }
    showSavedLists.value = false
  } catch (err: any) {
    console.error('Failed to load saved list:', err)
    alert(err.message || 'Failed to load saved list. Please try again.')
  }
}
</script>

