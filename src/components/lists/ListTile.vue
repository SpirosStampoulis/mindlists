<template>
  <router-link
    :to="`/list/${config.type}`"
    class="block p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
    :style="{ backgroundColor: config.color + '20', borderColor: config.color }"
    :class="`border-2`"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-4xl">{{ config.icon }}</span>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">{{ config.name }}</h3>
          <p class="text-sm text-gray-600">{{ itemCount }} items</p>
        </div>
      </div>
      <div v-if="expiringCount > 0" class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
        {{ expiringCount }}
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ListType } from '@/types'
import { LIST_TYPE_CONFIGS } from '@/types'
import { useListsStore } from '@/stores/lists'

const props = defineProps<{
  listType: ListType
}>()

const listsStore = useListsStore()
const config = LIST_TYPE_CONFIGS[props.listType]

const itemCount = computed(() => listsStore.getItemCount(props.listType))
const expiringCount = computed(() => listsStore.getExpiringCount(props.listType))
</script>




