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
  DisplayName?: string
  DeptName?: string
  Mail?: string
  MailAccount?: string
  [key: string]: string | undefined
}

const currentUser = ref<AuthUser | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (res.status === 401) {
      if (sessionStorage.getItem('samlLoginRedirected') !== '1') {
        sessionStorage.setItem('samlLoginRedirected', '1')
        window.location.href = '/login'
      }
      return
    }
    if (res.ok) {
      currentUser.value = await res.json()
      sessionStorage.removeItem('samlLoginRedirected')
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
