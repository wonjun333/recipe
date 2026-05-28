import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/recipe-test',
  },
  {
    path: '/recipe-test',
    component: () => import('../features/recipe_test/pages/RecipeTestPage.vue'),
  },
  {
    path: '/recipe-test-ebara',
    component: () => import('../features/recipe_ebara/pages/EbaraPage.vue'),
  },
  {
    path: '/history',
    component: () => import('../features/history/pages/MyHistoryPage.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
