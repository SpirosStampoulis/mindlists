<template>
  <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-6">
        {{ isEditing 
          ? (listType === 'games' ? 'Edit Game' : 'Edit Item')
          : (listType === 'games' ? 'New Game' : 'New Item')
        }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            v-model="formData.title"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="listType === 'batteries'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Battery Type
          </label>
          <select
            v-model="formData.batteryType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="undefined">Select Type</option>
            <option value="aa">AA</option>
            <option value="aaa">AAA</option>
          </select>
        </div>

        <div v-if="listType === 'batteries'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            How Many
          </label>
          <input
            v-model.number="formData.batteryCount"
            type="number"
            :min="1"
            placeholder="e.g. 4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="listType !== 'travel' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <PhotoUpload
          v-if="listType === 'supermarket' || listType === 'games' || listType === 'travel'"
          v-model="formData.photoUrl"
        />

        <div v-if="listType === 'supermarket'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Store (chain)
          </label>
          <p class="text-xs text-gray-500 mb-2">
            Choose a suggestion or type any store name. Used to filter items on the Next list page.
          </p>
          <input
            v-model="supermarketInput"
            type="text"
            list="supermarket-store-presets"
            autocomplete="off"
            placeholder="e.g. lidl, coop, or any name"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="supermarket-store-presets">
            <option v-for="id in supermarketPresetIds" :key="id" :value="id" />
          </datalist>
        </div>

        <div v-if="listType === 'supermarket'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Product type
          </label>
          <p class="text-xs text-gray-500 mb-2">
            Shown on cards and filters. Pick a category from the list, or use the optional field below for your own type.
          </p>
          <select
            v-model="grocerySelectModel"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">No category</option>
            <option v-for="o in grocerySelectRows" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-2">Custom type (optional)</p>
          <input
            v-model="groceryCustomDraft"
            type="text"
            autocomplete="off"
            placeholder="Type a short code, then Tab or Enter"
            class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            @keydown.enter.prevent="applyGroceryCustom"
            @blur="applyGroceryCustom"
          />
        </div>

        <DatePicker
          v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && listType !== 'gift'"
          v-model="formData.expiryDate"
          label="Expiry Date"
        />

        <ReminderTimeDropdown
          v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && listType !== 'gift'"
          v-model="formData.notificationTime"
          :expiry-date="formData.expiryDate"
          :item-title="formData.title"
        />

        <NotificationConfig
          v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && listType !== 'fitness' && listType !== 'diet' && listType !== 'batteries' && listType !== 'gift' && formData.expiryDate"
          v-model="formData.notificationPresets"
          :expiry-date="formData.expiryDate"
          :item-title="formData.title"
        />

        <div v-if="listType === 'games'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            v-model="formData.gameStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="will-play">Will Play</option>
            <option value="played">Played</option>
          </select>
        </div>

        <div v-if="listType === 'games'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <select
            v-model="formData.platform"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="undefined">Select Platform</option>
            <option value="switch">Switch</option>
            <option value="pc">PC</option>
          </select>
        </div>

        <div v-if="listType === 'games'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Finished Year
          </label>
          <input
            v-model.number="formData.finishedYear"
            type="number"
            :min="2000"
            :max="new Date().getFullYear() + 1"
            placeholder="e.g. 2024"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="listType === 'games'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            YouTube Link
          </label>
          <input
            v-model="formData.youtubeLink"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="listType === 'fitness'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Day Type
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input
                type="radio"
                :value="false"
                v-model="formData.isDayOff"
                class="mr-2"
              />
              Exercise Day
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                :value="true"
                v-model="formData.isDayOff"
                class="mr-2"
              />
              Day Off
            </label>
          </div>
        </div>

        <div v-if="listType === 'fitness' && !formData.isDayOff">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            YouTube Link
          </label>
          <input
            v-model="formData.youtubeLink"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="listType === 'diet'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Day of Week
          </label>
          <select
            v-model="formData.dayOfWeek"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="undefined">Select Day</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>

        <div v-if="listType === 'diet' && formData.dayOfWeek">
          <label class="block text-sm font-medium text-gray-700 mb-4">
            Meals
          </label>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">Lunch</label>
              <input
                v-model="formData.meals!.lunch"
                type="text"
                placeholder="e.g., Grilled chicken salad"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">Dinner</label>
              <input
                v-model="formData.meals!.dinner"
                type="text"
                placeholder="e.g., Salmon with vegetables"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">Snacks</label>
              <input
                v-model="formData.meals!.snacks"
                type="text"
                placeholder="e.g., Apple, nuts"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <PriceHistory
          v-if="listType === 'supermarket'"
          :price-history="formData.priceHistory"
          @add="handleAddPrice"
          @remove="handleRemovePrice"
        />

        <div v-if="itemsStore.error" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ itemsStore.error }}
        </div>

        <div class="flex space-x-4">
          <button
            type="submit"
            :disabled="loading || itemsStore.loading"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ (loading || itemsStore.loading) ? 'Saving...' : 'Save' }}
          </button>
          <button
            type="button"
            @click="$router.back()"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        <button
          v-if="isEditing"
          type="button"
          @click="handleDelete"
          class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {{ listType === 'games' ? 'Delete Game' : 'Delete Item' }}
        </button>
      </form>

      <ConfirmDialog
        :show="showDeleteConfirm"
        :title="listType === 'games' ? 'Delete Game' : 'Delete Item'"
        :message="listType === 'games' 
          ? 'Are you sure you want to delete this game? This action cannot be undone.'
          : 'Are you sure you want to delete this item? This action cannot be undone.'"
        confirm-text="Delete"
        @confirm="confirmDelete"
        @cancel="showDeleteConfirm = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ListItem, ListType, PriceEntry } from '@/types'
import { useItemsStore } from '@/stores/items'
import { useFirestore } from '@/composables/useFirestore'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useListsStore } from '@/stores/lists'
import DatePicker from './DatePicker.vue'
import ReminderTimeDropdown from './ReminderTimeDropdown.vue'
import NotificationConfig from './NotificationConfig.vue'
import PriceHistory from './PriceHistory.vue'
import PhotoUpload from './PhotoUpload.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { normalizeStoreId, presetIdsForDatalist } from '@/utils/supermarketStores'
import { groceryDropdownRows, normalizeGroceryId } from '@/utils/groceryCategories'

const route = useRoute()
const router = useRouter()
const listType = route.params.listType as ListType
const itemId = route.params.itemId as string | undefined

const isEditing = computed(() => !!itemId)
const itemsStore = useItemsStore()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const listsStore = useListsStore()
const loading = ref(false)
const showDeleteConfirm = ref(false)

const formData = ref<Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>>({
  title: '',
  description: '',
  tags: [],
  checked: false,
  expiryDate: undefined,
  notificationTime: undefined,
  notificationPresets: [],
  photoUrl: undefined,
  priceHistory: [],
  youtubeLink: undefined,
  gameStatus: 'will-play',
  platform: undefined,
  finishedYear: undefined,
  order: undefined,
  isDayOff: false,
  dayOfWeek: undefined,
  meals: undefined,
  supermarketCategory: undefined,
  groceryCategory: undefined,
  batteryType: undefined,
  batteryCount: undefined
})

const supermarketPresetIds = presetIdsForDatalist()

const supermarketInput = computed({
  get: () => formData.value.supermarketCategory ?? '',
  set: (v: string) => {
    formData.value.supermarketCategory = normalizeStoreId(v)
  }
})

const groceryCustomDraft = ref('')

const grocerySelectRows = computed(() => groceryDropdownRows(formData.value.groceryCategory))

const grocerySelectModel = computed({
  get: () => formData.value.groceryCategory ?? '',
  set: (v: string) => {
    formData.value.groceryCategory = normalizeGroceryId(v) || undefined
    groceryCustomDraft.value = ''
  }
})

const applyGroceryCustom = () => {
  const next = normalizeGroceryId(groceryCustomDraft.value)
  if (next) {
    formData.value.groceryCategory = next
    groceryCustomDraft.value = ''
  }
}

onMounted(async () => {
  if (isEditing.value && itemId && authStore.userId) {
    try {
      const item = await useFirestore().getItem(authStore.userId, listType, itemId)
      if (item) {
        formData.value = {
          title: item.title,
          description: item.description || '',
          tags: item.tags || [],
          checked: item.checked,
          expiryDate: item.expiryDate,
          notificationTime: item.notificationTime,
          notificationPresets: item.notificationPresets || [],
          photoUrl: item.photoUrl,
          priceHistory: item.priceHistory || [],
          youtubeLink: item.youtubeLink,
          gameStatus: item.gameStatus || 'will-play',
          platform: item.platform,
          finishedYear: item.finishedYear,
          order: item.order,
          isDayOff: item.isDayOff || false,
          dayOfWeek: item.dayOfWeek,
          meals: item.meals,
          supermarketCategory: normalizeStoreId(item.supermarketCategory),
          groceryCategory: normalizeGroceryId(item.groceryCategory),
          batteryType: item.batteryType,
          batteryCount: item.batteryCount
        }
      }
    } catch (err: any) {
      console.error('Failed to load item for editing:', err)
      if (err?.code === 'permission-denied') {
        alert('Permission denied: You do not have access to this item. Please check Firestore rules.')
      } else {
        alert('Failed to load item: ' + (err?.message || 'Unknown error'))
      }
    }
  } else if (listType === 'diet' && route.query.dayOfWeek) {
    formData.value.dayOfWeek = route.query.dayOfWeek as any
    formData.value.title = `Meals for ${(route.query.dayOfWeek as string).charAt(0).toUpperCase() + (route.query.dayOfWeek as string).slice(1)}`
    formData.value.meals = {
      lunch: undefined,
      dinner: undefined,
      snacks: undefined
    }
  } else if (listType === 'fitness') {
    const items = listsStore.getItems(listType)
    const maxOrder = items.length > 0 
      ? Math.max(...items.map(item => item.order ?? -1))
      : -1
    formData.value.order = maxOrder + 1
    formData.value.title = `Exercise Day ${maxOrder + 2}`
  } else if (listType === 'diet') {
    formData.value.meals = {
      lunch: undefined,
      dinner: undefined,
      snacks: undefined
    }
  }
})

const handleSubmit = async () => {
  console.log('=== HANDLE SUBMIT START ===')
  try {
    loading.value = true
    console.log('Loading set to true')
    console.log('Form data:', { 
      title: formData.value.title, 
      hasPhoto: !!formData.value.photoUrl,
      photoType: formData.value.photoUrl ? (formData.value.photoUrl.startsWith('data:') ? 'data' : formData.value.photoUrl.startsWith('blob:') ? 'blob' : 'other') : 'none'
    })
    
    let savedItemId: string | null = null
    
    try {
      if (isEditing.value && itemId) {
        console.log('Updating existing item:', itemId)
        await itemsStore.update(listType, itemId, formData.value)
        savedItemId = itemId
        console.log('Item updated successfully')
      } else {
        console.log('Creating new item')
        savedItemId = await itemsStore.create(listType, formData.value)
        console.log('Item created with ID:', savedItemId)
      }
      
      console.log('Save operation completed, savedItemId:', savedItemId)
    } catch (saveErr: any) {
      console.error('=== SAVE ERROR ===', saveErr)
      throw saveErr
    }

    if (savedItemId && authStore.userId) {
      setTimeout(async () => {
        try {
          const savedItem = await useFirestore().getItem(authStore.userId!, listType, savedItemId!)
          if (savedItem) {
            notificationsStore.cancelItemNotifications(savedItem)
            const notificationIds = notificationsStore.scheduleItemNotifications(savedItem, listType)
            if (notificationIds.length > 0) {
              await itemsStore.update(listType, savedItemId!, { notificationIds })
            }
          }
        } catch (notifErr) {
          console.warn('Failed to schedule notifications:', notifErr)
        }
      }, 1000)
    }
    
    console.log('Navigating back to list...')
    console.log('All operations completed successfully, navigating back...')
    router.back()
  } catch (err: any) {
    console.error('=== FAILED TO SAVE ITEM ===', err)
    console.error('Error type:', err?.constructor?.name)
    console.error('Error message:', err?.message)
    console.error('Error code:', err?.code)
    
    const errorMessage = err?.message || itemsStore.error || 'Failed to save item. Please try again.'
    
    if (err?.message?.includes('photo')) {
      const confirmContinue = confirm(`${errorMessage}\n\nThe item was saved but the photo upload failed. Do you want to go back to the list anyway?`)
      if (confirmContinue) {
        router.back()
      }
    } else {
      alert(errorMessage)
    }
  } finally {
    loading.value = false
    console.log('=== HANDLE SUBMIT END ===')
  }
}

const handleDelete = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  try {
    if (itemId && authStore.userId) {
      const item = await useFirestore().getItem(authStore.userId, listType, itemId)
      if (item) {
        notificationsStore.cancelItemNotifications(item)
      }
      await itemsStore.remove(listType, itemId, formData.value.photoUrl)
      router.back()
    }
  } catch (err) {
    console.error('Failed to delete item:', err)
  } finally {
    showDeleteConfirm.value = false
  }
}

const handleAddPrice = async (price: number, date: string) => {
  if (isEditing.value && itemId) {
    await itemsStore.addPriceEntry(listType, itemId, price, date)
    if (authStore.userId) {
      const item = await useFirestore().getItem(authStore.userId, listType, itemId)
      if (item) {
        formData.value.priceHistory = item.priceHistory || []
      }
    }
  } else {
    const newEntry: PriceEntry = {
      id: Date.now().toString(),
      price,
      date,
      createdAt: new Date().toISOString()
    }
    formData.value.priceHistory = [...(formData.value.priceHistory || []), newEntry]
  }
}

const handleRemovePrice = async (entryId: string) => {
  if (isEditing.value && itemId) {
    await itemsStore.removePriceEntry(listType, itemId, entryId)
    if (authStore.userId) {
      const item = await useFirestore().getItem(authStore.userId, listType, itemId)
      if (item) {
        formData.value.priceHistory = item.priceHistory || []
      }
    }
  } else {
    formData.value.priceHistory = (formData.value.priceHistory || []).filter(e => e.id !== entryId)
  }
}
</script>

