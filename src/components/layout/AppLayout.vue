<template>
  <div class="min-h-screen bg-gray-50">
    <Header v-if="showHeader" />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'

withDefaults(defineProps<{
  showHeader?: boolean
}>(), {
  showHeader: true
})
</script>

