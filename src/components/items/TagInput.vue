<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-2">
      <span
        v-for="tag in tags"
        :key="tag"
        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2"
      >
        <span>{{ tag }}</span>
        <button
          @click="removeTag(tag)"
          class="text-blue-600 hover:text-blue-800"
        >
          ×
        </button>
      </span>
    </div>
    <div class="flex space-x-2">
      <input
        v-model="newTag"
        @keyup.enter="addTag"
        type="text"
        placeholder="Add a tag..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="addTag"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Add
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
}>()

const tags = ref([...props.modelValue])
const newTag = ref('')

watch(() => props.modelValue, (newVal) => {
  tags.value = [...newVal]
}, { deep: true })

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    emit('update:modelValue', tags.value)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  tags.value = tags.value.filter(t => t !== tag)
  emit('update:modelValue', tags.value)
}
</script>


