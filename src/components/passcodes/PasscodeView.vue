<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">{{ passcodeData.title }}</h3>
    <p v-if="passcodeData.description" class="text-gray-600 mb-4">{{ passcodeData.description }}</p>
    
    <div v-if="showPasscode" class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Passcode</label>
      <div class="flex items-center space-x-2">
        <input
          :type="showPassword ? 'text' : 'password'"
          :value="decryptedPasscode"
          readonly
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
        />
        <button
          @click="showPassword = !showPassword"
          class="px-3 py-2 text-gray-600 hover:text-gray-800"
        >
          {{ showPassword ? '👁️' : '👁️‍🗨️' }}
        </button>
      </div>
    </div>

    <div v-else class="mb-4">
      <button
        @click="requestPasscode"
        :disabled="loading"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Loading...' : 'View Passcode' }}
      </button>
    </div>

    <div class="flex space-x-2">
      <button
        @click="$emit('edit')"
        class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        Edit
      </button>
      <button
        @click="$emit('delete')"
        class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Delete
      </button>
    </div>

    <BiometricPrompt
      :show="showBiometricPrompt"
      @success="handleAuthSuccess"
      @cancel="showBiometricPrompt = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePasscodesStore, type PasscodeData } from '@/stores/passcodes'
import BiometricPrompt from './BiometricPrompt.vue'

const props = defineProps<{
  passcodeData: PasscodeData
}>()

defineEmits<{
  edit: []
  delete: []
}>()

const passcodesStore = usePasscodesStore()
const showPasscode = ref(false)
const showPassword = ref(false)
const decryptedPasscode = ref('')
const loading = ref(false)
const showBiometricPrompt = ref(false)

const requestPasscode = () => {
  showBiometricPrompt.value = true
}

const handleAuthSuccess = async () => {
  try {
    loading.value = true
    const passcode = await passcodesStore.getPasscode(props.passcodeData.id)
    decryptedPasscode.value = passcode
    showPasscode.value = true
    showBiometricPrompt.value = false
  } catch (err) {
    console.error('Failed to get passcode:', err)
    alert('Failed to retrieve passcode')
  } finally {
    loading.value = false
  }
}
</script>


