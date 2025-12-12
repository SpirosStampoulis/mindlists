<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Notification Settings</h3>
    
    <div class="space-y-4">
      <div>
        <p class="text-sm text-gray-600 mb-2">
          Permission Status: 
          <span :class="permissionClass">{{ permissionText }}</span>
        </p>
        <button
          v-if="permission !== 'granted'"
          @click="requestPermission"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Request Permission
        </button>
      </div>

      <div>
        <button
          @click="sendTest"
          :disabled="permission !== 'granted'"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Send Test Notification
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()
const permission = ref<NotificationPermission>('default')

onMounted(async () => {
  permission.value = await notificationsStore.checkPermission()
})

const permissionText = computed(() => {
  switch (permission.value) {
    case 'granted':
      return 'Granted'
    case 'denied':
      return 'Denied'
    default:
      return 'Not Set'
  }
})

const permissionClass = computed(() => {
  switch (permission.value) {
    case 'granted':
      return 'text-green-600'
    case 'denied':
      return 'text-red-600'
    default:
      return 'text-yellow-600'
  }
})

const requestPermission = async () => {
  const granted = await notificationsStore.requestPermission()
  permission.value = granted ? 'granted' : 'denied'
}

const sendTest = async () => {
  try {
    await notificationsStore.sendTestNotification()
  } catch (err) {
    alert('Failed to send test notification. Please check notification permissions.')
  }
}
</script>



