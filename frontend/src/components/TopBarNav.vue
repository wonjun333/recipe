<template>
  <header class="topbar">
    <div class="brand">Recipe Master</div>

    <nav class="nav-center">
      <RouterLink to="/recipe-test" class="nav-item">AMAT</RouterLink>
    </nav>

    <nav class="nav-right">
      <RouterLink to="/history" class="nav-item">My History</RouterLink>
      <div class="user-menu" ref="userMenuEl">
        <button
          class="avatar-btn"
          type="button"
          :title="userTitle"
          @click="menuOpen = !menuOpen"
        >
          <span class="avatar-mark">{{ avatarLetter }}</span>
          <span class="avatar-copy">
            <span class="avatar-name">{{ displayName }}</span>
            <span class="avatar-meta">{{ topbarMeta }}</span>
          </span>
        </button>
        <div v-if="menuOpen" class="user-panel">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-id">{{ topbarMeta }}</div>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface AuthUser {
  LoginId: string
  Username: string
  DisplayName?: string
  DeptName?: string
  Mail?: string
  MailAccount?: string
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
const userMenuEl = ref<HTMLElement | null>(null)

function onOutsideClick(e: MouseEvent) {
  if (menuOpen.value && userMenuEl.value && !userMenuEl.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onOutsideClick, true))
onBeforeUnmount(() => document.removeEventListener('click', onOutsideClick, true))

const avatarLetter = computed(() => {
  const seed = props.user?.Username || props.user?.LoginId || ''
  return seed ? seed[0].toUpperCase() : '?'
})

const displayName = computed(() => props.user?.DisplayName || props.user?.Username || props.user?.LoginId || '로그인 필요')
const mailAccount = computed(() => {
  const explicit = props.user?.MailAccount
  if (explicit) return explicit
  const mail = props.user?.Mail || ''
  return mail.includes('@') ? mail.split('@')[0] : mail
})
const topbarMeta = computed(() => {
  if (!props.user) return '미인증'
  return [props.user.DeptName, mailAccount.value].filter(Boolean).join(' / ') || props.user.LoginId || '미인증'
})
const userTitle = computed(() => {
  if (!props.user) return '로그인 정보 없음'
  return `${displayName.value} (${topbarMeta.value})`
})

const visibleUserFields = computed(() => {
  const user = props.user
  if (!user) return []
  return [
    ['부서', user.DeptName],
    ['메일 ID', mailAccount.value],
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
  min-width: 32px;
  height: 36px;
  max-width: 260px;
  border-radius: 999px;
  border: 1px solid #bfd3e8;
  background: #fff;
  color: #0f172a;
  padding: 2px 10px 2px 2px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  transition: background .14s, border-color .14s;
}
.avatar-btn:hover {
  background: #f4f8fc;
  border-color: #8fb8dc;
}
.avatar-mark {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 50%;
  background: #007acc;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
}
.avatar-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}
.avatar-name,
.avatar-meta {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.avatar-name {
  font-size: 12px;
  font-weight: 800;
}
.avatar-meta {
  margin-top: 2px;
  font-size: 10px;
  color: #64748b;
  font-weight: 700;
}

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

@media (max-width: 760px) {
  .avatar-btn {
    width: 32px;
    height: 32px;
    padding: 1px;
  }
  .avatar-copy {
    display: none;
  }
}
</style>
