<template>
  <div class="space-y-4">
    <ItemCard
      v-for="(item, index) in sortedItems"
      :key="item.id"
      :item="item"
      :list-type="listType"
      :draggable="listType === 'fitness'"
      :drag-index="listType === 'fitness' ? index : undefined"
      :is-first="listType === 'fitness' && index === 0"
      :is-last="listType === 'fitness' && index === sortedItems.length - 1"
      @click="handleItemClick(item.id)"
      @move-up="handleMoveUp"
      @move-down="handleMoveDown"
      class="cursor-pointer"
    />
    <div v-if="sortedItems.length === 0" class="text-center py-12 text-gray-500">
      No items found
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ListItem, ListType } from '@/types'
import { sortItems } from '@/utils/sorting'
import ItemCard from './ItemCard.vue'
import { useItemsStore } from '@/stores/items'

const router = useRouter()

const props = defineProps<{
  items: ListItem[]
  listType: ListType
}>()

const itemsStore = useItemsStore()

const sortedItems = computed(() => sortItems(props.items, props.listType))

const handleMoveUp = async (index: number) => {
  if (props.listType !== 'fitness' || index === 0) return
  
  const items = [...sortedItems.value]
  const item = items[index]
  const previousItem = items[index - 1]
  
  await Promise.all([
    itemsStore.update(props.listType, item.id, { order: index - 1 }),
    itemsStore.update(props.listType, previousItem.id, { order: index })
  ])
}

const handleMoveDown = async (index: number) => {
  if (props.listType !== 'fitness' || index === sortedItems.value.length - 1) return
  
  const items = [...sortedItems.value]
  const item = items[index]
  const nextItem = items[index + 1]
  
  await Promise.all([
    itemsStore.update(props.listType, item.id, { order: index + 1 }),
    itemsStore.update(props.listType, nextItem.id, { order: index })
  ])
}

const handleItemClick = (itemId: string) => {
  router.push(`/item/${props.listType}/${itemId}`)
}
</script>




