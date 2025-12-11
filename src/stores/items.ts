import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useFirestore } from '@/composables/useFirestore'
import { useFirebaseStorage } from '@/composables/useFirebaseStorage'
import { useAuthStore } from './auth'
import type { ListItem, ListType, PriceEntry } from '@/types'

export const useItemsStore = defineStore('items', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { createItem, updateItem, deleteItem, toggleItemChecked } = useFirestore()
  const { uploadPhoto, deletePhoto } = useFirebaseStorage()

  const create = async (listType: ListType, itemData: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    console.log('=== CREATE ITEM START ===')
    try {
      loading.value = true
      error.value = null
      const authStore = useAuthStore()
      const userId = authStore.userId

      console.log('User ID:', userId)
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { photoUrl: originalPhotoUrl, ...itemDataWithoutPhoto } = itemData
      console.log('Original photo URL type:', originalPhotoUrl ? (originalPhotoUrl.startsWith('data:') ? 'data' : originalPhotoUrl.startsWith('blob:') ? 'blob' : 'other') : 'none')
      
      const itemToCreate = {
        ...itemDataWithoutPhoto,
        photoUrl: undefined
      }

      console.log('Item to create:', JSON.stringify(itemToCreate, null, 2))
      console.log('Testing Firestore connection before creating item...')
      const firestore = useFirestore()
      const connectionOk = await firestore.testConnection(userId)
      if (!connectionOk) {
        console.warn('Connection test failed, but attempting to create item anyway...')
        console.warn('If this fails, check: 1) Firestore rules allow writes to users/{userId}/** paths, 2) Rules are published in Firebase Console, 3) Browser Network tab for Firestore requests')
      } else {
        console.log('Connection test passed')
      }
      
      console.log('Creating item in Firestore...')
      const itemId = await Promise.race([
        createItem(userId, listType, itemToCreate),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('createItem timeout after 20 seconds')), 20000)
        )
      ])
      console.log('Item created with ID:', itemId)
      
      if (originalPhotoUrl && (originalPhotoUrl.startsWith('data:') || originalPhotoUrl.startsWith('blob:'))) {
        try {
          console.log('=== PHOTO UPLOAD START ===')
          let blob: Blob
          
          if (originalPhotoUrl.startsWith('data:')) {
            console.log('Processing data URL (direct conversion)...')
            const base64Data = originalPhotoUrl.split(',')[1]
            const mimeType = originalPhotoUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            blob = new Blob([byteArray], { type: mimeType })
            console.log('Data URL converted to blob, size:', blob.size)
          } else {
            console.log('Processing blob URL...')
            const response = await Promise.race([
              fetch(originalPhotoUrl),
              new Promise<Response>((_, reject) => 
                setTimeout(() => reject(new Error('Fetch timeout after 10 seconds')), 10000)
              )
            ])
            if (!response.ok) {
              throw new Error('Failed to fetch photo data')
            }
            blob = await response.blob()
            console.log('Blob URL fetched, size:', blob.size)
          }
          
          if (!blob || blob.size === 0) {
            throw new Error('Invalid photo data')
          }
          console.log('Photo blob ready, size:', blob.size, 'type:', blob.type)
          const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
          console.log('File created, uploading to Firebase Storage...')
          const photoUrl = await uploadPhoto(userId, file, itemId)
          console.log('Photo uploaded successfully, URL:', photoUrl)
          console.log('Updating item with photo URL...')
          await updateItem(userId, listType, itemId, { photoUrl })
          console.log('Item updated with photo URL successfully')
          console.log('=== PHOTO UPLOAD END ===')
        } catch (photoErr: any) {
          console.error('=== PHOTO UPLOAD ERROR ===', photoErr)
          console.error('Error stack:', photoErr.stack)
          console.warn('Photo upload failed, but item was created successfully. You can add the photo later by editing the item.')
          error.value = 'Photo upload failed: ' + (photoErr.message || 'Unknown error')
          
          if (photoErr.message?.includes('Storage') || photoErr.message?.includes('timeout')) {
            console.warn('Storage issue detected. Item saved without photo. Please enable Firebase Storage in Firebase Console to upload photos.')
            console.warn('Continuing without photo - item is saved successfully')
            return itemId
          }
          
          throw new Error('Failed to upload photo: ' + (photoErr.message || 'Unknown error'))
        }
      } else {
        console.log('No photo to upload')
      }
      
      console.log('=== CREATE ITEM SUCCESS ===')
      return itemId
    } catch (err: any) {
      console.error('=== CREATE ITEM ERROR ===', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      })
      error.value = err.message || 'Failed to create item'
      
      if (err.message?.includes('photo')) {
        console.warn('Photo upload failed, but item was created. Item ID may be available.')
      }
      
      throw err
    } finally {
      loading.value = false
      console.log('=== CREATE ITEM END ===')
    }
  }

  const update = async (listType: ListType, itemId: string, updates: Partial<ListItem>): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      let photoUrl = updates.photoUrl
      if (updates.photoUrl && (updates.photoUrl.startsWith('data:') || updates.photoUrl.startsWith('blob:'))) {
        try {
          console.log('Starting photo upload for update...')
          let blob: Blob
          
          if (updates.photoUrl.startsWith('data:')) {
            console.log('Processing data URL (direct conversion)...')
            const base64Data = updates.photoUrl.split(',')[1]
            const mimeType = updates.photoUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            blob = new Blob([byteArray], { type: mimeType })
            console.log('Data URL converted to blob, size:', blob.size)
          } else {
            console.log('Processing blob URL...')
            const response = await fetch(updates.photoUrl)
            if (!response.ok) {
              throw new Error('Failed to fetch photo data')
            }
            blob = await response.blob()
            console.log('Blob URL fetched, size:', blob.size)
          }
          
          if (!blob || blob.size === 0) {
            throw new Error('Invalid photo data')
          }
          console.log('Photo blob created, size:', blob.size)
          const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
          console.log('Uploading photo to Firebase Storage...')
          photoUrl = await uploadPhoto(userId, file, itemId)
          console.log('Photo uploaded, URL:', photoUrl)
        } catch (photoErr: any) {
          console.error('Failed to upload photo:', photoErr)
          console.warn('Photo upload failed, but item will be updated without photo')
          error.value = 'Failed to upload photo: ' + (photoErr.message || 'Unknown error')
          
          if (photoErr.message?.includes('Storage') || photoErr.message?.includes('timeout')) {
            console.warn('Storage issue detected. Item will be updated without photo. Please enable Firebase Storage to upload photos.')
            photoUrl = undefined
          } else {
            throw new Error('Failed to upload photo: ' + (photoErr.message || 'Unknown error'))
          }
        }
      }

      const updatesToApply = {
        ...updates,
        photoUrl
      }

      await updateItem(userId, listType, itemId, updatesToApply)
    } catch (err: any) {
      error.value = err.message || 'Failed to update item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (listType: ListType, itemId: string, photoUrl?: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      if (photoUrl && !photoUrl.startsWith('blob:') && !photoUrl.startsWith('data:')) {
        try {
          await deletePhoto(photoUrl)
        } catch (err) {
          console.error('Failed to delete photo:', err)
        }
      }

      await deleteItem(userId, listType, itemId)
    } catch (err: any) {
      error.value = err.message || 'Failed to delete item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleChecked = async (listType: ListType, itemId: string, checked: boolean): Promise<void> => {
    try {
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      await toggleItemChecked(userId, listType, itemId, checked)
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle item'
      throw err
    }
  }

  const addPriceEntry = async (listType: ListType, itemId: string, price: number, date: string): Promise<void> => {
    try {
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const item = await useFirestore().getItem(userId, listType, itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      const newPriceEntry: PriceEntry = {
        id: Date.now().toString(),
        price,
        date,
        createdAt: new Date().toISOString()
      }

      const updatedPriceHistory = [...(item.priceHistory || []), newPriceEntry].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      await updateItem(userId, listType, itemId, { priceHistory: updatedPriceHistory })
    } catch (err: any) {
      error.value = err.message || 'Failed to add price entry'
      throw err
    }
  }

  const removePriceEntry = async (listType: ListType, itemId: string, priceEntryId: string): Promise<void> => {
    try {
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const item = await useFirestore().getItem(userId, listType, itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      const updatedPriceHistory = (item.priceHistory || []).filter(entry => entry.id !== priceEntryId)

      await updateItem(userId, listType, itemId, { priceHistory: updatedPriceHistory })
    } catch (err: any) {
      error.value = err.message || 'Failed to remove price entry'
      throw err
    }
  }

  return {
    loading,
    error,
    create,
    update,
    remove,
    toggleChecked,
    addPriceEntry,
    removePriceEntry
  }
})

