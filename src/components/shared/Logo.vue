<template>
  <div class="flex items-center">
    <img
      :src="iconPath"
      :alt="alt"
      :class="['icon', sizeClass]"
      class="object-contain"
      @error="handleImageError"
    />
    <span v-if="showText" class="ml-2 text-2xl font-bold text-gray-900">
      MindLists
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  showText: false,
  size: 'md',
  alt: 'MindLists Logo'
})

const iconPath = ref('/logo-icon.svg')
const hasError = ref(false)

const handleImageError = () => {
  if (!hasError.value && iconPath.value.endsWith('.svg')) {
    hasError.value = true
    iconPath.value = '/logo-icon.png'
  }
}

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-6 w-6'
    case 'md':
      return 'h-8 w-8'
    case 'lg':
      return 'h-12 w-12'
    default:
      return 'h-8 w-8'
  }
})
</script>

<style scoped>
.icon {
  display: block;
}
</style>

