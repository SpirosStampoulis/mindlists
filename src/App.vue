<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()

onMounted(async () => {
  await notificationsStore.checkPermission()
})
</script>



