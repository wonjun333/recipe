<template>
  <section class="ebara-page">

    <!-- 설비 선택 헤더 -->
    <div class="page-header">
      <span class="page-title">Ebara Recipe Editor</span>
      <div class="header-controls">
        <label class="hdr-field">
          <span class="hdr-label">Line</span>
          <select class="hdr-select" v-model="line" @change="onLineChange">
            <option value="">(전체)</option>
            <option v-for="v in lineOptions" :key="v" :value="v">{{ v }}</option>
          </select>
        </label>
        <label class="hdr-field">
          <span class="hdr-label">분임조</span>
          <select class="hdr-select" v-model="team" @change="onTeamChange">
            <option value="">(전체)</option>
            <option v-for="v in filteredTeamOptions" :key="v" :value="v">{{ v }}</option>
          </select>
        </label>
        <label class="hdr-field">
          <span class="hdr-label">설비 ID</span>
          <select class="hdr-select" v-model="eqpId">
            <option value="">(선택 안함)</option>
            <option v-for="v in filteredEqpOptions" :key="v" :value="v">{{ v }}</option>
          </select>
        </label>
        <button class="hdr-btn" :disabled="!eqpId || loadingFiles" @click="loadFiles">
          {{ loadingFiles ? 'Loading...' : 'Load' }}
        </button>
      </div>
    </div>

    <!-- 레시피 에디터 -->
    <div class="recipe-editor">

      <div class="toolbar">
        <button class="btn-tool" :disabled="!selectedFile" @click="addRow">Add</button>
        <button class="btn-tool" :disabled="!selectedFile || selectedRowIdx < 0" @click="insertRow">Insert</button>
        <button class="btn-tool" :disabled="!selectedFile || selectedRowIdx < 0" @click="deleteRow">Delete</button>
        <div class="toolbar-sep"></div>
        <button class="btn-tool btn-save" :disabled="!dirty || saving" @click="saveRecipe">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <span v-if="saveMsg" class="save-msg">{{ saveMsg }}</span>
      </div>

      <div class="main-container">

        <!-- 트리 패널 (레시피 목록) -->
        <aside class="tree-panel">
          <div v-if="!files.length" class="tree-empty">설비를 선택 후 Load</div>
          <div
            v-for="f in files"
            :key="f.name"
            class="tree-item"
            :class="{ selected: f.name === selectedFile }"
            @click="selectFile(f.name)"
          >{{ f.name }}</div>
        </aside>

        <!-- 컨텐츠 패널 -->
        <main class="content-panel">
          <template v-if="selectedFile">
            <div class="input-group">
              <label>Recipe Name</label>
              <input type="text" v-model="editingName" class="recipe-name-input" />
              <button class="btn-action" :disabled="renameBusy" @click="doRename">Rename</button>
            </div>

            <div v-if="loadingRecipe" class="loading-msg">Loading...</div>
            <table v-else class="data-table">
              <thead>
                <tr>
                  <th class="col-idx">#</th>
                  <th class="col-item">Item</th>
                  <th class="col-unit">Unit</th>
                  <th class="col-data">Data</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in rows"
                  :key="i"
                  :class="{ 'row-selected': i === selectedRowIdx }"
                  @click="selectedRowIdx = i"
                >
                  <td class="col-idx">{{ i + 1 }}</td>
                  <td class="col-item">{{ row.item }}</td>
                  <td class="col-unit">{{ row.unit }}</td>
                  <td class="col-data">
                    <input
                      class="data-input"
                      v-model="row.data"
                      @focus="selectedRowIdx = i"
                      @input="dirty = true"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
          <div v-else class="content-empty">레시피를 선택하세요.</div>
        </main>

      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ebaraApi, type RecipeFile, type RecipeRow } from '../api/ebaraApi'

// ─── 설비 선택 상태 ───────────────────────────────────────────────
const line   = ref('')
const team   = ref('')
const eqpId  = ref('')

const allItems     = ref<{ line: string; team: string; eqpId: string }[]>([])
const lineOptions  = computed(() => sorted(allItems.value.map(x => x.line)))
const filteredTeamOptions = computed(() => {
  const src = line.value
    ? allItems.value.filter(x => x.line === line.value)
    : allItems.value
  return sorted(src.map(x => x.team))
})
const filteredEqpOptions = computed(() => {
  let src = allItems.value
  if (line.value)  src = src.filter(x => x.line === line.value)
  if (team.value)  src = src.filter(x => x.team === team.value)
  return sorted(src.map(x => x.eqpId))
})

function sorted(arr: string[]): string[] {
  return [...new Set(arr)].sort()
}

function onLineChange() {
  team.value  = ''
  eqpId.value = ''
  clearEditor()
}
function onTeamChange() {
  eqpId.value = ''
  clearEditor()
}

// ─── 레시피 파일 목록 ──────────────────────────────────────────────
const files        = ref<RecipeFile[]>([])
const loadingFiles = ref(false)

async function loadFiles() {
  if (!eqpId.value) return
  loadingFiles.value = true
  clearEditor()
  try {
    files.value = await ebaraApi.getFiles(eqpId.value)
  } catch { files.value = [] }
  finally { loadingFiles.value = false }
}

// ─── 레시피 내용 ───────────────────────────────────────────────────
const selectedFile  = ref('')
const editingName   = ref('')
const rows          = ref<RecipeRow[]>([])
const selectedRowIdx = ref(-1)
const loadingRecipe = ref(false)
const dirty         = ref(false)

function clearEditor() {
  files.value      = []
  selectedFile.value = ''
  editingName.value  = ''
  rows.value         = []
  selectedRowIdx.value = -1
  dirty.value        = false
}

async function selectFile(name: string) {
  if (selectedFile.value === name) return
  selectedFile.value   = name
  editingName.value    = name
  selectedRowIdx.value = -1
  dirty.value          = false
  loadingRecipe.value  = true
  try {
    const res = await ebaraApi.getRecipe(eqpId.value, name)
    rows.value = res.rows.map(r => ({ ...r }))
  } catch { rows.value = [] }
  finally { loadingRecipe.value = false }
}

// ─── 행 편집 ──────────────────────────────────────────────────────
function addRow() {
  rows.value.push({ item: '', unit: '', data: '' })
  selectedRowIdx.value = rows.value.length - 1
  dirty.value = true
}

function insertRow() {
  const idx = selectedRowIdx.value < 0 ? 0 : selectedRowIdx.value
  rows.value.splice(idx, 0, { item: '', unit: '', data: '' })
  selectedRowIdx.value = idx
  dirty.value = true
}

function deleteRow() {
  if (selectedRowIdx.value < 0 || !rows.value.length) return
  rows.value.splice(selectedRowIdx.value, 1)
  selectedRowIdx.value = Math.min(selectedRowIdx.value, rows.value.length - 1)
  dirty.value = true
}

// ─── 저장 / 이름 변경 ─────────────────────────────────────────────
const saving   = ref(false)
const saveMsg  = ref('')

async function saveRecipe() {
  if (!selectedFile.value) return
  saving.value = true
  saveMsg.value = ''
  try {
    await ebaraApi.saveRecipe(eqpId.value, selectedFile.value, rows.value)
    dirty.value   = false
    saveMsg.value = '저장 완료'
    setTimeout(() => { saveMsg.value = '' }, 2000)
  } catch {
    saveMsg.value = '저장 실패'
  } finally { saving.value = false }
}

const renameBusy = ref(false)

async function doRename() {
  const newName = editingName.value.trim()
  if (!newName || newName === selectedFile.value) return
  renameBusy.value = true
  try {
    await ebaraApi.renameRecipe(eqpId.value, selectedFile.value, newName)
    const f = files.value.find(x => x.name === selectedFile.value)
    if (f) f.name = newName
    selectedFile.value  = newName
    editingName.value   = newName
  } catch { editingName.value = selectedFile.value }
  finally { renameBusy.value = false }
}

// ─── 마운트 ───────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const opts = await ebaraApi.getEqpOptions()
    allItems.value = opts.items
  } catch {}
  try {
    const res = await fetch('/api/user/preferences')
    if (res.ok) {
      const prefs = await res.json()
      if (prefs.line) line.value = prefs.line
      if (prefs.team) team.value = prefs.team
    }
  } catch {}
})
</script>

<style scoped>
/* ── CSS 변수 ─────────────────────────────────────────── */
:root {
  --color-bg-main:       #f0f0f0;
  --color-bg-panel:      #ffffff;
  --color-bg-header:     #eaeaea;
  --color-border:        #b0b0b0;
  --color-primary-text:  #000000;
  --color-secondary-text:#666666;
  --color-accent:        #3399ff;
  --color-disabled:      #e0e0e0;
  --font-size-base:      12px;
  --spacing-tight:       2px;
  --spacing-normal:      5px;
  --border-width:        1px;
}

/* ── 페이지 전체 ──────────────────────────────────────── */
.ebara-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f0f0;
  font-family: 'Gulim', sans-serif;
  font-size: 12px;
  color: #000000;
}

/* ── 상단 설비 선택 헤더 ──────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: #eaeaea;
  border-bottom: 1px solid #b0b0b0;
  flex-shrink: 0;
}
.page-title {
  font-size: 13px;
  font-weight: bold;
  color: #000;
  white-space: nowrap;
  margin-right: 8px;
}
.header-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.hdr-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.hdr-label {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}
.hdr-select {
  height: 22px;
  padding: 0 4px;
  border: 1px solid #b0b0b0;
  background: #fff;
  font-size: 12px;
  min-width: 100px;
}
.hdr-btn {
  height: 22px;
  padding: 0 10px;
  border: 1px solid #b0b0b0;
  background: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
}
.hdr-btn:hover:not(:disabled) { background: #d0d0d0; }
.hdr-btn:disabled { color: #999; cursor: default; }

/* ── 레시피 에디터 전체 ───────────────────────────────── */
.recipe-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background-color: #f0f0f0;
}

/* ── 툴바 ─────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #b0b0b0;
  flex-shrink: 0;
}
.toolbar-sep {
  width: 1px;
  height: 16px;
  background: #b0b0b0;
  margin: 0 2px;
}
.btn-tool {
  background: #f0f0f0;
  border: 1px solid #b0b0b0;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
  font-family: 'Gulim', sans-serif;
}
.btn-tool:hover:not(:disabled) { background: #e0e0e0; }
.btn-tool:disabled { color: #999; cursor: default; background: #e0e0e0; }
.btn-save { font-weight: bold; }
.save-msg {
  font-size: 11px;
  color: #3399ff;
  margin-left: 4px;
}

/* ── 메인 컨테이너 ────────────────────────────────────── */
.main-container {
  display: grid;
  grid-template-columns: 220px 1fr;
  flex: 1;
  overflow: hidden;
}

/* ── 트리 패널 ────────────────────────────────────────── */
.tree-panel {
  background-color: #ffffff;
  border-right: 1px solid #b0b0b0;
  overflow-y: auto;
}
.tree-empty {
  padding: 8px 5px;
  color: #666;
  font-size: 11px;
}
.tree-item {
  padding: 2px 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}
.tree-item:hover { background: #e8f4ff; }
.tree-item.selected {
  background-color: #3399ff;
  color: white;
}

/* ── 컨텐츠 패널 ──────────────────────────────────────── */
.content-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f0f0;
}
.content-empty {
  padding: 10px;
  color: #666;
  font-size: 11px;
}
.loading-msg {
  padding: 10px;
  color: #666;
  font-size: 11px;
}

/* ── Recipe Name 입력 영역 ────────────────────────────── */
.input-group {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  background: #eaeaea;
  border-bottom: 1px solid #b0b0b0;
  flex-shrink: 0;
}
.input-group label {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}
.recipe-name-input {
  flex: 1;
  height: 20px;
  border: 1px solid #b0b0b0;
  padding: 0 4px;
  font-size: 12px;
  font-family: 'Gulim', sans-serif;
}
.btn-action {
  height: 20px;
  padding: 0 8px;
  border: 1px solid #b0b0b0;
  background: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
  font-family: 'Gulim', sans-serif;
}
.btn-action:hover:not(:disabled) { background: #d0d0d0; }
.btn-action:disabled { color: #999; cursor: default; }

/* ── 데이터 테이블 ────────────────────────────────────── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  font-size: 12px;
  overflow-y: auto;
  display: block;
  flex: 1;
}
.data-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
.data-table th,
.data-table td {
  border: 1px solid #b0b0b0;
  padding: 2px 5px;
  text-align: center;
  white-space: nowrap;
}
.data-table th {
  background-color: #eaeaea;
  font-weight: bold;
}
.col-idx  { width: 32px; color: #666; }
.col-item { width: 160px; text-align: left; }
.col-unit { width: 70px; }
.col-data { min-width: 120px; }

.row-selected > td { background: #cce5ff; }

.data-input {
  width: 100%;
  height: 18px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-family: 'Gulim', sans-serif;
  text-align: center;
  box-sizing: border-box;
  padding: 0 2px;
}
.data-input:focus {
  outline: 1px solid #3399ff;
  background: #fff;
}
</style>
