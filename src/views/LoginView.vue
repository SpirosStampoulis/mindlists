<template>
  <AppLayout :show-header="false">
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold text-center mb-8">MindLists</h1>

        <ErrorMessage :message="authStore.error" />

        <div class="space-y-4">
          <div v-if="!showRegister">
            <h2 class="text-xl font-semibold mb-4">Sign In</h2>
            <form @submit.prevent="handleLogin" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  v-model="email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  v-model="password"
                  type="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex items-center">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  id="rememberMe"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="rememberMe" class="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button
                type="submit"
                :disabled="loading"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Sign In
              </button>
            </form>
          </div>

          <div v-else>
            <h2 class="text-xl font-semibold mb-4">Register</h2>
            <form @submit.prevent="handleRegister" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  v-model="email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  v-model="password"
                  type="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                :disabled="loading"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Register
              </button>
            </form>
          </div>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            @click="handleGoogleLogin"
            :disabled="loading"
            class="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>

          <button
            @click="handleAnonymousLogin"
            :disabled="loading"
            class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Continue as Guest
          </button>

          <div class="text-center">
            <button
              @click="showRegister = !showRegister"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              {{ showRegister ? 'Already have an account? Sign in' : "Don't have an account? Register" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import ErrorMessage from '@/components/shared/ErrorMessage.vue'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const showRegister = ref(false)
const loading = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    await authStore.login(email.value, password.value, rememberMe.value)
  } catch (err) {
    console.error('Login failed:', err)
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  try {
    loading.value = true
    await authStore.register(email.value, password.value)
  } catch (err) {
    console.error('Registration failed:', err)
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    loading.value = true
    await authStore.loginWithGoogle(rememberMe.value)
  } catch (err) {
    console.error('Google login failed:', err)
  } finally {
    loading.value = false
  }
}

const handleAnonymousLogin = async () => {
  try {
    loading.value = true
    await authStore.loginAnonymously()
  } catch (err) {
    console.error('Anonymous login failed:', err)
  } finally {
    loading.value = false
  }
}
</script>
