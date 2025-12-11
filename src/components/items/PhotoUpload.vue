<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Photo
    </label>
    
    <div v-if="previewUrl" class="mb-4">
      <img
        :src="previewUrl"
        alt="Preview"
        class="w-full max-h-96 object-contain rounded-lg border border-gray-200"
      />
      <button
        type="button"
        @click.stop="removePhoto"
        class="mt-2 text-sm text-red-600 hover:text-red-800"
      >
        Remove Photo
      </button>
    </div>

    <div v-else class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="hidden"
      />
      <button
        type="button"
        @click.stop="fileInput?.click()"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Select Photo
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | undefined>(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  previewUrl.value = newVal
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      previewUrl.value = result
      emit('update:modelValue', result)
    }
    reader.readAsDataURL(file)
  }
}

const removePhoto = () => {
  previewUrl.value = undefined
  emit('update:modelValue', undefined)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

