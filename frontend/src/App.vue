<template>
  <div class="app-shell">
    <TopBarNav :user="currentUser" />
    <main class="app-main">
      <RouterView v-if="ready" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, ref } from 'vue'
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
const ready = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/api/auth/me')
    if (res.status === 401) {
      // Node.js SAML 서버로 리다이렉트 (MOCK_MODE에서는 자동 로그인 후 돌아옴)
      window.location.href = `${window.location.protocol}//${window.location.hostname}:44364/`
      return
    }
    currentUser.value = await res.json()
  } catch {
    window.location.href = '/api/auth/login'
  }
  ready.value = true
})
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
