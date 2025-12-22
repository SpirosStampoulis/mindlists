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

        <div v-if="listType !== 'travel'">
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

        <DatePicker
          v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes' && listType !== 'games'"
          v-model="formData.expiryDate"
          label="Expiry Date"
        />

        <ReminderTimeDropdown
          v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes' && listType !== 'games'"
          v-model="formData.notificationTime"
          :expiry-date="formData.expiryDate"
          :item-title="formData.title"
        />

        <NotificationConfig
          v-if="listType !== 'supermarket' && listType !== 'travel' && listType !== 'passcodes' && listType !== 'games' && formData.expiryDate"
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
import DatePicker from './DatePicker.vue'
import ReminderTimeDropdown from './ReminderTimeDropdown.vue'
import NotificationConfig from './NotificationConfig.vue'
import PriceHistory from './PriceHistory.vue'
import PhotoUpload from './PhotoUpload.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const listType = route.params.listType as ListType
const itemId = route.params.itemId as string | undefined

const isEditing = computed(() => !!itemId)
const itemsStore = useItemsStore()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
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
  finishedYear: undefined
})

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
          finishedYear: item.finishedYear
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

