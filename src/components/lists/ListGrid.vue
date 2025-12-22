<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <ListTile
      v-for="listType in listTypes"
      :key="listType"
      :list-type="listType"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { ListType } from '@/types'
import ListTile from './ListTile.vue'
import { useListsStore } from '@/stores/lists'

const listTypes = Object.values(ListType)
const listsStore = useListsStore()

onMounted(() => {
  listsStore.subscribeToAllLists()
})

onUnmounted(() => {
  listsStore.unsubscribeAll()
})
</script>





