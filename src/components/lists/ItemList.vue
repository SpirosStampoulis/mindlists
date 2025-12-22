<template>
  <div class="space-y-4">
    <ItemCard
      v-for="item in sortedItems"
      :key="item.id"
      :item="item"
      :list-type="listType"
      @click="$router.push(`/item/${listType}/${item.id}`)"
      class="cursor-pointer"
    />
    <div v-if="sortedItems.length === 0" class="text-center py-12 text-gray-500">
      No items found
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ListItem, ListType } from '@/types'
import { sortItems } from '@/utils/sorting'
import ItemCard from './ItemCard.vue'

const props = defineProps<{
  items: ListItem[]
  listType: ListType
}>()

const sortedItems = computed(() => sortItems(props.items))
</script>




