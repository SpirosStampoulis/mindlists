<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">Biometric Authentication Required</h3>
      <p class="text-gray-600 mb-6">Please authenticate to view this passcode</p>
      <div class="flex justify-end space-x-3">
        <button
          @click="handleAuthenticate"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Authenticating...' : 'Authenticate' }}
        </button>
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePasscodesStore } from '@/stores/passcodes'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const passcodesStore = usePasscodesStore()
const loading = ref(false)

const handleAuthenticate = async () => {
  try {
    loading.value = true
    const success = await passcodesStore.authenticateWithWebAuthn()
    if (success) {
      emit('success')
    } else {
      alert('Authentication failed. Please try again.')
    }
  } catch (err) {
    console.error('Authentication error:', err)
    alert('Authentication failed. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>





