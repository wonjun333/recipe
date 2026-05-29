<template>
  <div class="app-shell">
    <TopBarNav :user="currentUser" />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import TopBarNav from './components/TopBarNav.vue'

interface AuthUser {
  loginId: string
  userId: string
  username: string
  deptName: string
  mail: string
  [key: string]: string
}

const currentUser = ref<AuthUser | null>(null)
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f7fb;
}
.app-main {
  padding: 10px 12px 16px;
  box-sizing: border-box;
}
</style>
