<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Reminder Time
    </label>
    <div class="flex gap-2">
      <select
        :value="selectedValue"
        @change="handleChange"
        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">No reminder</option>
        <option
          v-for="option in reminderOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <button
        v-if="selectedValue"
        @click="previewNotification"
        class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        :disabled="!hasPermission"
        :title="hasPermission ? 'Preview notification' : 'Enable notifications first'"
      >
        Preview
      </button>
    </div>
    <p v-if="calculatedTime && selectedValue" class="mt-2 text-sm text-gray-600">
      Reminder will be sent at: {{ calculatedTime }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/utils/date'
import { useNotificationsStore } from '@/stores/notifications'

const props = defineProps<{
  modelValue: string | undefined
  expiryDate?: string
  itemTitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const notificationsStore = useNotificationsStore()

const reminderOptions = [
  { value: '1', label: '1 hour before' },
  { value: '3', label: '3 hours before' },
  { value: '6', label: '6 hours before' },
  { value: '12', label: '12 hours before' },
  { value: '24', label: '1 day before' },
  { value: '48', label: '2 days before' },
  { value: '72', label: '3 days before' },
  { value: '168', label: '1 week before' }
]

const hasPermission = computed(() => notificationsStore.permission === 'granted')

const selectedValue = computed(() => {
  if (!props.modelValue || !props.expiryDate) return ''
  
  const reminderTime = new Date(props.modelValue)
  const expiryDate = new Date(props.expiryDate)
  const diffHours = (expiryDate.getTime() - reminderTime.getTime()) / (1000 * 60 * 60)
  
  const matchingOption = reminderOptions.find(opt => {
    const optHours = parseInt(opt.value)
    return Math.abs(diffHours - optHours) < 0.5
  })
  
  return matchingOption?.value || ''
})

const calculatedTime = computed(() => {
  if (!selectedValue.value || !props.expiryDate) return null
  
  const hours = parseInt(selectedValue.value)
  const expiryDate = new Date(props.expiryDate)
  const reminderTime = new Date(expiryDate.getTime() - hours * 60 * 60 * 1000)
  
  return formatDateTime(reminderTime.toISOString())
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedHours = target.value
  
  if (!selectedHours) {
    emit('update:modelValue', undefined)
    return
  }
  
  if (props.expiryDate) {
    const hours = parseInt(selectedHours)
    const expiryDate = new Date(props.expiryDate)
    const reminderTime = new Date(expiryDate.getTime() - hours * 60 * 60 * 1000)
    emit('update:modelValue', reminderTime.toISOString())
  } else {
    const hours = parseInt(selectedHours)
    const now = new Date()
    const reminderTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
    emit('update:modelValue', reminderTime.toISOString())
  }
}

const previewNotification = () => {
  try {
    const title = props.itemTitle || 'Your Item'
    const option = reminderOptions.find(opt => opt.value === selectedValue.value)
    const message = `Reminder: ${title} (${option?.label})`
    notificationsStore.sendPreviewNotification(title, message)
  } catch (error) {
    console.error('Failed to send preview notification:', error)
  }
}
</script>



