<template>
  <AppLayout>
    <p class="py-12 text-center text-gray-600">Opening Next list…</p>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = useRouter()

onMounted(() => {
  router.replace('/list/supermarket/saved')
})
</script>
