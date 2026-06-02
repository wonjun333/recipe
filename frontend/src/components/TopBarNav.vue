<template>
  <header class="topbar">
    <div class="brand">Recipe Master</div>

    <nav class="nav-center">
      <RouterLink to="/recipe-test" class="nav-item">AMAT</RouterLink>
      <RouterLink to="/recipe-test-ebara" class="nav-item">Ebara</RouterLink>
    </nav>

    <nav class="nav-right">
      <RouterLink to="/history" class="nav-item">My History</RouterLink>
      <div class="user-menu">
        <button
          class="avatar-btn"
          type="button"
          :title="userTitle"
          @click="menuOpen = !menuOpen"
        >
          {{ avatarLetter }}
        </button>
        <div v-if="menuOpen" class="user-panel">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-id">{{ props.user?.LoginId || '미인증' }}</div>
          <dl class="user-details">
            <template v-for="item in visibleUserFields" :key="item.label">
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </template>
          </dl>
          <button class="logout-btn" type="button" @click="logout">로그아웃</button>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface AuthUser {
  LoginId: string
  Username: string
  DeptName?: string
  Mail?: string
  CompId?: string
  DeptId?: string
  Sabun?: string
  UserId?: string
  GrdName?: string
  Mobile?: string
  [key: string]: string | undefined
}

const props = defineProps<{ user: AuthUser | null }>()
const menuOpen = ref(false)

const avatarLetter = computed(() => {
  const seed = props.user?.Username || props.user?.LoginId || ''
  return seed ? seed[0].toUpperCase() : '?'
})

const displayName = computed(() => props.user?.Username || props.user?.LoginId || '로그인 필요')
const userTitle = computed(() => {
  if (!props.user) return '로그인 정보 없음'
  return `${displayName.value} (${props.user.LoginId || props.user.UserId || '-'})`
})

const visibleUserFields = computed(() => {
  const user = props.user
  if (!user) return []
  return [
    ['부서', user.DeptName],
    ['직급', user.GrdName],
    ['메일', user.Mail],
    ['사번', user.Sabun],
    ['회사', user.CompId],
    ['부서 ID', user.DeptId],
    ['사용자 ID', user.UserId],
    ['휴대전화', user.Mobile],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label: String(label), value: String(value) }))
})

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  } finally {
    window.location.href = '/'
  }
}
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 50px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 14px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, .96);
  border-bottom: 1px solid #d8dee9;
  backdrop-filter: blur(10px);
}
.brand {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  white-space: nowrap;
}
.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.nav-item {
  text-decoration: none;
  color: #334155;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  transition: background-color .14s ease, color .14s ease;
  white-space: nowrap;
}
.nav-item:hover { background: #eef3fb; }
.nav-item.router-link-active { background: #007acc; color: #fff; }

.avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #007acc;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .14s;
}
.avatar-btn:hover { background: #005fa3; }

.user-menu {
  position: relative;
}
.user-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: min(300px, calc(100vw - 24px));
  padding: 12px;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #d8dee9;
  border-radius: 8px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, .16);
}
.user-name {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}
.user-id {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}
.user-details {
  margin: 10px 0 0;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 6px 8px;
  font-size: 12px;
}
.user-details dt {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}
.user-details dd {
  margin: 0;
  color: #111827;
  min-width: 0;
  overflow-wrap: anywhere;
}
.logout-btn {
  width: 100%;
  margin-top: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  padding: 7px 10px;
  cursor: pointer;
}
.logout-btn:hover {
  background: #f8fafc;
}
</style>
