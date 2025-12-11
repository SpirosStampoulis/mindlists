import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth, setAuthPersistence } from '@/config/firebase'

export function useFirebaseAuth() {
  const signInWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
    await setAuthPersistence(rememberMe)
    return await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async (rememberMe: boolean = true) => {
    await setAuthPersistence(rememberMe)
    const provider = new GoogleAuthProvider()
    return await signInWithPopup(auth, provider)
  }

  const signInAnon = async () => {
    return await signInAnonymously(auth)
  }

  const logout = async () => {
    return await signOut(auth)
  }

  const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
  }

  return {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAnon,
    logout,
    onAuthChange
  }
}

