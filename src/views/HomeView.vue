<template>
  <AppLayout>
    <div>
      <h1 class="text-3xl font-bold mb-8">My Lists</h1>
      <ListGrid />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import ListGrid from '@/components/lists/ListGrid.vue'
</script>
