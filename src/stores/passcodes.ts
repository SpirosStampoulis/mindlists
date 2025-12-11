import { defineStore } from 'pinia'
import { ref } from 'vue'
import { collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'mindlists_passcodes'

export interface PasscodeData {
  id: string
  title: string
  description?: string
  passcode: string
  createdAt: string
  updatedAt: string
}

export const usePasscodesStore = defineStore('passcodes', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const encryptedPasscodes = ref<Map<string, string>>(new Map())

  const getPasscodesPath = (userId: string) => {
    return `users/${userId}/passcodes`
  }

  const getEncryptedStorage = (): Map<string, string> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        return new Map(Object.entries(data))
      }
    } catch (err) {
      console.error('Failed to load encrypted passcodes:', err)
    }
    return new Map()
  }

  const saveEncryptedStorage = (map: Map<string, string>) => {
    try {
      const data = Object.fromEntries(map)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save encrypted passcodes:', err)
    }
  }

  const encryptPasscode = async (passcode: string, key: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(passcode)
    const keyData = encoder.encode(key)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('mindlists-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      cryptoKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      data
    )

    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  const decryptPasscode = async (encrypted: string, key: string): Promise<string> => {
    const decoder = new TextDecoder()
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))

    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('mindlists-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      cryptoKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      data
    )

    return decoder.decode(decrypted)
  }

  const authenticateWithWebAuthn = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      return false
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: 'MindLists',
            id: window.location.hostname
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'user',
            displayName: 'User'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      })

      return !!credential
    } catch (err) {
      console.error('WebAuthn authentication failed:', err)
      return false
    }
  }

  const createPasscode = async (title: string, description: string | undefined, passcode: string): Promise<string> => {
    try {
      loading.value = true
      error.value = null
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const passcodesRef = collection(db, getPasscodesPath(userId))
      const newPasscodeRef = doc(passcodesRef)
      const passcodeId = newPasscodeRef.id

      const encryptionKey = `${userId}-${passcodeId}`
      const encrypted = await encryptPasscode(passcode, encryptionKey)

      encryptedPasscodes.value.set(passcodeId, encrypted)
      saveEncryptedStorage(encryptedPasscodes.value)

      const passcodeData = {
        id: passcodeId,
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await setDoc(newPasscodeRef, passcodeData)

      return passcodeId
    } catch (err: any) {
      error.value = err.message || 'Failed to create passcode'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPasscode = async (passcodeId: string): Promise<string> => {
    try {
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const encrypted = encryptedPasscodes.value.get(passcodeId) || getEncryptedStorage().get(passcodeId)
      if (!encrypted) {
        throw new Error('Passcode not found')
      }

      const encryptionKey = `${userId}-${passcodeId}`
      return await decryptPasscode(encrypted, encryptionKey)
    } catch (err: any) {
      error.value = err.message || 'Failed to get passcode'
      throw err
    }
  }

  const updatePasscode = async (passcodeId: string, title: string, description: string | undefined, passcode?: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const passcodeRef = doc(db, getPasscodesPath(userId), passcodeId)

      if (passcode) {
        const encryptionKey = `${userId}-${passcodeId}`
        const encrypted = await encryptPasscode(passcode, encryptionKey)
        encryptedPasscodes.value.set(passcodeId, encrypted)
        saveEncryptedStorage(encryptedPasscodes.value)
      }

      await updateDoc(passcodeRef, {
        title,
        description,
        updatedAt: serverTimestamp()
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to update passcode'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePasscode = async (passcodeId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const authStore = useAuthStore()
      const userId = authStore.userId

      if (!userId) {
        throw new Error('User not authenticated')
      }

      const passcodeRef = doc(db, getPasscodesPath(userId), passcodeId)
      await deleteDoc(passcodeRef)

      encryptedPasscodes.value.delete(passcodeId)
      saveEncryptedStorage(encryptedPasscodes.value)
    } catch (err: any) {
      error.value = err.message || 'Failed to delete passcode'
      throw err
    } finally {
      loading.value = false
    }
  }

  const init = () => {
    encryptedPasscodes.value = getEncryptedStorage()
  }

  return {
    loading,
    error,
    authenticateWithWebAuthn,
    createPasscode,
    getPasscode,
    updatePasscode,
    deletePasscode,
    init
  }
})


