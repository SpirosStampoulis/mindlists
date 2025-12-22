<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      <div
        v-for="day in daysOfWeek"
        :key="day.value"
        class="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
      >
        <h3 class="font-semibold text-lg mb-3 capitalize">{{ day.label }}</h3>
        <div v-if="getDayMeal(day.value)" class="space-y-3">
          <div v-if="getDayMeal(day.value)?.meals?.breakfast" class="text-sm">
            <span class="font-medium text-gray-700">Breakfast:</span>
            <p class="text-gray-600 mt-1">{{ getDayMeal(day.value)?.meals?.breakfast }}</p>
          </div>
          <div v-if="getDayMeal(day.value)?.meals?.lunch" class="text-sm">
            <span class="font-medium text-gray-700">Lunch:</span>
            <p class="text-gray-600 mt-1">{{ getDayMeal(day.value)?.meals?.lunch }}</p>
          </div>
          <div v-if="getDayMeal(day.value)?.meals?.dinner" class="text-sm">
            <span class="font-medium text-gray-700">Dinner:</span>
            <p class="text-gray-600 mt-1">{{ getDayMeal(day.value)?.meals?.dinner }}</p>
          </div>
          <div v-if="getDayMeal(day.value)?.meals?.snacks" class="text-sm">
            <span class="font-medium text-gray-700">Snacks:</span>
            <p class="text-gray-600 mt-1">{{ getDayMeal(day.value)?.meals?.snacks }}</p>
          </div>
          <button
            @click="editDay(day.value)"
            class="w-full mt-3 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Edit
          </button>
        </div>
        <button
          v-else
          @click="addDay(day.value)"
          class="w-full mt-3 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          + Add Meals
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ListItem } from '@/types'

const props = defineProps<{
  items: ListItem[]
}>()

const router = useRouter()

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
] as const

const getDayMeal = (dayOfWeek: string) => {
  return props.items.find(item => item.dayOfWeek === dayOfWeek)
}

const addDay = (dayOfWeek: string) => {
  router.push(`/item/diet?dayOfWeek=${dayOfWeek}`)
}

const editDay = (dayOfWeek: string) => {
  const item = getDayMeal(dayOfWeek)
  if (item) {
    router.push(`/item/diet/${item.id}`)
  }
}
</script>

