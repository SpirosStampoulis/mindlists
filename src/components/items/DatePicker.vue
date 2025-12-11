<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <input
      :value="displayValue"
      @input="handleInput"
      type="datetime-local"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      v-if="modelValue"
      @click="clearDate"
      class="mt-2 text-sm text-red-600 hover:text-red-800"
    >
      Clear
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string | undefined
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const date = new Date(props.modelValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value) {
    const date = new Date(target.value)
    emit('update:modelValue', date.toISOString())
  } else {
    emit('update:modelValue', undefined)
  }
}

const clearDate = () => {
  emit('update:modelValue', undefined)
}
</script>


