import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, Timestamp, serverTimestamp, enableNetwork } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { ListItem, ListType } from '@/types'

export function useFirestore() {
  const testConnection = async (userId?: string): Promise<boolean> => {
    try {
      console.log('Testing Firestore connection...')
      
      if (!userId) {
        console.log('No userId provided, skipping connection test')
        return true
      }
      
      const testPath = `users/${userId}/_test/connection`
      console.log('Test path:', testPath)
      const testRef = doc(db, testPath)
      
      await Promise.race([
        setDoc(testRef, { test: true, timestamp: serverTimestamp() }),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        )
      ])
      
      console.log('Firestore connection test: SUCCESS')
      return true
    } catch (err: any) {
      console.error('Firestore connection test: FAILED', err)
      console.error('Error code:', err?.code)
      console.error('Error message:', err?.message)
      
      if (err?.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules')
      } else if (err?.code === 'unavailable') {
        console.error('Firestore unavailable - check network connection')
      }
      
      return false
    }
  }

  const getItemsPath = (userId: string, listType: ListType) => {
    return `users/${userId}/lists/${listType}/items`
  }

  const subscribeToItems = (
    userId: string,
    listType: ListType,
    callback: (items: ListItem[]) => void
  ) => {
    const itemsRef = collection(db, getItemsPath(userId, listType))
    
    return onSnapshot(itemsRef, (snapshot) => {
      const items: ListItem[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        items.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          expiryDate: data.expiryDate?.toDate?.()?.toISOString() || data.expiryDate,
          notificationTime: data.notificationTime?.toDate?.()?.toISOString() || data.notificationTime
        } as ListItem)
      })
      callback(items)
    })
  }

  const getItem = async (userId: string, listType: ListType, itemId: string): Promise<ListItem | null> => {
    try {
      const itemPath = getItemsPath(userId, listType)
      console.log('Getting item from path:', `${itemPath}/${itemId}`)
      const itemRef = doc(db, itemPath, itemId)
      const itemSnap = await getDoc(itemRef)
      
      if (!itemSnap.exists()) {
        console.log('Item does not exist')
        return null
      }
      
      const data = itemSnap.data()
      return {
        id: itemSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        expiryDate: data.expiryDate?.toDate?.()?.toISOString() || data.expiryDate,
        notificationTime: data.notificationTime?.toDate?.()?.toISOString() || data.notificationTime
      } as ListItem
    } catch (err: any) {
      console.error('getItem error:', err)
      console.error('Error code:', err?.code)
      console.error('Error message:', err?.message)
      if (err?.code === 'permission-denied') {
        throw new Error(`Permission denied: Cannot access item. Please check Firestore rules allow reads to users/${userId}/lists/${listType}/items/${itemId}`)
      }
      throw err
    }
  }

  const createItem = async (userId: string, listType: ListType, item: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    console.log('createItem called with:', { userId, listType, itemKeys: Object.keys(item) })
    console.log('Firestore database:', db.app.name)
    console.log('Firestore project:', db.app.options.projectId)
    
    const itemsRef = collection(db, getItemsPath(userId, listType))
    const newItemRef = doc(itemsRef)
    console.log('Document reference created:', newItemRef.id)
    console.log('Document path:', newItemRef.path)
    
    const itemData: any = {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    if (item.expiryDate) {
      itemData.expiryDate = Timestamp.fromDate(new Date(item.expiryDate))
    } else {
      delete itemData.expiryDate
    }
    
    if (item.notificationTime) {
      itemData.notificationTime = Timestamp.fromDate(new Date(item.notificationTime))
    } else {
      delete itemData.notificationTime
    }
    
    Object.keys(itemData).forEach(key => {
      if (itemData[key] === undefined) {
        delete itemData[key]
      }
    })
    
    console.log('Item data prepared:', Object.keys(itemData))
    console.log('Calling setDoc...')
    
    try {
      try {
        await enableNetwork(db)
        console.log('Network enabled')
      } catch (networkErr: any) {
        console.log('Network already enabled or error:', networkErr.message)
      }
      
      console.log('Attempting setDoc with data:', JSON.stringify(itemData, null, 2))
      console.log('Document path:', newItemRef.path)
      
      let timeoutId: NodeJS.Timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error('setDoc timeout - request may not be reaching Firestore')
          console.error('Check: 1) Browser Network tab for Firestore requests, 2) Firestore rules in Firebase Console, 3) Internet connection')
          reject(new Error('setDoc timeout after 20 seconds'))
        }, 20000)
      })
      
      try {
        const setDocPromise = setDoc(newItemRef, itemData)
        console.log('setDoc promise created, waiting for response...')
        
        await Promise.race([setDocPromise, timeoutPromise])
        clearTimeout(timeoutId!)
        console.log('setDoc completed successfully')
        return newItemRef.id
      } catch (raceErr: any) {
        clearTimeout(timeoutId!)
        throw raceErr
      }
    } catch (err: any) {
      console.error('=== SETDOC ERROR DETAILS ===')
      console.error('Error object:', err)
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err?.constructor?.name)
      console.error('Error code:', err?.code)
      console.error('Error message:', err?.message)
      console.error('Error name:', err?.name)
      console.error('Error stack:', err?.stack)
      console.error('Full error stringified:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
      
      if (err?.code) {
        const errorMsg = `Firestore error (${err.code}): ${err.message || 'Unknown error'}`
        console.error('Throwing:', errorMsg)
        throw new Error(errorMsg)
      }
      
      if (err?.message?.includes('timeout')) {
        const errorMsg = 'Firestore request timed out. Please check: 1) Browser Network tab for requests to firestore.googleapis.com, 2) Firestore rules are deployed in Firebase Console, 3) Your internet connection, 4) Firestore database is created and active'
        console.error('Throwing timeout error:', errorMsg)
        throw new Error(errorMsg)
      }
      
      console.error('Throwing original error')
      throw err
    }
  }

  const updateItem = async (userId: string, listType: ListType, itemId: string, updates: Partial<ListItem>): Promise<void> => {
    const itemRef = doc(db, getItemsPath(userId, listType), itemId)
    
    const updateData: any = {
      updatedAt: serverTimestamp()
    }
    
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof typeof updates]
      if (value !== undefined) {
        if (key === 'expiryDate' && value) {
          updateData[key] = Timestamp.fromDate(new Date(value as string))
        } else if (key === 'notificationTime' && value) {
          updateData[key] = Timestamp.fromDate(new Date(value as string))
        } else {
          updateData[key] = value
        }
      }
    })
    
    await updateDoc(itemRef, updateData)
  }

  const deleteItem = async (userId: string, listType: ListType, itemId: string): Promise<void> => {
    const itemRef = doc(db, getItemsPath(userId, listType), itemId)
    await deleteDoc(itemRef)
  }

  const toggleItemChecked = async (userId: string, listType: ListType, itemId: string, checked: boolean): Promise<void> => {
    await updateItem(userId, listType, itemId, { checked })
  }

  return {
    subscribeToItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
    testConnection
  }
}

