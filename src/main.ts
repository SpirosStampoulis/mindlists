import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
}).catch((err) => {
  console.error('Failed to initialize auth:', err)
  app.mount('#app')
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({
      type: 'INIT_NOTIFICATION_HANDLERS'
    })
  })

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const { action, data } = event.data
      if (action === 'view' && data?.listType) {
        router.push(`/list/${data.listType}`)
      }
    }
  })
}

