<template>
  <section class="history-page">
    <header class="history-header">
      <div class="history-header-main">
        <h1>My History</h1>
      </div>

      <div class="history-header-side">
        <section class="history-card filter-card">
          <div v-for="(filter, idx) in filters" :key="filter.id" class="filter-row">
            <select v-model="filter.field" class="field-input select-input">
              <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>

            <template v-if="filter.field === 'createdAt'">
              <button class="field-input range-input" type="button" @click="toggleRangePicker(filter.id)">
                {{ rangeLabel(filter) }}
              </button>
              <div v-if="openRangeFilterId === filter.id" class="range-popover">
                <div class="range-header">
                  <button class="mini-nav" type="button" @click="moveMonth(-1)">‹</button>
                  <strong>{{ rangeMonthLabel }}</strong>
                  <button class="mini-nav" type="button" @click="moveMonth(1)">›</button>
                </div>
                <div class="weekday-row">
                  <span v-for="day in weekdays" :key="day">{{ day }}</span>
                </div>
                <div class="calendar-grid">
                  <button
                    v-for="day in calendarDays"
                    :key="day.key"
                    class="day-cell"
                    :class="day.classes"
                    type="button"
                    :disabled="!day.date"
                    @click="pickRangeDate(filter, day.date)"
                  >
                    {{ day.label }}
                  </button>
                </div>
                <div class="range-actions">
                  <button class="mini-btn" type="button" @click="clearRange(filter)">Clear</button>
                  <button class="mini-btn" type="button" @click="openRangeFilterId = null">Close</button>
                </div>
              </div>
            </template>
            <template v-else>
              <input v-model="filter.value" class="field-input text-input" type="text" :placeholder="`${labelByField(filter.field)} 검색`" />
            </template>

            <button v-if="filters.length > 1" class="mini-btn" type="button" @click="removeFilter(filter.id)">−</button>
            <button v-if="idx === filters.length - 1 && filters.length < 4" class="mini-btn" type="button" @click="addFilter">+</button>
          </div>
        </section>

        <div class="history-actions">
          <button class="refresh-btn" type="button" @click="loadHistory">Refresh</button>
        </div>
      </div>
    </header>

    <section class="history-card stats-row">
      <div class="stat-box"><span class="stat-label">전체</span><strong>{{ groupedItems.length }}</strong></div>
      <div class="stat-box"><span class="stat-label">Rename</span><strong>{{ countByAction('Rename') }}</strong></div>
      <div class="stat-box"><span class="stat-label">Save As</span><strong>{{ countByAction('Save As') }}</strong></div>
      <div class="stat-box"><span class="stat-label">Edit</span><strong>{{ countByAction('Edit') }}</strong></div>
      <div class="stat-box"><span class="stat-label">Delete</span><strong>{{ countByAction('Delete') }}</strong></div>
      <div class="stat-box"><span class="stat-label">Transfer</span><strong>{{ countByAction('Transfer') }}</strong></div>
    </section>

    <section class="history-card history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>분임조</th>
            <th>From 설비</th>
            <th>Action</th>
            <th>To 설비</th>
            <th>시간</th>
            <th>Recipe Name</th>
            <th>Detail</th>
            <th class="comment-th">Comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="empty-row">Loading...</td>
          </tr>
          <tr v-else-if="groupedItems.length === 0">
            <td colspan="9" class="empty-row">이력이 없습니다.</td>
          </tr>
          <tr v-for="group in groupedItems" :key="group.key" class="group-row">
            <td>{{ group.actorName || 'Unknown' }}</td>
            <td>{{ group.actorTeam || '-' }}</td>
            <td>{{ group.fromEqpId || '-' }}</td>
            <td>
              <span class="action-chip" :class="actionClass(group.action)">
                {{ group.action || '-' }}
                <span v-if="group.hasFailure" class="warn-icon" :title="group.failureTooltip">❗</span>
              </span>
            </td>
            <td>{{ group.toEqpIdDisplay }}</td>
            <td>{{ group.createdAt || '-' }}</td>
            <td class="recipe-name-td">
              <div class="recipe-name-cell">
                <span class="recipe-summary">{{ group.recipeSummary }}</span>
                <div class="detail-anchor" v-if="group.recipeNames.length > 1">
                  <button class="expand-btn" type="button" @click.stop="toggleExpand(group.key, 'recipe')">
                    {{ isExpanded(group.key, 'recipe') ? '▲' : '▼' }}
                  </button>
                  <div v-if="isExpanded(group.key, 'recipe')" class="detail-popover recipe-popover">
                    <ul class="detail-list">
                      <li v-for="(item, idx) in group.items" :key="`${group.key}-recipe-${idx}`">
                        <span class="detail-name">{{ item.displayName }}</span>
                        <span v-if="item.status !== 'ok'" class="detail-fail" :title="item.reason || '실패'">❗ {{ item.reason || '실패' }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </td>
            <td class="detail-td">
              <div class="detail-summary-row">
                <div class="detail-chip-row">
                  <span v-if="group.detailSummaryLabel" class="detail-label-chip">{{ group.detailSummaryLabel }}</span>
                  <template v-for="(chip, idx) in group.detailSummaryChips" :key="`${group.key}-chip-${idx}`">
                    <span class="detail-chip">{{ chip }}</span>
                    <span v-if="idx < group.detailSummaryChips.length - 1" class="detail-relation">→</span>
                  </template>
                  <span v-if="group.detailHiddenCount > 0" class="detail-more">외 {{ group.detailHiddenCount }}건</span>
                </div>
                <div class="detail-anchor" v-if="group.detailEntries.length > 1">
                  <button class="expand-btn" type="button" @click.stop="toggleExpand(group.key, 'detail')">
                    {{ isExpanded(group.key, 'detail') ? '▽' : '▼' }}
                  </button>
                  <div v-if="isExpanded(group.key, 'detail')" class="detail-popover detail-overlay">
                    <div class="detail-groups">
                      <div v-for="(entry, idx) in group.detailEntries" :key="`${group.key}-detail-${idx}`" class="detail-group">
                        <span v-if="entry.label" class="detail-label-chip">{{ entry.label }}</span>
                        <template v-for="(chip, cidx) in entry.chips" :key="`${group.key}-detail-${idx}-${cidx}`">
                          <span class="detail-chip">{{ chip }}</span>
                          <span v-if="cidx < entry.chips.length - 1" class="detail-relation">→</span>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td class="comment-td" @click="startEditComment(group.key)">
              <template v-if="editingCommentKey === group.key">
                <input
                  class="comment-input"
                  :ref="el => { if (el) commentInputRefs[group.key] = el as HTMLInputElement }"
                  v-model="editingCommentValue"
                  type="text"
                  placeholder="코멘트 입력..."
                  @keydown.enter.prevent="saveComment(group.key)"
                  @keydown.escape.prevent="cancelEditComment"
                  @blur="saveComment(group.key)"
                  @click.stop
                />
              </template>
              <template v-else>
                <span
                  class="comment-text"
                  :class="{ 'comment-empty': !commentMap[group.key]?.comment }"
                  :title="commentMap[group.key]?.commentAuthor ? `작성자: ${commentMap[group.key].commentAuthor}` : undefined"
                >{{ commentMap[group.key]?.comment || '' }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { recipeTestApi, type HistoryComment, type HistoryEntry } from '../../recipe_test/api/recipeTestApi'

type FilterField = 'actorName' | 'actorTeam' | 'fromEqpId' | 'toEqpId' | 'action' | 'recipeName' | 'createdAt'
type FilterRow = { id: number; field: FilterField; value: string; dateFrom: string; dateTo: string }
type DetailEntry = { raw: string; label: string; chips: string[] }
type GroupedHistoryItem = { key: string; actorName: string; actorTeam: string; fromEqpId: string; toEqpIdDisplay: string; action: string; createdAt: string; recipeNames: string[]; recipeSummary: string; hasFailure: boolean; failureTooltip: string; items: Array<{ displayName: string; status: string; reason: string; detail: string }>; detailEntries: DetailEntry[]; detailSummaryLabel: string; detailSummaryChips: string[]; detailHiddenCount: number }

const filterOptions = [
  { value: 'actorName', label: '이름' },
  { value: 'actorTeam', label: '분임조' },
  { value: 'fromEqpId', label: 'From 설비' },
  { value: 'toEqpId', label: 'To 설비' },
  { value: 'action', label: 'Action' },
  { value: 'recipeName', label: 'Recipe Name' },
  { value: 'createdAt', label: '시간' },
] as const

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const loading = ref(false)
const items = ref<HistoryEntry[]>([])
const filters = ref<FilterRow[]>([{ id: 1, field: 'fromEqpId', value: '', dateFrom: '', dateTo: '' }])
const commentMap = ref<Record<string, HistoryComment>>({})
const editingCommentKey = ref<string | null>(null)
const editingCommentValue = ref('')
const commentInputRefs: Record<string, HTMLInputElement> = {}
const expandedRecipeKeys = ref<Set<string>>(new Set())
const expandedDetailKeys = ref<Set<string>>(new Set())
const openRangeFilterId = ref<number | null>(null)
const calendarCursor = ref(new Date())
let filterSeq = 2

function normalizeText(value: unknown) { return String(value ?? '').trim() }
function lowerText(value: unknown) { return normalizeText(value).toLowerCase() }
function labelByField(field: FilterField) { return filterOptions.find(x => x.value === field)?.label ?? field }
function addFilter() { if (filters.value.length < 4) filters.value.push({ id: filterSeq++, field: 'recipeName', value: '', dateFrom: '', dateTo: '' }) }
function removeFilter(id: number) { filters.value = filters.value.filter(x => x.id !== id); if (!filters.value.length) filters.value = [{ id: filterSeq++, field: 'fromEqpId', value: '', dateFrom: '', dateTo: '' }] }
function normalizeToEqp(row: any) { const from = normalizeText(row.fromEqpId); const to = normalizeText(row.toEqpId); return !to || to === from ? '-' : to }
function effectiveRecipeName(row: any) { return normalizeText(row.recipeName) || normalizeText(row.targetName) || normalizeText(row.sourceName) || '-' }
function toDatePart(v: string) { return normalizeText(v).slice(0, 10) }

function transformDetailLabel(lhs: string): string {
  const slotMatch = lhs.match(/^Slot\s+(\d+)$/i)
  if (slotMatch) return `#${slotMatch[1]}`
  return lhs.replace(/\s+Recipe$/i, '').trim()
}

function parseDetailEntry(raw: string): DetailEntry {
  const text = normalizeText(raw)
  if (!text) return { raw: '', label: '', chips: [] }
  const trimmed = text.replace(/\s+외\s+\d+건$/, '').trim()
  if (trimmed.includes(':') && trimmed.includes('→')) {
    const colonIdx = trimmed.indexOf(':')
    const lhs = trimmed.slice(0, colonIdx).trim()
    const rhs = trimmed.slice(colonIdx + 1).trim()
    const pair = rhs.split('→').map(s => normalizeText(s)).filter(Boolean)
    return { raw: text, label: transformDetailLabel(lhs), chips: pair }
  }
  if (trimmed.includes('→')) {
    return { raw: text, label: '', chips: trimmed.split('→').map(s => normalizeText(s)).filter(Boolean) }
  }
  const token = normalizeText(trimmed)
  return { raw: text, label: '', chips: token ? [token] : [] }
}

async function loadHistory() {
  loading.value = true
  try {
    const [histRes, cmtRes] = await Promise.allSettled([
      recipeTestApi.getHistory(3000),
      recipeTestApi.getHistoryComments(),
    ])
    items.value = histRes.status === 'fulfilled' && Array.isArray(histRes.value.items) ? histRes.value.items : []
    commentMap.value = cmtRes.status === 'fulfilled' ? (cmtRes.value.comments ?? {}) : {}
  } catch (err) {
    console.error(err)
    items.value = []
  } finally {
    loading.value = false
  }
}

async function startEditComment(key: string) {
  editingCommentKey.value = key
  editingCommentValue.value = commentMap.value[key]?.comment ?? ''
  await nextTick()
  commentInputRefs[key]?.focus()
}

async function saveComment(key: string) {
  if (editingCommentKey.value !== key) return
  const comment = editingCommentValue.value.trim()
  editingCommentKey.value = null
  try {
    await recipeTestApi.putHistoryComment(key, comment)
    if (comment) {
      commentMap.value = { ...commentMap.value, [key]: { comment, commentAuthor: commentMap.value[key]?.commentAuthor ?? '', updatedAt: '' } }
    } else {
      const next = { ...commentMap.value }
      delete next[key]
      commentMap.value = next
    }
  } catch (err) {
    console.error('comment save failed', err)
  }
}

function cancelEditComment() {
  editingCommentKey.value = null
  editingCommentValue.value = ''
}

const filteredItems = computed(() => items.value.filter((row: any) => {
  for (const filter of filters.value) {
    if (filter.field === 'createdAt') {
      const day = toDatePart(row.createdAt || '')
      if (filter.dateFrom && day && day < filter.dateFrom) return false
      if (filter.dateTo && day && day > filter.dateTo) return false
      continue
    }
    const q = lowerText(filter.value)
    if (!q) continue
    const fieldValue = filter.field === 'recipeName' ? effectiveRecipeName(row) : filter.field === 'toEqpId' ? normalizeToEqp(row) : normalizeText((row as any)[filter.field])
    if (!lowerText(fieldValue).includes(q)) return false
  }
  return true
}))

const groupedItems = computed<GroupedHistoryItem[]>(() => {
  const map = new Map<string, GroupedHistoryItem>()
  for (const row of filteredItems.value) {
    const actorName = normalizeText((row as any).actorName) || 'Unknown'
    const actorTeam = normalizeText((row as any).actorTeam)
    const fromEqpId = normalizeText((row as any).fromEqpId)
    const toEqpIdDisplay = normalizeToEqp(row)
    const action = normalizeText((row as any).action)
    const createdAt = normalizeText((row as any).createdAt)
    const key = [actorName, actorTeam, fromEqpId, toEqpIdDisplay, action, createdAt].join('||')
    const recipeName = effectiveRecipeName(row)
    const status = normalizeText((row as any).status) || 'ok'
    const reason = normalizeText((row as any).reason)
    const detail = normalizeText((row as any).detail)
    let group = map.get(key)
    if (!group) {
      group = { key, actorName, actorTeam, fromEqpId, toEqpIdDisplay, action, createdAt, recipeNames: [], recipeSummary: '-', hasFailure: false, failureTooltip: '', items: [], detailEntries: [], detailSummaryLabel: '', detailSummaryChips: [], detailHiddenCount: 0 }
      map.set(key, group)
    }
    if (recipeName && !group.recipeNames.includes(recipeName)) group.recipeNames.push(recipeName)
    group.items.push({ displayName: recipeName, status, reason, detail })
    if (detail) {
      for (const part of detail.split(';').map(s => normalizeText(s)).filter(Boolean)) {
        group.detailEntries.push(parseDetailEntry(part))
      }
    }
    if (status !== 'ok') group.hasFailure = true
  }
  const out = Array.from(map.values()).map(group => {
    const failures = group.items.filter(x => x.status !== 'ok' && x.reason).map(x => x.reason)
    group.failureTooltip = failures.length ? failures.join('\n') : '일부 작업이 실패했습니다.'
    group.recipeSummary = group.recipeNames.length <= 1 ? (group.recipeNames[0] || '-') : `${group.recipeNames[0]} 외 ${group.recipeNames.length - 1}건`
    const first = group.detailEntries[0] || { label: '', chips: [], raw: '' }
    group.detailSummaryLabel = first.label
    group.detailSummaryChips = first.chips.slice(0, 2)
    group.detailHiddenCount = Math.max(0, group.detailEntries.length - 1)
    return group
  })
  out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  return out
})

function countByAction(action: string) { return groupedItems.value.filter(x => x.action === action).length }
function actionClass(action: string) { const key = normalizeText(action).toLowerCase(); return { rename: key === 'rename', saveas: key === 'save as', edit: key === 'edit', delete: key === 'delete', transfer: key === 'transfer' } }
function isExpanded(key: string, kind: 'recipe' | 'detail') { return (kind === 'recipe' ? expandedRecipeKeys.value : expandedDetailKeys.value).has(key) }
function toggleExpand(key: string, kind: 'recipe' | 'detail') { const set = kind === 'recipe' ? expandedRecipeKeys.value : expandedDetailKeys.value; set.has(key) ? set.delete(key) : set.add(key); if (kind === 'recipe') expandedRecipeKeys.value = new Set(set); else expandedDetailKeys.value = new Set(set) }

function rangeLabel(filter: FilterRow) { return filter.dateFrom || filter.dateTo ? `${filter.dateFrom || '시작'} ~ ${filter.dateTo || '끝'}` : '날짜 범위 선택' }
function toggleRangePicker(id: number) { openRangeFilterId.value = openRangeFilterId.value === id ? null : id }
function moveMonth(delta: number) { const next = new Date(calendarCursor.value); next.setMonth(next.getMonth() + delta); calendarCursor.value = next }
const rangeMonthLabel = computed(() => `${calendarCursor.value.getFullYear()}-${String(calendarCursor.value.getMonth() + 1).padStart(2, '0')}`)
const calendarDays = computed(() => {
  const first = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth(), 1)
  const last = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth() + 1, 0)
  const days: any[] = []
  for (let i = 0; i < first.getDay(); i++) days.push({ key: `b-${i}`, label: '', date: '', classes: 'blank' })
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth(), d)
    const iso = dt.toISOString().slice(0, 10)
    const activeFilter = filters.value.find(f => f.id === openRangeFilterId.value)
    const from = activeFilter?.dateFrom || ''
    const to = activeFilter?.dateTo || ''
    const inRange = from && to && iso >= from && iso <= to
    const isEdge = iso === from || iso === to
    days.push({ key: iso, label: String(d), date: iso, classes: `${inRange ? 'in-range' : ''} ${isEdge ? 'edge' : ''}`.trim() })
  }
  return days
})
function pickRangeDate(filter: FilterRow, iso: string) {
  if (!filter.dateFrom || (filter.dateFrom && filter.dateTo)) { filter.dateFrom = iso; filter.dateTo = ''; return }
  if (iso < filter.dateFrom) { filter.dateTo = filter.dateFrom; filter.dateFrom = iso } else { filter.dateTo = iso }
}
function clearRange(filter: FilterRow) { filter.dateFrom = ''; filter.dateTo = '' }
function onWindowClick(ev: MouseEvent) {
  const target = ev.target as HTMLElement | null
  if (!target?.closest('.range-popover') && !target?.closest('.range-input')) openRangeFilterId.value = null
  if (!target?.closest('.detail-anchor')) {
    expandedRecipeKeys.value = new Set()
    expandedDetailKeys.value = new Set()
  }
}
onMounted(() => { loadHistory(); window.addEventListener('click', onWindowClick) })
onBeforeUnmount(() => window.removeEventListener('click', onWindowClick))
</script>

<style scoped>
.history-page { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
.history-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.history-header-side { display: flex; align-items: flex-start; gap: 12px; }
.history-card { background: #fff; border: 1px solid #d9deea; border-radius: 16px; box-shadow: 0 8px 28px rgba(15, 23, 42, .08); }
.filter-card { padding: 12px 14px; min-width: 380px; }
.filter-row { display: flex; align-items: center; gap: 8px; position: relative; }
.filter-row + .filter-row { margin-top: 8px; }
.field-input { border: 1px solid #d0d7e2; border-radius: 10px; padding: 8px 10px; background: #fff; box-sizing: border-box; }
.text-input { width: 132px; flex: 0 0 132px; }
.select-input { min-width: 132px; }
.range-input { min-width: 220px; text-align: left; }
.refresh-btn { border: none; border-radius: 999px; padding: 10px 16px; background: #1f6feb; color: #fff; font-weight: 700; cursor: pointer; }
.mini-btn, .mini-nav { border: 1px solid #c8d0db; border-radius: 8px; background: #fff; padding: 6px 8px; cursor: pointer; }
.range-popover { position: absolute; top: 46px; left: 142px; z-index: 20; background: #fff; border: 1px solid #d9deea; border-radius: 14px; box-shadow: 0 12px 30px rgba(15, 23, 42, .16); padding: 12px; width: 280px; }
.range-header, .weekday-row, .range-actions { display: flex; align-items: center; justify-content: space-between; }
.weekday-row { margin: 8px 0 6px; color: #6b7280; font-size: 12px; }
.weekday-row span, .day-cell { width: 36px; text-align: center; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.day-cell { height: 32px; border: none; border-radius: 8px; background: #fff; cursor: pointer; }
.day-cell.in-range { background: #dbeafe; } .day-cell.edge { background: #1f6feb; color: #fff; } .day-cell.blank { cursor: default; background: transparent; }
.stats-row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; padding: 12px; }
.stat-box { padding: 8px 10px; border: 1px solid #e5e9f2; border-radius: 12px; background: #f9fbff; }
.stat-label { display: block; color: #637086; font-size: 12px; }
.history-table-wrap { overflow: auto; padding: 0; }
.history-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.history-table th, .history-table td { padding: 12px 14px; border-bottom: 1px solid #edf1f7; vertical-align: top; }
.history-table th { text-align: left; background: #f4f7fb; position: sticky; top: 0; }
.empty-row { text-align: center; color: #6b7280; }
.action-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-weight: 700; }
.action-chip.rename { background: #eef2ff; color: #4338ca; }
.action-chip.saveas { background: #ecfdf3; color: #15803d; }
.action-chip.edit { background: #fff7ed; color: #c2410c; }
.action-chip.delete { background: #fef2f2; color: #b91c1c; }
.action-chip.transfer { background: #ecfeff; color: #0f766e; }
.recipe-name-cell, .detail-summary-row { display: flex; align-items: center; gap: 8px; position: relative; }
.recipe-name-td, .detail-td { position: relative; overflow: visible; }
.detail-anchor { position: relative; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.expand-btn { border: none; background: transparent; cursor: pointer; font-size: 12px; color: #374151; }
.detail-popover { position: absolute; top: calc(100% + 6px); left: 0; margin-top: 0; z-index: 24; background: #fff; border: 1px solid #d9deea; border-radius: 12px; box-shadow: 0 14px 30px rgba(15, 23, 42, .16); padding: 10px 12px; min-width: 260px; }
.recipe-name-cell .detail-anchor { position: static; }
.recipe-popover { left: 0; top: calc(100% + 6px); }
.detail-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.detail-overlay { min-width: 320px; }
.detail-groups { display: flex; flex-direction: column; gap: 10px; }
.detail-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.detail-chip-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.detail-chip { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 999px; background: #eef4ff; color: #1f4ea3; font-weight: 700; border: 1px solid #d7e4ff; font-size: 11px; line-height: 1; }
.detail-label-chip { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 999px; background: #fdf4ff; color: #7e22ce; font-weight: 700; border: 1px solid #e9d5ff; font-size: 11px; line-height: 1; margin-right: 2px; }
.detail-relation { color: #64748b; font-weight: 700; font-size: 11px; }
.detail-more { color: #6b7280; font-size: 11px; }
.warn-icon, .to-fail-icon, .detail-fail { color: #dc2626; font-weight: 700; }
.comment-th { min-width: 160px; width: 200px; }
.comment-td { min-width: 160px; cursor: text; vertical-align: middle; }
.comment-text { display: block; white-space: pre-wrap; word-break: break-word; min-height: 20px; line-height: 1.5; color: #1e293b; }
.comment-empty::after { content: ''; display: block; min-height: 20px; }
.comment-input { width: 100%; box-sizing: border-box; border: 1px solid #6366f1; border-radius: 6px; padding: 5px 8px; font-size: inherit; font-family: inherit; outline: none; background: #f8f8ff; }
.comment-input:focus { box-shadow: 0 0 0 2px #c7d2fe; }
</style>