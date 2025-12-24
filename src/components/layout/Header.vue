<template>
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <router-link to="/">
            <Logo :show-text="true" size="md" />
          </router-link>
        </div>
        <div class="flex items-center space-x-4">
          <div v-if="authStore.user" class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">{{ authStore.user.email || 'Anonymous' }}</span>
            <button
              @click="handleSignOut"
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Logo from '@/components/shared/Logo.vue'

const authStore = useAuthStore()

const handleSignOut = async () => {
  await authStore.signOut()
}
</script>





