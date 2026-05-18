<template>
  <div v-if="open" class="w97-modal-overlay">
    <div class="w97-modal picker" :class="{ 'polcon-picker': isPolConPicker }">
      <div class="w97-modal-titlebar">
        <div class="w97-modal-title">
          <span class="title-prefix">Select</span>
          <span class="title-main">{{ titleBase }}</span>
          <span v-if="emphasizeText" class="title-for">for</span>
          <strong v-if="emphasizeText" class="title-emphasis">{{ emphasizeText }}</strong>
        </div>
      </div>

      <div class="w97-modal-body">
        <div class="legacy-titlebar picker-titlebar">
          <span class="legacy-title">{{ titleBase }}</span>
          <strong v-if="emphasizeText" class="legacy-strong">{{ emphasizeText }}</strong>

          <input
            class="win-input find-input"
            :class="findClass"
            :value="query"
            placeholder="Find..."
            @input="emit('update:query', ($event.target as HTMLInputElement).value)"
            @keydown.enter="emit('apply-find')"
          />
          <button class="win-btn iconbtn" @click="emit('apply-find')" aria-label="search">🔍</button>

          <div class="view-mode-switch">
            <button class="view-btn" :class="{ active: listMode === 'name' }" @click="emit('update:listMode', 'name')" type="button" title="Name Only">☰</button>
            <button class="view-btn" :class="{ active: listMode === 'detail' }" @click="emit('update:listMode', 'detail')" type="button" title="Details">▤</button>
          </div>

          <div class="spacer"></div>
        </div>

        <div v-if="hint" class="w97-hint picker-hint">{{ hint }}</div>

        <div class="list-head picker-list-head">
          <div class="list-head-track" :style="{ transform: `translateX(${-scrollLeft}px)` }">
            <div
              v-for="idx in headerCount"
              :key="`picker-head-${idx}`"
              class="w97-col list-col-wide head-wide"
              :style="{ width: columnBlockWidth + 'px' }"
            >
              <template v-if="listMode === 'detail'">
                <div class="head-cell name-col" :style="{ width: colWidths.name + 'px' }">
                  <span class="head-label">File Name</span>
                  <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'name', event: $event })"></span>
                </div>
                <div class="head-cell time-col" :style="{ width: colWidths.modifiedAt + 'px' }">
                  <span class="head-label">Modified Time</span>
                  <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'modifiedAt', event: $event })"></span>
                </div>
              </template>
              <template v-else>
                <div class="head-cell name-col only-name-head" :style="{ width: colWidths.name + 'px' }">
                  <span class="head-label">File Name</span>
                  <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'name', event: $event })"></span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="picker-grid">
          <div class="recipe-scroll picker-scroll" :class="{ compact: listMode === 'name' }" @scroll="emit('body-scroll')" :ref="setScrollRef">
            <div class="recipe-col list-col-wide" v-for="(col, idx) in recipeCols" :key="idx" :style="{ width: columnBlockWidth + 'px' }">
              <ul class="list-ul">
                <li
                  v-for="r in col"
                  :key="r.id"
                  class="list-li"
                  :class="{ active: r.id === previewId, 'detail-row': listMode === 'detail' }"
                  @click="emit('item-click', r.id)"
                  @dblclick="previewRecipe && emit('select', previewRecipe)"
                  :ref="(el) => setItemRef(r.id, el)"
                >
                  <template v-if="listMode === 'detail'">
                    <span class="cell-name name-col" :style="{ width: colWidths.name + 'px' }" :title="displayListName(r.name, r.sourceKind)">{{ displayListName(r.name, r.sourceKind) }}</span>
                    <span class="cell-time time-col" :style="{ width: colWidths.modifiedAt + 'px' }">{{ r.modifiedAt || '' }}</span>
                  </template>
                  <template v-else>
                    <span class="name-only" :style="{ width: colWidths.name + 'px' }" :title="displayListName(r.name, r.sourceKind)">{{ displayListName(r.name, r.sourceKind) }}</span>
                  </template>
                </li>
              </ul>
            </div>
          </div>

          <div class="picker-preview">
            <div class="picker-preview-title">Preview: {{ displayListName(previewRecipe?.name ?? '', previewRecipe?.sourceKind) }}</div>

            <div v-if="previewRecipe && displayPreviewColumns.length" class="picker-preview-tablewrap">
              <table
                class="legacy-table preview-table-large"
                :class="{
                  'jobish-table': richRecipeKinds.includes(previewRecipe?.sourceKind || ''),
                  'polcon-preview': isPolConPicker,
                  'pol-preview': isPolPreview,
                }"
              >
                <thead>
                  <tr>
                    <th class="recipe-index-head" :style="previewColumnStyle('__index__')"></th>
                    <th
                      v-for="c in displayPreviewColumns"
                      :key="c"
                      :class="recipeHeaderClass(c)"
                      :style="previewColumnStyle(c)"
                >{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in previewRecipe.rows" :key="i">
                    <td class="recipe-index-cell" :style="previewColumnStyle('__index__')">{{ i + 1 }}</td>
                    <td
                      v-for="c in displayPreviewColumns"
                      :key="c"
                      :class="recipeCellClass(c, row[c] ?? '', row)"
                      :style="previewColumnStyle(c)"
                    >
                      <span class="recipe-cell-text" v-html="recipeCellHtml(c, row[c] ?? '', row)"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="legacy-empty">{{ previewRecipe ? 'Preview not available for this file type.' : 'Select a recipe.' }}</div>
          </div>
        </div>
      </div>

      <div class="w97-modal-actions">
        <button class="win-btn" @click="previewRecipe && emit('select', previewRecipe)" :disabled="!previewRecipe">Select</button>
        <button class="win-btn" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { RecipeDetail, RecipeSourceKind } from '../api/recipeTestApi'

const props = defineProps({
  open: { type: Boolean, default: false },
  findClass: { type: String, default: '' },
  hint: { type: String, default: '' },
  query: { type: String, default: '' },
  platen: { type: Number, default: 1 },
  recipeCols: {
    type: Array as PropType<RecipeDetail[][]>,
    default: () => [],
  },
  previewId: { type: String, default: '' },
  previewRecipe: {
    type: Object as PropType<RecipeDetail | null>,
    default: null,
  },
  titleBase: { type: String, default: 'Recipe' },
  emphasizeText: { type: String, default: '' },
  listMode: {
    type: String as PropType<'name' | 'detail'>,
    default: 'name',
  },
  scrollLeft: { type: Number, default: 0 },
  colWidths: {
    type: Object as PropType<{ name: number; modifiedAt: number }>,
    default: () => ({ name: 300, modifiedAt: 82 }),
  },
})

const emit = defineEmits<{
  (e: 'update:query', value: string): void
  (e: 'apply-find'): void
  (e: 'item-click', recipeId: string): void
  (e: 'select', recipe: RecipeDetail): void
  (e: 'close'): void
  (e: 'register-item-ref', payload: { id: string; el: HTMLElement | null }): void
  (e: 'update:listMode', mode: 'name' | 'detail'): void
  (e: 'body-scroll'): void
  (e: 'start-resize', payload: { colKey: 'name' | 'modifiedAt'; event: MouseEvent }): void
  (e: 'register-scroll-el', el: HTMLDivElement | null): void
}>()

const richRecipeKinds = ['megasonics', 'brush1', 'brush2', 'vaporDryer'] as const
const headerCount = computed(() => Math.max(props.recipeCols.length, 1))
const firstPickerKind = computed(() => {
  const first = props.recipeCols.flat().find(Boolean) as RecipeDetail | undefined
  return (props.previewRecipe?.sourceKind || first?.sourceKind || '') as RecipeSourceKind | ''
})
const isPolConPicker = computed(() => ['polishRecipe', 'conditionRecipe', 'exSituCondition', 'specialExSitu'].includes(String(firstPickerKind.value)))
const isPolPreview = computed(() => String((props.previewRecipe as any)?.meta?.sourceType ?? '') === 'pol')
const columnBlockWidth = computed(() => ((props.listMode === 'detail' ? props.colWidths.name + props.colWidths.modifiedAt : props.colWidths.name) + 8))
const displayPreviewColumns = computed(() => (props.previewRecipe?.columns ?? []).filter(c => c !== '#' && c !== '__ui__'))

function stripKnownRecipeExt(name: unknown, sourceKind?: RecipeSourceKind) {
  const text = String(name ?? '').trim()
  if (!text) return ''
  if (sourceKind === 'isrmAlgorithm' || sourceKind === 'rtpcRecipe') return text
  return text.replace(/\.(br|meg|dryr|drpr|pol|con|cln)$/i, '')
}
function displayListName(name: unknown, sourceKind?: RecipeSourceKind) {
  return stripKnownRecipeExt(name, sourceKind)
}

function recipeCellUi(column: string, row?: Record<string, unknown>) {
  return ((row as any)?.__ui__?.[column] ?? {}) as Record<string, any>
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
function recipeHeaderClass(column: string) {
  return {
    'recipe-header-emphasis': ['Wafer RPM', 'Brush RPM', 'IPA Flow', 'N2 Vapor Carrier Flow'].includes(column),
  }
}
function recipeCellClass(column: string, value: unknown, row?: Record<string, unknown>) {
  const text = String(value ?? '').trim()
  const sourceKind = props.previewRecipe?.sourceKind ?? ''
  const ui = recipeCellUi(column, row)
  return {
    'recipe-cell-preline': text.includes('\n'),
    'recipe-checkbox-cell': ui.kind === 'checkbox',
    'cell-cyan': ui.tone === 'cyan'
      || (sourceKind === 'megasonics' && column === 'Wafer RPM')
      || ((sourceKind === 'brush1' || sourceKind === 'brush2') && (column === 'Brush RPM' || column === 'Wafer RPM')),
    'cell-green': ui.tone === 'green'
      || ((sourceKind === 'brush1' || sourceKind === 'brush2') && column === 'DIW to Brushes' && /^on\b/i.test(text))
      || ((sourceKind === 'brush1' || sourceKind === 'brush2') && column === 'Spray Bar Flow Settings' && !/^off\b/i.test(text))
      || (sourceKind === 'vaporDryer' && column === 'Value' && (
        String(row?.Item ?? '').trim() === 'IPA Flow'
        || String(row?.Item ?? '').trim() === 'N2 Vapor Carrier Flow'
      )),
    'cell-yellow': ui.tone === 'yellow',
    'cell-disabled': ui.tone === 'disabled',
    'cell-white': ui.tone === 'white',
  }
}
function formatRecipeLine(line: string) {
  let html = escapeHtml(String(line ?? ''))
  html = html.replace(/\b(Sine|No Sweep|zones|swps\/min|ml\/min|psi)\b/g, '<span class="recipe-unit">$1</span>')
  html = html.replace(/(\d(?:[\d.]*)?)\s+(s)\b/g, '$1 <span class="recipe-unit">$2</span>')
  html = html.replace(/(\d(?:[\d.]*)?)\s+(in)\b/g, '$1 <span class="recipe-unit">$2</span>')
  return `<span class="recipe-line">${html}</span>`
}

function recipeCellHtml(column: string, value: unknown, row?: Record<string, unknown>) {
  const ui = recipeCellUi(column, row)
  if (ui.kind === 'checkbox') {
    const checked = !!ui.checked
    const disabled = ui.enabled === false
    return `<span class="recipe-check-box ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}"></span>`
  }
  const text = String(value ?? '')
  const lines = text.split('\n')
  if (lines.length <= 1) return formatRecipeLine(text)
  return lines.map(formatRecipeLine).join('<br>')
}
function previewColumnStyle(column: string) {
  const sourceKind = props.previewRecipe?.sourceKind ?? ''
  const sourceType = String((props.previewRecipe as any)?.meta?.sourceType ?? '')

  if (sourceKind === 'megasonics') {
    if (column === '__index__') return { width: '52px' }
    if (column === 'Description') return { width: '28%' }
    if (column === 'Time') return { width: '18%' }
    if (column === 'Wafer RPM') return { width: '22%' }
    if (column === 'Meg Power') return { width: '20%' }
  }

  if (sourceKind === 'brush1' || sourceKind === 'brush2') {
    if (column === '__index__') return { width: '4%' }
    if (column === 'Description') return { width: '12%' }
    if (column === 'Time') return { width: '7%' }
    if (column === 'Brush RPM') return { width: '10%' }
    if (column === 'Brush Position') return { width: '14%' }
    if (column === 'Wafer RPM') return { width: '10%' }
    if (column === 'DIW to Brushes') return { width: '12%' }
    if (column === 'Spray Bar Flow Settings') return { width: '22%' }
    if (column === 'DIW to Dual Spray Bars') return { width: '9%' }
  }

  if (sourceType === 'pol' || sourceType === 'con') {
    if (column === '__index__') return { width: '52px' }
    if (column === 'Description') return { width: '14%' }
    if (column === 'Main' || column === 'RTPC' || column === 'HPR' || column === 'Head Rinse') return { width: '6%' }
    if (column === 'End By') return { width: '10%' }
    if (column === 'Platen RPM' || column === 'Head RPM') return { width: '8%' }
    if (column === 'Head Sweep') return { width: '10%' }
    if (column.startsWith('Z') || column === 'RR State') return { width: '7%' }
    if (column.startsWith('L')) return { width: '7%' }
  }

  if (sourceKind === 'vaporDryer') {
    if (column === '__index__') return { width: '60px' }
    if (column === 'Item') return { width: '34%' }
    if (column === 'Value') return { width: '58%' }
  }

  if (column === '__index__') return { width: '52px' }
  return {}
}
function setItemRef(id: string, el: Element | null) {
  emit('register-item-ref', { id, el: el instanceof HTMLElement ? el : null })
}
function setScrollRef(el: Element | null) {
  emit('register-scroll-el', el instanceof HTMLDivElement ? el : null)
}
</script>

<style scoped>
.w97-modal-overlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 10000;
}
.w97-modal{
  width: 420px;
  background:#c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
}
.w97-modal-titlebar{
  background:#0a246a;
  color:#fff;
  padding:6px 8px;
  font-weight:900;
}
.w97-modal-title{
  display:flex;
  align-items:center;
  gap:6px;
}
.title-prefix,
.title-main,
.title-for{
  font-weight:900;
}
.title-emphasis,
.legacy-strong{
  font-weight:1000;
}
.w97-modal-body{
  padding:12px;
  font-weight:900;
}
.w97-modal-actions{
  padding:0 12px 12px 12px;
  display:flex;
  gap:8px;
  justify-content:flex-end;
}
.picker{ width:min(1180px, 96vw); }
.legacy-titlebar{
  display:flex;
  align-items:center;
  gap:10px;
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:6px 8px;
  min-width:0;
  position:relative;
}
.legacy-title{ font-weight:900; }
.spacer{ flex:1; }
.find-input{ width:240px; }
.win-input{
  height:22px;
  padding:2px 6px;
  background:#fff;
  border-top:2px solid #808080;
  border-left:2px solid #808080;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
}
.win-btn{
  height:24px;
  background:#c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  cursor:pointer;
}
.iconbtn{
  width:34px;
  min-width:34px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
}
.view-mode-switch{ display:flex; gap:4px; }
.view-btn{
  width:26px;
  height:24px;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  background:#c0c0c0;
  cursor:pointer;
  font-weight:900;
}
.view-btn.active{ background:#0a246a; color:#fff; }
.w97-hint{
  padding:6px 8px;
  color:#7a0000;
  font-weight:900;
  font-size:12px;
}
.picker-hint{ margin-bottom:8px; }
.picker-titlebar{ margin-bottom:8px; }
.list-head{
  display:flex;
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:3px 8px 1px 8px;
  font-weight:700;
  font-size:11px;
  overflow:hidden;
}
.polcon-picker .list-head{
  font-size:10px;
}
.picker-list-head{ margin-bottom:2px; }
.list-head-track{ display:flex; width:max-content; will-change:transform; }
.head-wide{ display:flex; flex:0 0 auto; padding-right:8px; box-sizing:border-box; }
.head-cell{
  position:relative;
  display:flex;
  align-items:center;
  gap:4px;
  font-size:11px;
  font-weight:700;
  min-width:0;
  height:22px;
  box-sizing:border-box;
  padding:0 14px 0 6px;
}
.head-label{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.head-cell.time-col{ padding-left:8px; }
.col-resizer{
  position:absolute;
  top:0;
  right:0;
  width:10px;
  height:100%;
  cursor:col-resize;
}
.col-resizer::after{
  content:'';
  position:absolute;
  top:0;
  right:0;
  width:1px;
  height:100%;
  background:rgba(0,0,0,.24);
}
.picker-grid{
  display:grid;
  grid-template-rows:220px minmax(260px, 1fr);
  gap:10px;
  min-width:0;
}
.recipe-scroll{
  width:100%;
  max-width:100%;
  box-sizing:border-box;
  display:flex;
  gap:0;
  overflow-x:auto;
  overflow-y:hidden;
  padding:8px 6px;
  background:#fff;
  border:1px solid #8d8d8d;
}
.picker-scroll{ height:220px; }
.recipe-col{ flex:0 0 auto; min-width:0; padding-right:8px; box-sizing:border-box; }
.list-ul{ list-style:none; margin:0; padding:0; }
.list-li{
  padding:2px 4px;
  cursor:pointer;
  line-height:18px;
  font-weight:800;
  font-size:11px;
}
.polcon-picker .list-li,
.polcon-picker .cell-time,
.polcon-picker .head-cell,
.polcon-picker .head-label{
  font-size:10px;
}
.list-li.detail-row{ display:flex; align-items:center; overflow:hidden; }
.list-li.active{ background:#0a246a; color:#fff; }
.name-only,
.cell-name,
.cell-time{ display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cell-name{ padding-right:8px; }
.cell-time{ border-left:1px solid #c6c6c6; padding-left:8px; font-size:11px; font-weight:400; color:#555; }
.picker-preview{
  background:#fff;
  border-top:2px solid #808080;
  border-left:2px solid #808080;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
  padding:8px;
}
.picker-preview-title{ font-weight:900; margin-bottom:8px; }
.picker-preview-tablewrap{ max-height:260px; overflow:auto; }
.legacy-table{ width:100%; table-layout:fixed; border-collapse:collapse; }
.legacy-table th,
.legacy-table td{ border:1px solid #a9a9a9; padding:6px 8px; }
.legacy-empty{ padding:12px; color:#666; font-weight:900; }
.jobish-table th,
.jobish-table td{ text-align:center; }
.jobish-table th{ background:#d4d0c8; font-weight:900; }
.jobish-table td{ font-weight:400; }
.recipe-index-head,
.recipe-index-cell{ background:rgb(212, 208, 200); font-weight:900; text-align:center; }
.preview-table-large td{ font-size:17px; font-weight:400; }
.preview-table-large th{ font-size:15px; font-weight:900; }
.preview-table-large.pol-preview td{ font-size:14px; font-weight:400; }
.preview-table-large.polcon-preview td{ font-size:16px; font-weight:400; }
.preview-table-large.polcon-preview.pol-preview td{ font-size:14px; font-weight:400; }
.preview-table-large.polcon-preview th{ font-size:14px; font-weight:700; }
.picker-preview-title{ font-size:13px; }
.recipe-cell-text{ display:block; }
.preview-table-large.pol-preview .recipe-cell-text{ line-height:1.05; }
.recipe-cell-preline .recipe-cell-text{ white-space:pre-line; }
.recipe-line{ display:inline; font-size:inherit; font-weight:inherit; line-height:inherit; }
.recipe-unit{ font-size:.72em; line-height:1; }
.cell-cyan{ background:rgb(57, 230, 255); }
.cell-green{ background:rgb(0, 255, 0); }

.recipe-checkbox-cell{
  text-align:center;
}
:deep(.recipe-check-box){
  display:inline-block;
  width:14px;
  height:14px;
  border:1px solid #222;
  background:#fff;
  position:relative;
  box-sizing:border-box;
  vertical-align:middle;
}
:deep(.recipe-check-box.checked)::after{
  content:'';
  position:absolute;
  left:3px;
  top:0px;
  width:4px;
  height:8px;
  border:solid #000;
  border-width:0 2px 2px 0;
  transform:rotate(45deg);
}
:deep(.recipe-check-box.disabled){
  background:rgb(236, 233, 216);
  border-color:#666;
}
.cell-yellow{ background:rgb(255, 238, 0); }
.cell-disabled{ background:rgb(236, 233, 216); }
.cell-white{ background:#fff; }
</style>