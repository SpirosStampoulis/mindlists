<template>
  <AppLayout>
    <div>
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/')"
              class="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 class="text-2xl font-bold" style="color: #4caf50">
              🛒 Saved Lists
            </h1>
          </div>
          <div class="flex space-x-2">
            <button
              @click="$router.push('/item/supermarket')"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Item
            </button>
            <button
              @click="showCreateForm = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Create New List
            </button>
          </div>
        </div>
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
          @click="navigateToDetail(savedList.id)"
          class="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">{{ savedList.name }}</h3>
            <div class="flex space-x-2" @click.stop>
              <button
                @click="editList(savedList)"
                class="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                @click.stop="deleteList(savedList.id)"
                class="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-2">{{ savedList.items.length }} items</p>
          <p v-if="savedList.date" class="text-xs text-gray-500 mb-2">
            Date: {{ formatDate(savedList.date) }}
          </p>
          <div v-if="calculateTotal(savedList) > 0" class="mb-4 bg-green-50 p-2 rounded">
            <p class="text-sm text-gray-600">Total:</p>
            <p class="text-xl font-bold text-green-600">€{{ calculateTotal(savedList).toFixed(2) }}</p>
          </div>
        </div>

        <div v-if="savedLists.length === 0" class="col-span-full text-center py-12 text-gray-500">
          No saved lists yet
        </div>
      </div>

      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">All Items</h2>
        </div>
        <SupermarketFilter v-model="supermarketFilter" />
        <LoadingSpinner v-if="loadingItems" />
        <ItemList
          v-else
          :items="filteredItems"
          :list-type="ListType.SUPERMARKET"
        />
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { SavedList } from '@/types'
import { ListType } from '@/types'
import { useSavedLists } from '@/composables/useSavedLists'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'
import AppLayout from '@/components/layout/AppLayout.vue'
import SavedListForm from '@/components/supermarket/SavedListForm.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import ItemList from '@/components/lists/ItemList.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import SupermarketFilter from '@/components/supermarket/SupermarketFilter.vue'
import { formatDate as formatDateUtil } from '@/utils/date'
import { filterSupermarketItems } from '@/utils/sorting'

const router = useRouter()
const authStore = useAuthStore()
const listsStore = useListsStore()
const { getSavedLists, createSavedList, updateSavedList, deleteSavedList } = useSavedLists()

const savedLists = ref<SavedList[]>([])
const showCreateForm = ref(false)
const editingList = ref<SavedList | undefined>(undefined)
const showDeleteConfirm = ref(false)
const deletingListId = ref<string | null>(null)
const loading = ref(false)
const loadingItems = computed(() => listsStore.loading[ListType.SUPERMARKET] || false)

const currentItems = computed(() => listsStore.getItems(ListType.SUPERMARKET))
const items = computed(() => listsStore.getItems(ListType.SUPERMARKET))
const supermarketFilter = ref<'all' | 'pavi' | 'lidl' | 'spar'>('all')
const filteredItems = computed(() => filterSupermarketItems(items.value, supermarketFilter.value))

onMounted(async () => {
  await loadSavedLists()
  listsStore.subscribeToList(ListType.SUPERMARKET)
})

onUnmounted(() => {
  listsStore.unsubscribeAll()
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

const formatDate = (dateString: string): string => {
  return formatDateUtil(dateString)
}
</script>

