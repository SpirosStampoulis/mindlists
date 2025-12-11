import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { SavedList } from '@/types'

export function useSavedLists() {
  const getSavedListsPath = (userId: string) => {
    return `users/${userId}/savedLists`
  }

  const getSavedLists = async (userId: string): Promise<SavedList[]> => {
    const savedListsRef = collection(db, getSavedListsPath(userId))
    const snapshot = await getDocs(savedListsRef)
    
    const savedLists: SavedList[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      savedLists.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as SavedList)
    })
    
    return savedLists
  }

  const getSavedList = async (userId: string, savedListId: string): Promise<SavedList | null> => {
    const savedListRef = doc(db, getSavedListsPath(userId), savedListId)
    const savedListSnap = await getDoc(savedListRef)
    
    if (!savedListSnap.exists()) {
      return null
    }
    
    const data = savedListSnap.data()
    return {
      id: savedListSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
    } as SavedList
  }

  const createSavedList = async (userId: string, savedList: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const savedListsRef = collection(db, getSavedListsPath(userId))
    const newSavedListRef = doc(savedListsRef)
    
    const cleanData = (obj: any): any => {
      if (obj === null || obj === undefined) return null
      if (Array.isArray(obj)) {
        return obj.map(cleanData)
      }
      if (typeof obj === 'object') {
        const cleaned: any = {}
        Object.keys(obj).forEach(key => {
          const value = obj[key]
          if (value !== undefined) {
            cleaned[key] = cleanData(value)
          }
        })
        return cleaned
      }
      return obj
    }
    
    const savedListData = {
      ...cleanData(savedList),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    await setDoc(newSavedListRef, savedListData)
    return newSavedListRef.id
  }

  const updateSavedList = async (userId: string, savedListId: string, updates: Partial<SavedList>): Promise<void> => {
    const savedListRef = doc(db, getSavedListsPath(userId), savedListId)
    
    const cleanData = (obj: any): any => {
      if (obj === null || obj === undefined) return null
      if (Array.isArray(obj)) {
        return obj.map(cleanData)
      }
      if (typeof obj === 'object') {
        const cleaned: any = {}
        Object.keys(obj).forEach(key => {
          const value = obj[key]
          if (value !== undefined) {
            cleaned[key] = cleanData(value)
          }
        })
        return cleaned
      }
      return obj
    }
    
    const updateData = {
      ...cleanData(updates),
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(savedListRef, updateData)
  }

  const deleteSavedList = async (userId: string, savedListId: string): Promise<void> => {
    const savedListRef = doc(db, getSavedListsPath(userId), savedListId)
    await deleteDoc(savedListRef)
  }

  return {
    getSavedLists,
    getSavedList,
    createSavedList,
    updateSavedList,
    deleteSavedList
  }
}

