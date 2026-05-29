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
import { ref, onMounted } from 'vue'
import TopBarNav from './components/TopBarNav.vue'

interface AuthUser {
  LoginId: string
  Username: string
  DeptName: string
  Mail: string
  [key: string]: string
}

const currentUser = ref<AuthUser | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (res.status === 401) {
      const samlUrl = import.meta.env.VITE_SAML_URL
      if (samlUrl) window.location.href = samlUrl
      return
    }
    if (res.ok) {
      currentUser.value = await res.json()
    }
  } catch {
    // 네트워크 오류 시 그냥 미인증 상태 유지
  }
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
