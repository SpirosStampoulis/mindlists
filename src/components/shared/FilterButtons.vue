<template>
  <div class="flex space-x-2 mb-4 overflow-x-auto">
    <button
      v-for="filter in filters"
      :key="filter.value"
      @click="$emit('update:modelValue', filter.value)"
      :class="[
        'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
        modelValue === filter.value
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      ]"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FilterType, ListType } from '@/types'

const props = defineProps<{
  modelValue: FilterType
  listType?: ListType
}>()

const filters = computed(() => {
  if (props.listType === 'games') {
    return [
      { value: 'all' as FilterType, label: 'All' },
      { value: 'will-play' as FilterType, label: 'Will Play' },
      { value: 'played' as FilterType, label: 'Played' }
    ]
  }
  return [
    { value: 'all' as FilterType, label: 'All' },
    { value: 'active' as FilterType, label: 'Active' },
    { value: 'expiring' as FilterType, label: 'Expiring' },
    { value: 'expired' as FilterType, label: 'Expired' }
  ]
})

defineEmits<{
  'update:modelValue': [value: FilterType]
}>()
</script>


