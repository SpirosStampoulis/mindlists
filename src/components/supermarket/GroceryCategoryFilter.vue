<template>
  <div class="mb-4">
    <p class="text-sm text-gray-600 mb-2">
      Filter by product type (meat, drinks, produce, etc.).
      <span class="text-gray-500">“No category”</span> is for items not classified yet — edit the item or adjust them on receipt import.
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        type="button"
        @click="$emit('update:modelValue', opt.value)"
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          modelValue === opt.value
            ? 'bg-emerald-700 text-white shadow-sm'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        ]"
      >
        <span>{{ opt.label }}</span>
        <span
          :class="[
            'tabular-nums text-xs rounded px-1.5 py-0.5',
            modelValue === opt.value ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
          ]"
        >
          {{ opt.count }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ListItem } from '@/types'
import { GROCERY_FILTER_UNCATEGORIZED } from '@/utils/sorting'
import { GROCERY_PRESETS, groceryLabel } from '@/utils/groceryCategories'

const props = defineProps<{
  modelValue: string
  items: ListItem[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const presetOrder = GROCERY_PRESETS.map((p) => p.id)

const filterOptions = computed(() => {
  const list = props.items || []
  const allCount = list.length
  const opts: { value: string; label: string; count: number }[] = [
    { value: 'all', label: 'All types', count: allCount }
  ]

  const uncategorized = list.filter((i) => !i.groceryCategory?.trim()).length
  if (uncategorized > 0) {
    opts.push({
      value: GROCERY_FILTER_UNCATEGORIZED,
      label: 'No category',
      count: uncategorized
    })
  }

  const counts = new Map<string, number>()
  for (const it of list) {
    const raw = it.groceryCategory?.trim()
    if (!raw) continue
    const key = raw.toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const keys = [...counts.keys()].sort((a, b) => {
    const ia = presetOrder.indexOf(a)
    const ib = presetOrder.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return groceryLabel(a).localeCompare(groceryLabel(b), undefined, { sensitivity: 'base' })
  })

  for (const id of keys) {
    opts.push({
      value: id,
      label: groceryLabel(id),
      count: counts.get(id) || 0
    })
  }

  return opts
})
</script>
