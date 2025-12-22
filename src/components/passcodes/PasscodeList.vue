<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">Passcodes</h2>
      <button
        @click="showCreateForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        + Add Passcode
      </button>
    </div>

    <div v-if="showCreateForm || editingPasscode" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">{{ editingPasscode ? 'Edit Passcode' : 'New Passcode' }}</h3>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              v-model="formData.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Passcode *</label>
            <input
              v-model="formData.passcode"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex space-x-4">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ loading ? 'Saving...' : 'Save' }}
            </button>
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <PasscodeView
        v-for="passcode in passcodes"
        :key="passcode.id"
        :passcode-data="passcode"
        @edit="editPasscode(passcode)"
        @delete="deletePasscode(passcode.id)"
      />
    </div>

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Passcode"
      message="Are you sure you want to delete this passcode?"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { usePasscodesStore, type PasscodeData } from '@/stores/passcodes'
import { useAuthStore } from '@/stores/auth'
import PasscodeView from './PasscodeView.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const passcodesStore = usePasscodesStore()
const authStore = useAuthStore()

const passcodes = ref<PasscodeData[]>([])
const showCreateForm = ref(false)
const editingPasscode = ref<PasscodeData | null>(null)
const showDeleteConfirm = ref(false)
const deletingPasscodeId = ref<string | null>(null)
const loading = ref(false)

const formData = ref({
  title: '',
  description: '',
  passcode: ''
})

onMounted(() => {
  passcodesStore.init()
  subscribeToPasscodes()
})

const subscribeToPasscodes = () => {
  if (!authStore.userId) return

  const passcodesRef = collection(db, `users/${authStore.userId}/passcodes`)
  onSnapshot(passcodesRef, (snapshot) => {
    passcodes.value = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      passcodes.value.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        passcode: '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || ''
      })
    })
  })
}

const handleSubmit = async () => {
  try {
    loading.value = true
    if (editingPasscode.value) {
      await passcodesStore.updatePasscode(
        editingPasscode.value.id,
        formData.value.title,
        formData.value.description,
        formData.value.passcode
      )
    } else {
      await passcodesStore.createPasscode(
        formData.value.title,
        formData.value.description,
        formData.value.passcode
      )
    }
    handleCancel()
  } catch (err) {
    console.error('Failed to save passcode:', err)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  showCreateForm.value = false
  editingPasscode.value = null
  formData.value = {
    title: '',
    description: '',
    passcode: ''
  }
}

const editPasscode = (passcode: PasscodeData) => {
  editingPasscode.value = passcode
  formData.value = {
    title: passcode.title,
    description: passcode.description || '',
    passcode: ''
  }
}

const deletePasscode = (passcodeId: string) => {
  deletingPasscodeId.value = passcodeId
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!deletingPasscodeId.value) return

  try {
    await passcodesStore.deletePasscode(deletingPasscodeId.value)
  } catch (err) {
    console.error('Failed to delete passcode:', err)
  } finally {
    showDeleteConfirm.value = false
    deletingPasscodeId.value = null
  }
}
</script>





