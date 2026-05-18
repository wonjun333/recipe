<template>
  <Transition name="slideDown">
    <section
      v-if="open"
      class="bottom-recipe"
      @mousedown="emit('activate')"
      @click.capture="emit('area-click')"
      @contextmenu.prevent="emit('open-menu', $event)"
      :ref="setRootRef"
    >
      <div class="legacy-window">
        <div class="legacy-top">
          <div class="legacy-titlebar">
            <div class="title-wrap">
              <span v-if="computedTitlePrefix" class="legacy-title">{{ computedTitlePrefix }}</span>
              <span class="legacy-title-main">{{ titleBase }}</span>
              <span v-if="emphasizeText" class="title-for">for</span>
              <strong v-if="emphasizeText" class="title-emphasis">{{ emphasizeText }}</strong>
            </div>

            <input
              class="win-input find-input"
              :class="findClass"
              :value="findModel"
              placeholder="예: RECIPE13"
              @input="emit('update:findModel', ($event.target as HTMLInputElement).value)"
              @keydown.enter="emit('apply-find')"
              @focus="emit('activate')"
            />
            <button class="win-btn iconbtn" type="button" @click.stop="emit('apply-find')" aria-label="search">🔍</button>

            <div class="view-mode-switch">
              <button
                class="view-btn"
                :class="{ active: listMode === 'name' }"
                type="button"
                aria-label="name mode"
                title="Name Only"
                @click.stop="emit('update:listMode', 'name')"
              >☰</button>
              <button
                class="view-btn"
                :class="{ active: listMode === 'detail' }"
                type="button"
                aria-label="detail mode"
                title="Details"
                @click.stop="emit('update:listMode', 'detail')"
              >▤</button>
            </div>

            <div class="spacer"></div>
          </div>

          <div class="okhide">
            <button class="win-btn" type="button" @click="emit('close')">OK</button>
            <button class="win-btn" type="button" @click="emit('close')">Hide</button>
          </div>
        </div>

        <div class="list-head">
          <div class="list-head-track" :style="{ transform: `translateX(${-scrollLeft}px)` }">
            <div
              v-for="idx in headerCount"
              :key="`recipe-head-${idx}`"
              class="w97-col list-col-wide head-wide"
              :style="{ width: columnBlockWidth + 'px' }"
            >
              <template v-if="listMode === 'detail'">
                <div
                  class="head-cell name-col"
                  :style="{ width: colWidths.name + 'px' }"
                >
                  <span class="head-label">File Name</span>
                  <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'name', event: $event })"></span>
                </div>
                <div
                  class="head-cell time-col"
                  :style="{ width: colWidths.modifiedAt + 'px' }"
                >
                  <span class="head-label">Modified Time</span>
                  <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'modifiedAt', event: $event })"></span>
                </div>
              </template>
              <template v-else>
                <div
                  class="head-cell name-col only-name-head"
                  :style="{ width: colWidths.name + 'px' }"
                >
                  <span class="head-label">File Name</span>
                  <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'name', event: $event })"></span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="recipe-scroll" :class="{ compact: listMode === 'name' }" :ref="setScrollRef" @scroll="emit('body-scroll')">
          <div class="recipe-col list-col-wide" v-for="(col, idx) in recipeCols" :key="idx" :style="{ width: columnBlockWidth + 'px' }">
            <ul class="list-ul">
              <li
                v-for="r in col"
                :key="r.id"
                class="list-li"
                :class="{ active: selectedRecipeIds.includes(r.id), 'detail-row': listMode === 'detail' }"
                @click="emit('pick', { recipeId: r.id, event: $event })"
                @contextmenu.prevent.stop="emit('item-contextmenu', { recipeId: r.id, event: $event })"
                :ref="(el) => setItemRef(r.id, el)"
              >
                <template v-if="listMode === 'detail'">
                  <span class="cell-name name-col" :style="{ width: colWidths.name + 'px' }" :title="displayListName(r.name)">{{ displayListName(r.name) }}</span>
                  <span class="cell-time time-col" :style="{ width: colWidths.modifiedAt + 'px' }">{{ r.modifiedAt || '' }}</span>
                </template>
                <template v-else>
                  <span class="name-only" :style="{ width: colWidths.name + 'px' }" :title="displayListName(r.name)">{{ displayListName(r.name) }}</span>
                </template>
              </li>
            </ul>
          </div>
        </div>

        <div class="grid-wrap" v-if="selectedRecipeSingle">
          <div class="recipe-meta" v-if="selectedRecipeSingle.modifiedAt">Modified Time: <strong>{{ selectedRecipeSingle.modifiedAt }}</strong></div>
          <table
            v-if="displayPreviewColumns.length"
            class="legacy-table preview-table-large"
            :class="{
              'jobish-table': richRecipeKinds.includes(selectedRecipeSingle?.sourceKind || ''),
              'pol-preview': isPolPreview,
              'polcon-preview': isPolConPreview,
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
              <tr v-for="(row, i) in selectedRecipeSingle.rows" :key="i">
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
          <div v-else class="legacy-empty preview-empty">Preview not available for this file type.</div>
        </div>

        <div v-else class="legacy-empty">
          <div v-if="selectedRecipeIds.length > 1">다중 선택 상태라 컨텐츠를 표시하지 않습니다.</div>
          <div v-else>Recipe를 선택하세요.</div>
        </div>

        <div class="recipe-bottom-pad"></div>
      </div>

      <div class="page-bottom-pad"></div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, type PropType } from 'vue'
import type { RecipeDetail } from '../api/recipeTestApi'

const props = defineProps({
  open: { type: Boolean, default: false },
  activePlaten: { type: Number, default: 1 },
  findModel: { type: String, default: '' },
  findClass: { type: String, default: '' },
  recipeCols: {
    type: Array as PropType<RecipeDetail[][]>,
    default: () => [],
  },
  selectedRecipeIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  selectedRecipeSingle: {
    type: Object as PropType<RecipeDetail | null>,
    default: null,
  },
  titleBase: { type: String, default: 'Recipe' },
  emphasizeText: { type: String, default: '' },
  editMode: { type: Boolean, default: false },
  listMode: {
    type: String as PropType<'name' | 'detail'>,
    default: 'name',
  },
  scrollLeft: { type: Number, default: 0 },
  colWidths: {
    type: Object as PropType<{ name: number; modifiedAt: number }>,
    default: () => ({ name: 240, modifiedAt: 120 }),
  },
})

const emit = defineEmits<{
  (e: 'activate'): void
  (e: 'area-click'): void
  (e: 'open-menu', event: MouseEvent): void
  (e: 'update:findModel', value: string): void
  (e: 'apply-find'): void
  (e: 'close'): void
  (e: 'pick', payload: { recipeId: string; event: MouseEvent }): void
  (e: 'item-contextmenu', payload: { recipeId: string; event: MouseEvent }): void
  (e: 'register-item-ref', payload: { id: string; el: HTMLElement | null }): void
  (e: 'register-root', el: HTMLElement | null): void
  (e: 'update:listMode', mode: 'name' | 'detail'): void
  (e: 'body-scroll'): void
  (e: 'start-resize', payload: { colKey: 'name' | 'modifiedAt'; event: MouseEvent }): void
  (e: 'register-scroll-el', el: HTMLDivElement | null): void
}>()

const computedTitlePrefix = computed(() => (props.editMode ? 'Select' : ''))

const richRecipeKinds = ['megasonics', 'brush1', 'brush2', 'vaporDryer'] as const
const isPolPreview = computed(() => String((props.selectedRecipeSingle as any)?.meta?.sourceType ?? '') === 'pol')
const isPolConPreview = computed(() => ['pol', 'con'].includes(String((props.selectedRecipeSingle as any)?.meta?.sourceType ?? '')))

function stripKnownRecipeExt(name: unknown) {
  return String(name ?? '').trim().replace(/\.(br|meg|dryr|drpr|pol|con|alg|seg|scx|cln)$/i, '')
}

function displayListName(name: unknown) {
  return stripKnownRecipeExt(name)
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
  const sourceKind = props.selectedRecipeSingle?.sourceKind ?? ''
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
    'cell-error': ui.tone === 'error',
    'recipe-cell-center': ui.align === 'center',
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

const headerCount = computed(() => Math.max(props.recipeCols.length, 1))
const columnBlockWidth = computed(() => ((props.listMode === 'detail' ? props.colWidths.name + props.colWidths.modifiedAt : props.colWidths.name) + 8))
const displayPreviewColumns = computed(() => (props.selectedRecipeSingle?.columns ?? []).filter(c => c !== '#' && c !== '__ui__'))

function previewColumnStyle(column: string) {
  const sourceKind = props.selectedRecipeSingle?.sourceKind ?? ''
  const sourceType = String((props.selectedRecipeSingle as any)?.meta?.sourceType ?? '')

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
    if (column === 'End By') return { width: '11%' }
    if (column === 'Platen RPM' || column === 'Head RPM') return { width: '8%' }
    if (column === 'Head Sweep') return { width: '11%' }
    if (column.startsWith('Z') || column === 'RR State') return { width: '7%' }
    if (column.startsWith('L')) return { width: '8%' }
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

function setRootRef(el: Element | null) {
  emit('register-root', el instanceof HTMLElement ? el : null)
}

function setScrollRef(el: Element | null) {
  emit('register-scroll-el', el instanceof HTMLDivElement ? el : null)
}

onBeforeUnmount(() => {
  emit('register-root', null)
  emit('register-scroll-el', null)
})
</script>

<style scoped>
.bottom-recipe{
  overflow-x:hidden;
  padding-bottom:140px;
}
.legacy-window{
  max-width:100%;
  overflow-x:hidden;
  background:#c0c0c0;
  border:1px solid #8d8d8d;
  padding:8px 8px;
  border-radius:6px;
}
.legacy-top{
  display:grid;
  grid-template-columns:1fr 90px;
  gap:10px;
  align-items:start;
  margin-bottom:6px;
}
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
.title-wrap{
  display:flex;
  align-items:center;
  gap:6px;
  min-width:0;
  max-width:430px;
  white-space:nowrap;
}
.legacy-title,
.legacy-title-main,
.title-for{
  font-weight:900;
}
.title-emphasis{
  font-weight:1000;
  font-size:13px;
}
.spacer{ flex:1; }
.okhide{
  display:flex;
  flex-direction:column;
  gap:6px;
}
.win-input{
  height:22px;
  padding:2px 6px;
  background:#fff;
  border-top:2px solid #808080;
  border-left:2px solid #808080;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
}
.win-input.find-ok{
  background:#e8f6e9;
  box-shadow:inset 0 0 0 1px #2f8f46;
}
.win-input.find-bad{
  background:#fde8e8;
  box-shadow:inset 0 0 0 1px #c02f2f;
}
.find-input{ width:220px; }
.win-btn{
  height:24px;
  background:#c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  cursor:pointer;
}
.win-btn:active{
  border-top:2px solid #404040;
  border-left:2px solid #404040;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
}
.iconbtn{
  width:34px;
  min-width:34px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
}
.view-mode-switch{
  display:flex;
  gap:4px;
}
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
.view-btn.active{
  background:#0a246a;
  color:#fff;
}
.list-head{
  display:flex;
  margin-top:2px;
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:3px 8px 1px 8px;
  font-weight:700;
  font-size:12px;
  overflow:hidden;
}
.list-head-track{ display:flex; width:max-content; will-change:transform; }
.head-wide{ display:flex; flex:0 0 auto; padding-right:8px; box-sizing:border-box; }
.head-cell{
  position:relative;
  display:flex;
  align-items:center;
  gap:4px;
  font-size:12px;
  font-weight:700;
  min-width:0;
  height:22px;
  box-sizing:border-box;
  padding:0 14px 0 6px;
}
.head-label{
  flex:1 1 auto;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:10px;
}
.head-cell.time-col{
  padding-left:8px;
}
.only-name-head{
  padding-left:6px;
}
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
.recipe-scroll{
  width:100%;
  display:flex;
  gap:0;
  overflow-x:auto;
  overflow-y:hidden;
  padding:8px 8px;
  background:#fff;
  border:1px solid #8d8d8d;
  height:192px;
}
.recipe-scroll.compact{
  height:192px;
  margin-top:2px;
}
.recipe-col{
  flex:0 0 auto;
  min-width:0;
  padding-right:8px;
  box-sizing:border-box;
}
.list-ul{ list-style:none; margin:0; padding:0; }
.list-li{
  padding:0;
  cursor:pointer;
  line-height:18px;
  font-weight:700;
  font-size:12px;
  min-height:22px;
  height:22px;
  display:flex;
  align-items:center;
  box-sizing:border-box;
}
.list-li.detail-row{
  overflow:hidden;
}
.list-li.active{
  background:#0a246a;
  color:#fff;
}
.name-only,
.cell-name,
.cell-time{
  display:block;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  box-sizing:border-box;
  min-width:0;
  height:22px;
  line-height:18px;
  padding:2px 6px;
}
.name-only{
  max-width:100%;
}
.cell-name{ padding-right:8px; border-right:1px solid #c6c6c6; }
.cell-time{
  padding-left:8px;
  font-size:12px;
  font-weight:700;
  color:#555;
}
.grid-wrap{
  width:100%;
  background:#fff;
  border:1px solid #8d8d8d;
  overflow:visible;
  max-height:none;
  margin-top:8px;
}
.recipe-meta{
  padding:6px 8px;
  border-bottom:1px solid #d1d5db;
  background:#f8fafc;
  font-size:12px;
  font-weight:900;
}
.legacy-table{
  width:100%;
  table-layout:fixed;
  border-collapse:collapse;
  font-size:20px;
}
.legacy-table th,
.legacy-table td{
  border:1px solid #a9a9a9;
  padding:6px 8px;
}
.legacy-empty{
  margin-top:8px;
  background:#fff;
  border:1px dashed #8d8d8d;
  padding:12px;
  color:#555;
  font-weight:900;
}
.recipe-bottom-pad{ height:10px; }
.page-bottom-pad{ height:360px; }
.slideDown-enter-active,
.slideDown-leave-active{
  transition:opacity .22s ease, transform .22s ease;
}
.slideDown-enter-from,
.slideDown-leave-to{
  opacity:0;
  transform:translateY(8px);
}
.slideDown-enter-to,
.slideDown-leave-from{
  opacity:1;
  transform:translateY(0);
}
.jobish-table th,
.jobish-table td{
  text-align:center;
}
.jobish-table th{
  background:rgb(212, 208, 200);
  font-weight:900;
}
.polcon-preview th{
  background:rgb(212, 208, 200);
}

.recipe-index-head,
.recipe-index-cell{
  background:rgb(212, 208, 200);
  font-weight:900;
  text-align:center;
}

.preview-table-large td{
  font-size:20px;
  font-weight:400;
}
.preview-table-large.pol-preview td{
  font-size:16px;
  font-weight:400;
}
.preview-table-large.polcon-preview td{
  font-size:18px;
  font-weight:400;
}
.preview-table-large.polcon-preview.pol-preview td{
  font-size:16px;
  font-weight:400;
}
.preview-table-large th{
  font-size:18px;
  font-weight:900;
}
.recipe-cell-text{
  display:block;
}
.recipe-line{
  display:inline;
  font-size:inherit;
  font-weight:inherit;
  line-height:inherit;
}
.preview-table-large.pol-preview .recipe-cell-text{
  line-height:1.05;
}
.recipe-cell-center{
  text-align:center;
}
.recipe-cell-preline .recipe-cell-text{
  white-space:pre-line;
}
.recipe-subline{
  display:inline-block;
  font-size:.72em;
  line-height:1.1;
}
.cell-cyan{
  background:rgb(57, 230, 255);
}
.cell-green{
  background:rgb(0, 255, 0);
}

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
.cell-error{ background:rgb(255, 102, 102); }
</style>