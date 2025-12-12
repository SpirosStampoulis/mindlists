<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Reminder Presets
    </label>
    <div class="space-y-2">
      <div
        v-for="preset in presets"
        :key="preset.value"
        class="flex items-center justify-between"
      >
        <label class="flex items-center space-x-2 cursor-pointer flex-1">
          <input
            type="checkbox"
            :checked="selectedPresets.includes(preset.value)"
            @change="togglePreset(preset.value)"
            class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">{{ preset.label }}</span>
        </label>
        <button
          v-if="selectedPresets.includes(preset.value)"
          @click="previewNotification(preset)"
          class="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          :disabled="!hasPermission"
          :title="hasPermission ? 'Preview notification' : 'Enable notifications first'"
        >
          Preview
        </button>
      </div>
    </div>
    <div v-if="selectedPresets.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <p class="text-sm font-medium text-blue-900 mb-2">Notification Times:</p>
      <ul class="text-sm text-blue-700 space-y-1">
        <li v-for="time in notificationTimes" :key="time">
          {{ time }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NotificationPreset } from '@/types'
import { formatDateTime } from '@/utils/date'
import { useNotificationsStore } from '@/stores/notifications'

const props = defineProps<{
  modelValue: NotificationPreset[]
  expiryDate?: string
  itemTitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [presets: NotificationPreset[]]
}>()

const notificationsStore = useNotificationsStore()

const presets = [
  { value: 1 as NotificationPreset, label: '1 hour before' },
  { value: 3 as NotificationPreset, label: '3 hours before' },
  { value: 6 as NotificationPreset, label: '6 hours before' },
  { value: 24 as NotificationPreset, label: '1 day before' },
  { value: 72 as NotificationPreset, label: '3 days before' }
]

const selectedPresets = computed(() => props.modelValue || [])

const hasPermission = computed(() => notificationsStore.permission === 'granted')

const notificationTimes = computed(() => {
  if (!props.expiryDate) return []
  
  const expiryDate = new Date(props.expiryDate)
  return selectedPresets.value.map(preset => {
    const time = new Date(expiryDate.getTime() - preset * 60 * 60 * 1000)
    return formatDateTime(time.toISOString())
  })
})

const togglePreset = (preset: NotificationPreset) => {
  const current = selectedPresets.value
  if (current.includes(preset)) {
    emit('update:modelValue', current.filter(p => p !== preset))
  } else {
    emit('update:modelValue', [...current, preset])
  }
}

const previewNotification = (preset: { value: NotificationPreset; label: string }) => {
  try {
    const title = props.itemTitle || 'Your Item'
    const message = `${title} expires in ${preset.value} hours`
    notificationsStore.sendPreviewNotification(title, message)
  } catch (error) {
    console.error('Failed to send preview notification:', error)
  }
}
</script>



