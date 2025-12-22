import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/list/:type',
    name: 'list',
    component: () => import('@/views/ListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/list/supermarket/saved',
    name: 'saved-lists',
    component: () => import('@/views/SavedListsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/list/supermarket/saved/:id',
    name: 'saved-list-detail',
    component: () => import('@/views/SavedListDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/item/:listType/:itemId?',
    name: 'item',
    component: () => import('@/views/ItemView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  if (authStore.loading) {
    next()
    return
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router

