import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { SavedList, SavedListItem } from '@/types'
import { NEXT_LIST_DOCUMENT_ID, NEXT_LIST_DISPLAY_NAME } from '@/constants/savedLists'

function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null
  if (Array.isArray(obj)) {
    return obj.map(cleanData)
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    Object.keys(obj).forEach((key) => {
      const value = obj[key]
      if (value !== undefined) {
        cleaned[key] = cleanData(value)
      }
    })
    return cleaned
  }
  return obj
}

function mapSnapToSavedList(id: string, data: any): SavedList {
  return {
    id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
  } as SavedList
}

export function useSavedLists() {
  const getSavedListsPath = (userId: string) => {
    return `users/${userId}/savedLists`
  }

  const getSavedLists = async (userId: string): Promise<SavedList[]> => {
    const savedListsRef = collection(db, getSavedListsPath(userId))
    const snapshot = await getDocs(savedListsRef)
    
    const savedLists: SavedList[] = []
    snapshot.forEach((d) => {
      savedLists.push(mapSnapToSavedList(d.id, d.data()))
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
    return mapSnapToSavedList(savedListSnap.id, data)
  }

  const getOrCreateNextList = async (userId: string): Promise<SavedList> => {
    const path = getSavedListsPath(userId)
    const nextRef = doc(db, path, NEXT_LIST_DOCUMENT_ID)
    let snap = await getDoc(nextRef)
    if (snap.exists()) {
      return mapSnapToSavedList(snap.id, snap.data())
    }

    const colRef = collection(db, path)
    const allSnap = await getDocs(colRef)
    let migratedItems: SavedListItem[] = []
    let migratedDate: string | undefined
    let bestTime = 0
    allSnap.forEach((d) => {
      if (d.id === NEXT_LIST_DOCUMENT_ID) return
      const data = d.data()
      const t = data.updatedAt?.toDate?.()?.getTime() || 0
      if (t >= bestTime) {
        bestTime = t
        migratedItems = (data.items as SavedListItem[]) || []
        migratedDate = data.date
      }
    })

    await setDoc(nextRef, {
      ...cleanData({
        name: NEXT_LIST_DISPLAY_NAME,
        items: migratedItems,
        date: migratedDate
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    snap = await getDoc(nextRef)
    return mapSnapToSavedList(snap.id, snap.data()!)
  }

  const createSavedList = async (userId: string, savedList: Omit<SavedList, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const savedListsRef = collection(db, getSavedListsPath(userId))
    const newSavedListRef = doc(savedListsRef)

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
    getOrCreateNextList,
    createSavedList,
    updateSavedList,
    deleteSavedList
  }
}

