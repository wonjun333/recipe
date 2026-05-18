import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/recipe-test',
  },
  {
    path: '/recipe',
    redirect: '/recipe-test',
  },
  {
    path: '/recipe-test',
    component: () => import('../features/recipe_test/pages/RecipeTestPage.vue'),
  },
  {
    path: '/history',
    component: () => import('../features/history/pages/MyHistoryPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router