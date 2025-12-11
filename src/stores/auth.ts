import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import { setAuthPersistence } from '@/config/firebase'
import type { User } from 'firebase/auth'
import router from '@/router'

const getErrorMessage = (error: any): string => {
  const code = error?.code || ''
  const message = error?.message || ''
  
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please sign in instead.'
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use a stronger password.'
  }
  if (code === 'auth/invalid-email') {
    return 'Invalid email address. Please check and try again.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Please try again later.'
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact support.'
  }
  
  return message || 'An error occurred. Please try again.'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAnon, logout, onAuthChange } = useFirebaseAuth()

  const isAuthenticated = computed(() => user.value !== null)
  const userId = computed(() => user.value?.uid || null)

  const init = async () => {
    try {
      await setAuthPersistence(true)
    } catch (err) {
      console.warn('Failed to set persistence on init:', err)
    }
    
    return new Promise<void>((resolve) => {
      let resolved = false
      onAuthChange((authUser) => {
        user.value = authUser
        if (!resolved) {
          loading.value = false
          resolved = true
          resolve()
        }
      })
    })
  }

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      error.value = null
      await signInWithEmail(email, password, rememberMe)
      router.push('/')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }

  const register = async (email: string, password: string) => {
    try {
      error.value = null
      await signUpWithEmail(email, password)
      router.push('/')
    } catch (err: any) {
      error.value = getErrorMessage(err)
      throw err
    }
  }

  const loginWithGoogle = async (rememberMe: boolean = true) => {
    try {
      error.value = null
      await signInWithGoogle(rememberMe)
      router.push('/')
    } catch (err: any) {
      error.value = getErrorMessage(err) || 'Failed to sign in with Google'
      throw err
    }
  }

  const loginAnonymously = async () => {
    try {
      error.value = null
      await signInAnon()
      router.push('/')
    } catch (err: any) {
      error.value = err.message || 'Failed to sign in anonymously'
      throw err
    }
  }

  const signOut = async () => {
    try {
      error.value = null
      await logout()
      user.value = null
      router.push('/login')
    } catch (err: any) {
      error.value = err.message || 'Failed to sign out'
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userId,
    init,
    login,
    register,
    loginWithGoogle,
    loginAnonymously,
    signOut
  }
})

