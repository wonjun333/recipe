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
const samlCallbackParam = 'saml'
const samlCallbackValue = 'callback'

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const cameFromSaml = params.get(samlCallbackParam) === samlCallbackValue
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (res.status === 401) {
      if (cameFromSaml) {
        sessionStorage.removeItem('samlLoginRedirected')
        removeSamlCallbackParam(params)
        return
      }
      if (sessionStorage.getItem('samlLoginRedirected') !== '1') {
        sessionStorage.setItem('samlLoginRedirected', '1')
        window.location.replace('/login')
      }
      return
    }
    if (res.ok) {
      currentUser.value = await res.json()
      sessionStorage.removeItem('samlLoginRedirected')
      if (cameFromSaml) removeSamlCallbackParam(params)
    }
  } catch {
    // 네트워크 오류 시 그냥 미인증 상태 유지
  }
})

function removeSamlCallbackParam(params: URLSearchParams) {
  params.delete(samlCallbackParam)
  const query = params.toString()
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', nextUrl)
}
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
