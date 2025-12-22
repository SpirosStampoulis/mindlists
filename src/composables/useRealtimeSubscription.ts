import { onUnmounted } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'

export function useRealtimeSubscription() {
  const subscriptions: Unsubscribe[] = []

  const addSubscription = (unsubscribe: Unsubscribe) => {
    subscriptions.push(unsubscribe)
  }

  const clearSubscriptions = () => {
    subscriptions.forEach(unsub => unsub())
    subscriptions.length = 0
  }

  onUnmounted(() => {
    clearSubscriptions()
  })

  return {
    addSubscription,
    clearSubscriptions
  }
}





