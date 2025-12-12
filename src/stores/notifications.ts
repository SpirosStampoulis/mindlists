import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ListItem, ListType } from '@/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const permission = ref<NotificationPermission>('default')
  const scheduledNotifications = ref<Map<string, number>>(new Map())

  const checkPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied'
    }
    permission.value = Notification.permission
    return permission.value
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      permission.value = 'granted'
      return true
    }

    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  const sendTestNotification = async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    if (permission.value !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('MindLists Test', {
          body: 'Notifications are working!',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'test-notification',
          requireInteraction: true,
          silent: false
        } as NotificationOptions)
      } else {
        const notification = new Notification('MindLists Test', {
          body: 'Notifications are working!',
          icon: '/pwa-192x192.png',
          tag: 'test-notification',
          requireInteraction: false,
          silent: false
        })

        setTimeout(() => notification.close(), 5000)
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  const sendPreviewNotification = async (title: string, message: string) => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    if (permission.value !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(`MindLists - ${title}`, {
          body: message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `preview-${Date.now()}`,
          requireInteraction: true,
          silent: false
        } as NotificationOptions)
      } else {
        const notification = new Notification(`MindLists - ${title}`, {
          body: message,
          icon: '/pwa-192x192.png',
          tag: `preview-${Date.now()}`,
          requireInteraction: false,
          silent: false
        })

        setTimeout(() => notification.close(), 5000)
      }
    } catch (error) {
      console.error('Failed to create preview notification:', error)
      throw error
    }
  }

  const scheduleNotification = (item: ListItem, listType: ListType, time: Date, message: string): string | null => {
    if (!('Notification' in window)) {
      return null
    }

    if (permission.value !== 'granted') {
      return null
    }

    const now = Date.now()
    const scheduledTime = time.getTime()
    const delay = scheduledTime - now

    if (delay <= 0) {
      return null
    }

    const notificationId = `${item.id}-${scheduledTime}`
    const timeoutId = window.setTimeout(async () => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready
          await registration.showNotification(`MindLists - ${item.title}`, {
            body: message,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: notificationId,
            requireInteraction: true,
            silent: false,
            data: {
              itemId: item.id,
              listType
            }
          } as NotificationOptions)
        } else {
          new Notification(`MindLists - ${item.title}`, {
            body: message,
            icon: '/pwa-192x192.png',
            tag: notificationId,
            requireInteraction: false,
            silent: false,
            data: {
              itemId: item.id,
              listType
            }
          })
        }
      } catch (error) {
        console.error('Failed to show scheduled notification:', error)
      }
      scheduledNotifications.value.delete(notificationId)
    }, delay)

    scheduledNotifications.value.set(notificationId, timeoutId)
    return notificationId
  }

  const cancelNotification = (notificationId: string) => {
    const timeoutId = scheduledNotifications.value.get(notificationId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      scheduledNotifications.value.delete(notificationId)
    }
  }

  const scheduleItemNotifications = (item: ListItem, listType: ListType) => {
    const notificationIds: string[] = []

    if (item.notificationTime) {
      const notificationTime = new Date(item.notificationTime)
      const id = scheduleNotification(item, listType, notificationTime, `Reminder: ${item.title}`)
      if (id) notificationIds.push(id)
    }

    if (item.expiryDate && !item.checked) {
      const expiryDate = new Date(item.expiryDate)
      const now = new Date()

      if (item.notificationPresets && item.notificationPresets.length > 0) {
        item.notificationPresets.forEach(preset => {
          const presetTime = new Date(expiryDate.getTime() - preset * 60 * 60 * 1000)
          if (presetTime > now) {
            const id = scheduleNotification(item, listType, presetTime, `${item.title} expires in ${preset} hours`)
            if (id) notificationIds.push(id)
          }
        })
      }

      const oneDayBefore = new Date(expiryDate.getTime() - 24 * 60 * 60 * 1000)
      if (oneDayBefore > now) {
        const id = scheduleNotification(item, listType, oneDayBefore, `${item.title} expires tomorrow`)
        if (id) notificationIds.push(id)
      }

      const sevenDaysBefore = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (sevenDaysBefore > now && expiryDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) {
        const id = scheduleNotification(item, listType, sevenDaysBefore, `${item.title} expires in 7 days`)
        if (id) notificationIds.push(id)
      }
    }

    return notificationIds
  }

  const cancelItemNotifications = (item: ListItem) => {
    if (item.notificationId) {
      cancelNotification(item.notificationId)
    }
    if (item.notificationIds) {
      item.notificationIds.forEach(id => cancelNotification(id))
    }
  }

  return {
    permission,
    checkPermission,
    requestPermission,
    sendTestNotification,
    sendPreviewNotification,
    scheduleNotification,
    cancelNotification,
    scheduleItemNotifications,
    cancelItemNotifications
  }
})


