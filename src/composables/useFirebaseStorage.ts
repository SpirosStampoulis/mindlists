import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/config/firebase'

export function useFirebaseStorage() {
  const testStorageConnection = async (): Promise<boolean> => {
    try {
      console.log('=== TESTING STORAGE CONNECTION ===')
      console.log('Storage bucket:', storage.app.options.storageBucket)
      console.log('Project ID:', storage.app.options.projectId)
      const testRef = ref(storage, '_test/connection.txt')
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      console.log('Attempting test upload...')
      await Promise.race([
        uploadBytes(testRef, testBlob),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Storage test timeout')), 10000)
        )
      ])
      console.log('Storage connection test: SUCCESS')
      return true
    } catch (err: any) {
      console.error('=== STORAGE CONNECTION TEST FAILED ===')
      console.error('Error code:', err?.code)
      console.error('Error message:', err?.message)
      console.error('Full error:', err)
      return false
    }
  }

  const uploadPhoto = async (userId: string, file: File, itemId: string): Promise<string> => {
    console.log('=== UPLOAD PHOTO START ===')
    console.log('Storage bucket:', storage.app.options.storageBucket)
    console.log('Project ID:', storage.app.options.projectId)
    console.log('Storage app name:', storage.app.name)
    
    if (!storage.app.options.storageBucket) {
      throw new Error('Firebase Storage bucket is not configured. Please add VITE_FIREBASE_STORAGE_BUCKET to your .env file.')
    }
    
    try {
      const storagePath = `users/${userId}/photos/${itemId}/${Date.now()}_${file.name}`
      console.log('Storage path:', storagePath)
      console.log('File size:', file.size, 'bytes')
      console.log('File type:', file.type)
      
      const storageRef = ref(storage, storagePath)
      console.log('Storage reference created:', storageRef.toString())
      console.log('Full path:', storageRef.fullPath)
      console.log('Bucket:', storageRef.bucket)
      console.log('Starting upload...')
      
      let uploadError: Error | null = null
      const uploadPromise = uploadBytes(storageRef, file).catch(err => {
        uploadError = err
        console.error('Upload bytes error caught:', err)
        throw err
      })
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const error = new Error('Storage upload timeout after 20 seconds. The upload never started or is stuck.')
          if (uploadError) {
            console.error('Timeout occurred, but there was also an upload error:', uploadError)
          }
          reject(error)
        }, 20000)
      })
      
      console.log('Waiting for upload to complete...')
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise])
      console.log('Bytes uploaded successfully!')
      console.log('Upload metadata:', uploadResult.metadata)
      console.log('Getting download URL...')
      
      const downloadURL = await getDownloadURL(storageRef)
      console.log('Download URL obtained:', downloadURL)
      console.log('=== UPLOAD PHOTO SUCCESS ===')
      return downloadURL
    } catch (error: any) {
      console.error('=== FIREBASE STORAGE ERROR ===')
      console.error('Error object:', error)
      console.error('Error code:', error?.code)
      console.error('Error message:', error?.message)
      console.error('Error name:', error?.name)
      console.error('Error stack:', error?.stack)
      console.error('Error serverResponse:', error?.serverResponse)
      console.error('Error customData:', error?.customData)
      console.error('Full error keys:', Object.keys(error || {}))
      console.error('Storage config:', {
        bucket: storage.app.options.storageBucket,
        projectId: storage.app.options.projectId,
        apiKey: storage.app.options.apiKey ? '(set)' : '(not set)'
      })
      
      const errorCode = error?.code || ''
      const errorMessage = error?.message || ''
      
      if (errorCode === 'storage/unauthorized' || errorCode === 'storage/permission-denied') {
        throw new Error(`Storage upload failed: Permission denied (${errorCode}). Rules may not be deployed. Please: 1) Go to Firebase Console > Storage > Rules, 2) Verify rules are published, 3) Wait 30 seconds, 4) Hard refresh browser (Cmd+Shift+R)`)
      } else if (errorCode === 'storage/canceled') {
        throw new Error('Storage upload was canceled.')
      } else if (errorCode === 'storage/unknown') {
        throw new Error('Storage upload failed: Unknown Firebase error. Storage may not be enabled in Firebase Console.')
      } else if (errorCode === 'storage/object-not-found') {
        throw new Error('Storage bucket not found. Please enable Firebase Storage in the Firebase Console.')
      } else if (errorCode === 'storage/unauthenticated') {
        throw new Error('Not authenticated. Please log in again.')
      } else if (errorMessage?.includes('timeout') || errorMessage?.includes('Permission denied')) {
        throw new Error(`Storage upload failed: ${errorMessage}. Rules may need time to propagate. Try: 1) Hard refresh (Cmd+Shift+R), 2) Wait 1 minute, 3) Check Firebase Console > Storage > Rules are published`)
      }
      
      throw new Error(`Photo upload failed: ${errorCode ? `[${errorCode}] ` : ''}${errorMessage || 'Unknown error'}`)
    }
  }

  const deletePhoto = async (photoUrl: string): Promise<void> => {
    const photoRef = ref(storage, photoUrl)
    await deleteObject(photoRef)
  }

  return {
    uploadPhoto,
    deletePhoto,
    testStorageConnection
  }
}

