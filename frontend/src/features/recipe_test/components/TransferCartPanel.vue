<template>
  <Transition name="cartDrop">
    <section v-if="open" class="cart-panel" :class="{ wide: wideLayout }">
      <div class="cart-head">
        <div>
          <div class="cart-title">Shopping Cart</div>
          <div class="cart-sub">Move To Where?</div>
        </div>
        <div class="cart-meta">
          <div>Maker: <strong>{{ cartMaker || '-' }}</strong></div>
          <div>Model Group: <strong>{{ cartModelGroup || '-' }}</strong></div>
        </div>
      </div>

      <div class="cart-sections">
        <div class="cart-section" v-for="section in sections" :key="section.kind">
          <div class="section-head">
            <div class="section-title">{{ section.label }} <span class="count">({{ section.items.length }})</span></div>
          </div>

          <div class="section-columns">
            <span>File Name</span>
            <span>From 설비</span>
          </div>

          <div class="section-grid" :class="{ 'two-col': section.items.length > 5 }">
            <div v-if="!section.items.length" class="empty-card">Empty</div>
            <div v-for="item in section.items" :key="item.key" class="cart-row-card">
              <button class="x-btn" type="button" aria-label="remove" @click="emit('remove-item', item.key)">✕</button>
              <div class="cart-file-name" :title="item.name">{{ item.name }}</div>
              <div class="cart-file-meta">{{ item.sourceEqpId }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="target-wrap">
        <div class="target-head">
          <div class="target-title">Move To Where?</div>
          <button class="mini-btn add-btn" type="button" @click="addRow">＋</button>
        </div>

        <div class="target-rows" :class="{ 'two-col': rows.length > 5 }">
          <div v-for="row in rows" :key="row.uid" class="target-row">
            <select class="target-select" :value="row.line" @change="onLineChange(row.uid, ($event.target as HTMLSelectElement).value)">
              <option value="">Line</option>
              <option v-for="v in lineOptions" :key="`line-${row.uid}-${v}`" :value="v">{{ v }}</option>
            </select>

            <select class="target-select" :value="row.team" @change="onTeamChange(row.uid, ($event.target as HTMLSelectElement).value)">
              <option value="">분임조</option>
              <option v-for="v in teamOptionsForRow(row)" :key="`team-${row.uid}-${v}`" :value="v">{{ v }}</option>
            </select>

            <select class="target-select eqp-select" :value="row.eqpId" @change="onEqpChange(row.uid, ($event.target as HTMLSelectElement).value)">
              <option value="">설비ID</option>
              <option v-for="opt in eqpOptionsForRow(row)" :key="`eqp-${row.uid}-${opt.eqpId}`" :value="opt.eqpId">
                {{ opt.eqpId }}
              </option>
            </select>

            <button class="mini-btn remove-btn" type="button" @click="removeRow(row.uid)">✕</button>
          </div>
        </div>
      </div>

      <div class="cart-actions">
        <button class="clear-btn" type="button" @click="emit('clear')">Clear Cart</button>
        <button class="move-btn" type="button" :disabled="moving || !totalCount || !normalizedSelectedTargetEqpIds.length" @click="emit('move')">
          {{ moving ? 'Moving...' : 'Move Selected Files' }}
        </button>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue'

type CartViewItem = {
  key: string
  kind: 'cas' | 'job' | 'recipe'
  name: string
  sourceEqpId: string
}

type EqpOption = {
  line: string
  team: string
  eqpId: string
  maker?: string
  modelGroup?: string
}

type TargetRow = {
  uid: number
  line: string
  team: string
  eqpId: string
}

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array as PropType<CartViewItem[]>, default: () => [] },
  targetOptions: { type: Array as PropType<EqpOption[]>, default: () => [] },
  selectedTargetEqpIds: { type: Array as PropType<string[]>, default: () => [] },
  moving: { type: Boolean, default: false },
  cartMaker: { type: String, default: '' },
  cartModelGroup: { type: String, default: '' },
})

const emit = defineEmits<{
  (e: 'set-target-eqp-ids', eqpIds: string[]): void
  (e: 'remove-item', key: string): void
  (e: 'clear'): void
  (e: 'move'): void
}>()

const sections = computed(() => [
  { kind: 'cas', label: 'Cas', items: props.items.filter(x => x.kind === 'cas') },
  { kind: 'job', label: 'Job', items: props.items.filter(x => x.kind === 'job') },
  { kind: 'recipe', label: 'Recipe', items: props.items.filter(x => x.kind === 'recipe') },
])
const totalCount = computed(() => props.items.length)
const lineOptions = computed(() => Array.from(new Set(props.targetOptions.map(x => x.line).filter(Boolean))).sort())
const wideLayout = computed(() => sections.value.some(section => section.items.length > 5) || rows.value.length > 5)

const rows = ref<TargetRow[]>([])
let rowUid = 1

const normalizedSelectedTargetEqpIds = computed(() => Array.from(new Set(rows.value.map(r => r.eqpId).filter(Boolean))))

function makeEmptyRow(): TargetRow {
  return { uid: rowUid++, line: '', team: '', eqpId: '' }
}

function syncRowsFromProps() {
  const next = props.selectedTargetEqpIds
    .map(id => props.targetOptions.find(x => x.eqpId === id))
    .filter((x): x is EqpOption => !!x)
    .map(opt => ({ uid: rowUid++, line: opt.line || '', team: opt.team || '', eqpId: opt.eqpId }))

  rows.value = next.length ? next : [makeEmptyRow()]
}

watch(
  [() => props.selectedTargetEqpIds.join('|'), () => props.targetOptions.length, () => props.open],
  () => { syncRowsFromProps() },
  { immediate: true }
)

function emitTargets() {
  emit('set-target-eqp-ids', normalizedSelectedTargetEqpIds.value)
}

function teamOptionsForRow(row: TargetRow) {
  const items = props.targetOptions.filter(x => !row.line || x.line === row.line)
  return Array.from(new Set(items.map(x => x.team).filter(Boolean))).sort()
}

function eqpOptionsForRow(row: TargetRow) {
  const taken = new Set(rows.value.filter(r => r.uid !== row.uid).map(r => r.eqpId).filter(Boolean))
  return props.targetOptions
    .filter(x => !row.line || x.line === row.line)
    .filter(x => !row.team || x.team === row.team)
    .filter(x => !taken.has(x.eqpId) || x.eqpId === row.eqpId)
    .sort((a, b) => a.eqpId.localeCompare(b.eqpId, ['ko-KR', 'en-US'], { numeric: true, sensitivity: 'base' }))
}

function onLineChange(uid: number, value: string) {
  const row = rows.value.find(r => r.uid === uid)
  if (!row) return
  row.line = value
  if (row.team && !teamOptionsForRow(row).includes(row.team)) row.team = ''
  if (row.eqpId && !eqpOptionsForRow(row).some(x => x.eqpId === row.eqpId)) row.eqpId = ''
  emitTargets()
}

function onTeamChange(uid: number, value: string) {
  const row = rows.value.find(r => r.uid === uid)
  if (!row) return
  row.team = value
  if (row.team && !row.line) {
    const matched = props.targetOptions.find(x => x.team === row.team)
    if (matched?.line) row.line = matched.line
  }
  if (row.eqpId && !eqpOptionsForRow(row).some(x => x.eqpId === row.eqpId)) row.eqpId = ''
  emitTargets()
}

function onEqpChange(uid: number, value: string) {
  const row = rows.value.find(r => r.uid === uid)
  if (!row) return
  row.eqpId = value
  const matched = props.targetOptions.find(x => x.eqpId === value)
  if (matched) {
    row.line = matched.line || row.line
    row.team = matched.team || row.team
  }
  emitTargets()
}

function addRow() {
  rows.value = [...rows.value, makeEmptyRow()]
}

function removeRow(uid: number) {
  rows.value = rows.value.filter(r => r.uid !== uid)
  if (!rows.value.length) rows.value = [makeEmptyRow()]
  emitTargets()
}
</script>

<style scoped>
.cart-panel{
  width:min(420px, calc(100vw - 24px));
  margin-left:auto;
  background:#fff;
  border:1px solid #e6e8ef;
  border-radius:14px;
  box-shadow:0 16px 36px rgba(10,20,40,.12);
  padding:12px;
  display:grid;
  gap:10px;
}
.cart-panel.wide{
  width:min(820px, calc(100vw - 24px));
}
.cart-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
}
.cart-title{ font-size:15px; font-weight:900; }
.cart-sub{ font-size:11px; color:#6b7280; margin-top:2px; }
.cart-meta{ display:grid; gap:3px; font-size:11px; color:#374151; }
.cart-sections{
  display:grid;
  gap:8px;
  max-height:min(42vh, 360px);
  overflow:auto;
  padding-right:2px;
}
.cart-section{ background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px; }
.section-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.section-title{ font-size:12px; font-weight:900; margin-bottom:4px; }
.count{ color:#64748b; }
.section-columns{
  display:grid;
  grid-template-columns:minmax(0, 1fr) 112px;
  gap:8px;
  font-size:10px;
  color:#64748b;
  font-weight:900;
  margin-bottom:6px;
  padding:0 24px 0 6px;
}
.section-grid{
  display:grid;
  grid-template-columns:1fr;
  gap:6px;
}
.section-grid.two-col{
  grid-template-columns:repeat(2, minmax(0, 1fr));
}
.cart-row-card{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0, 1fr) 112px;
  gap:8px;
  align-items:center;
  background:#fff;
  border:1px solid #d8dee9;
  border-radius:99px;
  padding:6px 30px 6px 6px;
  min-width:0;
}
.cart-file-name,
.cart-file-meta{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:11px;
}
.cart-file-name{ font-weight:900; }
.cart-file-meta{ color:#475569; }
.x-btn,
.mini-btn,
.clear-btn,
.move-btn{
  height:26px;
  border-radius:9px;
  border:1px solid #cbd5e1;
  background:#fff;
  padding:0 9px;
  font-weight:900;
  cursor:pointer;
}
.x-btn{
  position:absolute;
  top:5px;
  right:5px;
  width:18px;
  min-width:18px;
  height:18px;
  padding:0;
  border-radius:999px;
  line-height:1;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:11px;
}
.empty-card{
  text-align:center;
  color:#6b7280;
  background:#fff;
  border:1px dashed #d8dee9;
  border-radius:9px;
  padding:10px;
  font-size:11px;
}
.target-wrap{ background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:10px; }
.target-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
.target-title{ font-weight:900; font-size:12px; }
.target-rows{ display:grid; gap:8px; }
.target-rows.two-col{ grid-template-columns:repeat(2, minmax(0, 1fr)); }
.target-row{ display:grid; grid-template-columns:1fr 1fr 1.1fr 34px; gap:6px; align-items:center; }
.target-select{
  height:32px;
  padding:0 8px;
  border:1px solid #cfd6e4;
  border-radius:10px;
  outline:none;
  background:#fff;
}
.target-select:focus{ border-color:#6b8cff; box-shadow:0 0 0 3px rgba(107,140,255,.14); }
.eqp-select{ min-width:0; }
.add-btn,
.remove-btn{ width:32px; min-width:32px; padding:0; display:flex; align-items:center; justify-content:center; }
.cart-actions{ display:flex; justify-content:flex-end; gap:8px; }
.move-btn{ background:#111827; color:#fff; border-color:#111827; }
.move-btn:disabled{ opacity:.5; cursor:not-allowed; }
.cartDrop-enter-active,
.cartDrop-leave-active{ transition:opacity .18s ease, transform .18s ease; }
.cartDrop-enter-from,
.cartDrop-leave-to{ opacity:0; transform:translateY(-8px) scale(.96); transform-origin:top right; }
.cartDrop-enter-to,
.cartDrop-leave-from{ opacity:1; transform:translateY(0) scale(1); }
@media (max-width: 920px){
  .cart-panel.wide{ width:min(420px, calc(100vw - 24px)); }
  .section-grid.two-col,
  .target-rows.two-col{ grid-template-columns:1fr; }
}
</style>