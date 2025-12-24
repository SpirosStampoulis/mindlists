<template>
  <div class="flex space-x-2 mb-4 overflow-x-auto">
    <button
      v-for="filter in filters"
      :key="filter.value"
      @click="$emit('update:modelValue', filter.value)"
      :class="[
        'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
        modelValue === filter.value
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      ]"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type SupermarketFilterType = 'all' | 'pavi' | 'lidl' | 'spar'

const props = defineProps<{
  modelValue: SupermarketFilterType
}>()

const filters = computed(() => [
  { value: 'all' as SupermarketFilterType, label: 'All' },
  { value: 'pavi' as SupermarketFilterType, label: 'Pavi' },
  { value: 'lidl' as SupermarketFilterType, label: 'Lidl' },
  { value: 'spar' as SupermarketFilterType, label: 'Spar' }
])

defineEmits<{
  'update:modelValue': [value: SupermarketFilterType]
}>()
</script>

