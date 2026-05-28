<template>
  <div class="app-shell">
    <TopBarNav :user="currentUser" />
    <main class="app-main">
      <div v-if="backendDown" class="backend-error">
        백엔드 서버에 연결할 수 없습니다.<br>
        <code>PYTHONPATH=. uvicorn app.main:app --port 8000 --reload</code>
      </div>
      <RouterView v-else-if="ready" />
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
const backendDown = ref(false)

const SAML_PORT = 44364

onMounted(async () => {
  // 1단계: mock 여부 확인 (인증 불필요 엔드포인트)
  let mockMode = false
  try {
    const cfg = await fetch('/api/auth/config')
    if (cfg.ok) {
      const data = await cfg.json()
      mockMode = !!data.mockMode
    }
  } catch {
    // 백엔드 자체가 응답 없음
    backendDown.value = true
    ready.value = true
    return
  }

  // 2단계: 사용자 정보 조회
  try {
    const res = await fetch('/api/auth/me')
    if (res.ok) {
      currentUser.value = await res.json()
    } else if (res.status === 401) {
      if (mockMode) {
        // mock 모드에서는 SAML 리다이렉트 없음 — 백엔드 응답 이상
        backendDown.value = true
      } else {
        // 운영 모드: Node.js SAML 서버로 로그인 리다이렉트
        window.location.href =
          `${window.location.protocol}//${window.location.hostname}:${SAML_PORT}/`
        return
      }
    }
  } catch {
    backendDown.value = true
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
.backend-error {
  margin: 60px auto;
  max-width: 480px;
  padding: 24px 28px;
  background: #fff;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  color: #7f1d1d;
  font-size: 14px;
  line-height: 2;
  text-align: center;
}
.backend-error code {
  display: block;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 12px;
  color: #1e293b;
  word-break: break-all;
}
</style>
