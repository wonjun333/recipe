<template>
  <header class="topbar">
    <div class="brand">Recipe Master</div>

    <nav class="nav-center">
      <RouterLink to="/recipe-test" class="nav-item">AMAT</RouterLink>
      <RouterLink to="/recipe-test-ebara" class="nav-item">Ebara</RouterLink>
    </nav>

    <nav class="nav-right">
      <RouterLink to="/history" class="nav-item">My History</RouterLink>

      <div v-if="user" class="avatar-wrap" ref="avatarWrapRef">
        <button class="avatar-btn" @click="toggleDropdown" :aria-expanded="dropdownOpen">
          {{ avatarLetter }}
        </button>

        <Transition name="dropdown">
          <div v-if="dropdownOpen" class="dropdown" @click.stop>
            <div class="dropdown-greeting">안녕하세요 <strong>{{ user.username }}</strong>님.</div>
            <hr class="dropdown-divider" />
            <button class="dropdown-item" @click="openSettings">설정</button>
            <a href="/Signout" class="dropdown-item logout-item">로그아웃</a>
          </div>
        </Transition>
      </div>
    </nav>
  </header>

  <!-- Settings Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="settingsOpen" class="modal-backdrop" @click.self="closeSettings">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div class="modal-header">
            <span id="settings-title" class="modal-title">사용자 설정</span>
            <button class="modal-close" @click="closeSettings">✕</button>
          </div>
          <div class="modal-body">
            <label class="setting-field">
              <span class="setting-label">Line</span>
              <select v-model="draftLine" class="setting-select">
                <option value="">(선택 안함)</option>
                <option v-for="v in lineOptions" :key="v" :value="v">{{ v }}</option>
              </select>
            </label>
            <label class="setting-field">
              <span class="setting-label">분임조</span>
              <select v-model="draftTeam" class="setting-select">
                <option value="">(선택 안함)</option>
                <option v-for="v in filteredTeamOptions" :key="v" :value="v">{{ v }}</option>
              </select>
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeSettings">취소</button>
            <button class="btn-save" :disabled="saving" @click="saveSettings">
              {{ saving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink } from 'vue-router'

interface AuthUser {
  username: string
  loginId: string
  userId: string
  deptName: string
  [key: string]: string
}

const props = defineProps<{ user: AuthUser | null }>()

const dropdownOpen = ref(false)
const avatarWrapRef = ref<HTMLElement | null>(null)

const settingsOpen = ref(false)
const lineOptions = ref<string[]>([])
const teamOptions = ref<string[]>([])
const draftLine = ref('')
const draftTeam = ref('')
const saving = ref(false)

const avatarLetter = computed(() => {
  const id = props.user?.loginId ?? ''
  return id ? id[0].toUpperCase() : '?'
})

const filteredTeamOptions = computed(() => {
  if (!draftLine.value) return teamOptions.value
  return teamOptions.value
})

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown() {
  dropdownOpen.value = false
}

function handleOutsideClick(e: MouseEvent) {
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

async function openSettings() {
  closeDropdown()
  await loadOptions()
  await loadCurrentPreferences()
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

async function loadOptions() {
  try {
    const res = await fetch('/api/recipe-test/eqp-options')
    if (res.ok) {
      const data = await res.json()
      lineOptions.value = data.lineOptions ?? []
      teamOptions.value = data.teamOptions ?? []
    }
  } catch { /* ignore */ }
}

async function loadCurrentPreferences() {
  try {
    const res = await fetch('/api/user/preferences')
    if (res.ok) {
      const data = await res.json()
      draftLine.value = data.line ?? ''
      draftTeam.value = data.team ?? ''
    }
  } catch { /* ignore */ }
}

async function saveSettings() {
  saving.value = true
  try {
    await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: draftLine.value, team: draftTeam.value }),
    })
    closeSettings()
  } catch { /* ignore */ } finally {
    saving.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
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
  gap: 4px;
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

/* Avatar */
.avatar-wrap {
  position: relative;
}
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

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  z-index: 100;
  overflow: hidden;
}
.dropdown-greeting {
  padding: 12px 16px 10px;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.4;
}
.dropdown-divider {
  margin: 0;
  border: none;
  border-top: 1px solid #f1f5f9;
}
.dropdown-item {
  display: block;
  width: 100%;
  padding: 9px 16px;
  text-align: left;
  font-size: 13px;
  color: #334155;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background .1s;
}
.dropdown-item:hover { background: #f8fafc; }
.logout-item { color: #dc2626; }

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity .12s, transform .12s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

/* Modal backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal-box {
  background: #fff;
  border-radius: 14px;
  width: 340px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}
.modal-close {
  background: none;
  border: none;
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }
.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.setting-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.setting-label {
  font-size: 12px;
  font-weight: 700;
  color: #4b5563;
}
.setting-select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #cfd6e4;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #1e293b;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #f1f5f9;
}
.btn-cancel {
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
}
.btn-cancel:hover { background: #f8fafc; }
.btn-save {
  height: 32px;
  padding: 0 18px;
  border-radius: 8px;
  border: none;
  background: #007acc;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.btn-save:hover { background: #005fa3; }
.btn-save:disabled { opacity: .6; cursor: not-allowed; }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-box, .modal-leave-active .modal-box { transition: transform .15s; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(.95); }
</style>
