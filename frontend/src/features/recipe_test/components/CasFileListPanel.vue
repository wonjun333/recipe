<template>
  <section
    class="w97-panel cas-panel"
    :class="{ 'pane-focus': paneFocus }"
    :style="panelStyle"
    @mousedown="emit('activate')"
    @contextmenu.prevent="emit('open-menu', $event)"
  >
    <div class="w97-titlebar">
      <span class="w97-title">CAS</span>
      <input
        class="win-input w97-find"
        :class="[queryClass, { compact: findCompact }]"
        :value="modelValue"
        placeholder="예: CAS40"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="emit('search')"
        @focus="emit('activate')"
      />
      <button class="win-btn iconbtn" type="button" @click="emit('search')" aria-label="search">🔍</button>

      <div class="view-mode-switch">
        <button
          class="view-btn"
          :class="{ active: listMode === 'name' }"
          type="button"
          title="Name Only"
          @click.stop="emit('update:listMode', 'name')"
        >☰</button>
        <button
          class="view-btn"
          :class="{ active: listMode === 'detail' }"
          type="button"
          title="Details"
          @click.stop="emit('update:listMode', 'detail')"
        >▤</button>
      </div>

      <span v-if="hint" class="find-inline-hint">{{ hint }}</span>
    </div>

    <div class="list-head">
      <div class="list-head-track" :style="{ transform: `translateX(${-scrollLeft}px)` }">
        <div
          v-for="idx in headerCount"
          :key="`cas-head-${idx}`"
          class="w97-col list-col-wide head-wide"
          :style="{ width: columnBlockWidth + 'px' }"
        >
          <template v-if="listMode === 'detail'">
            <div
              class="head-cell name-col"
              :style="{ width: colWidths.name + 'px' }"
              @click="emit('toggle-sort', 'name')"
            >
              <span class="head-label">File Name</span>
              <span class="sort-ind">{{ sortIndicator('name') }}</span>
              <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'name', event: $event })"></span>
            </div>
            <div
              class="head-cell time-col"
              :style="{ width: colWidths.modifiedAt + 'px' }"
              @click="emit('toggle-sort', 'modifiedAt')"
            >
              <span class="head-label">Modified Time</span>
              <span class="sort-ind">{{ sortIndicator('modifiedAt') }}</span>
              <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'modifiedAt', event: $event })"></span>
            </div>
          </template>
          <template v-else>
            <div
              class="head-cell name-col only-name-head"
              :style="{ width: colWidths.name + 'px' }"
              @click="emit('toggle-sort', 'name')"
            >
              <span class="head-label">File Name</span>
              <span class="sort-ind">{{ sortIndicator('name') }}</span>
              <span class="col-resizer" @mousedown.prevent.stop="emit('start-resize', { colKey: 'name', event: $event })"></span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="w97-scroll" :ref="setScrollRef" @scroll="emit('body-scroll')">
      <div class="w97-col list-col-wide" v-for="(col, idx) in columns" :key="idx" :style="{ width: columnBlockWidth + 'px' }">
        <ul class="w97-ul">
          <li
            v-for="item in col"
            :key="item.name"
            class="w97-li w97-li-row"
            :class="{ active: selectedIds.includes(item.name), 'detail-row': listMode === 'detail' }"
            @click="emit('item-click', { id: item.name, event: $event })"
            @contextmenu.prevent.stop="emit('item-contextmenu', { id: item.name, event: $event })"
            :ref="(el) => setItemRef(item.name, el)"
          >
            <template v-if="listMode === 'detail'">
              <span class="cell-name name-col" :style="{ width: colWidths.name + 'px' }" :title="item.name">
                {{ item.displayName }}
              </span>
              <span class="cell-time time-col" :style="{ width: colWidths.modifiedAt + 'px' }">
                {{ item.displayModifiedAt }}
              </span>
            </template>
            <template v-else>
              <span class="name-only" :style="{ width: colWidths.name + 'px' }" :title="item.name">
                {{ item.displayName }}
              </span>
            </template>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type CSSProperties, type PropType } from 'vue'

type SortKey = 'name' | 'modifiedAt'
type SortDir = 'asc' | 'desc' | null

type CasListViewItem = {
  name: string
  displayName: string
  displayModifiedAt: string
}

const props = defineProps({
  paneFocus: { type: Boolean, default: false },
  panelStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  modelValue: { type: String, default: '' },
  queryClass: { type: String, default: '' },
  findCompact: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  scrollLeft: { type: Number, default: 0 },
  listMode: {
    type: String as PropType<'name' | 'detail'>,
    default: 'name',
  },
  columns: {
    type: Array as PropType<CasListViewItem[][]>,
    default: () => [],
  },
  selectedIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  colWidths: {
    type: Object as PropType<{ name: number; modifiedAt: number }>,
    required: true,
  },
  sortKey: {
    type: String as PropType<SortKey | null>,
    default: null,
  },
  sortDir: {
    type: String as PropType<SortDir>,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'activate'): void
  (e: 'open-menu', event: MouseEvent): void
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
  (e: 'toggle-sort', key: SortKey): void
  (e: 'start-resize', payload: { colKey: SortKey; event: MouseEvent }): void
  (e: 'body-scroll'): void
  (e: 'item-click', payload: { id: string; event: MouseEvent }): void
  (e: 'item-contextmenu', payload: { id: string; event: MouseEvent }): void
  (e: 'register-item-ref', payload: { id: string; el: HTMLElement | null }): void
  (e: 'register-scroll-el', el: HTMLDivElement | null): void
  (e: 'update:listMode', mode: 'name' | 'detail'): void
}>()

const scrollEl = ref<HTMLDivElement | null>(null)
const headerCount = computed(() => Math.max(props.columns.length, 1))
const columnBlockWidth = computed(() => ((props.listMode === 'detail' ? props.colWidths.name + props.colWidths.modifiedAt : props.colWidths.name) + 10))

function sortIndicator(key: SortKey) {
  if (props.sortKey !== key || !props.sortDir) return ''
  return props.sortDir === 'asc' ? '▲' : '▼'
}

function setItemRef(id: string, el: Element | null) {
  emit('register-item-ref', { id, el: el instanceof HTMLElement ? el : null })
}

function setScrollRef(el: Element | null) {
  scrollEl.value = el instanceof HTMLDivElement ? el : null
  emit('register-scroll-el', scrollEl.value)
}

onMounted(() => {
  emit('register-scroll-el', scrollEl.value)
})

onBeforeUnmount(() => {
  emit('register-scroll-el', null)
})
</script>

<style scoped>
.pane-focus{ box-shadow:0 0 0 3px rgba(53,119,255,.16); }
.w97-panel{
  background:#c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #808080;
  border-bottom:2px solid #808080;
  padding:6px;
  display:flex;
  flex-direction:column;
  min-width:0;
}
.w97-titlebar{
  display:flex;
  align-items:center;
  gap:8px;
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:6px 8px;
  font-weight:900;
}
.w97-title{ min-width:42px; }
.win-input{
  height:22px;
  padding:2px 6px;
  background:#fff;
  border-top:2px solid #808080;
  border-left:2px solid #808080;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
}
.w97-find{ width:180px; min-width:0; transition:width .16s ease; }
.w97-find.compact{ width:162px; }
.win-input.find-ok{ background:#e8f6e9; box-shadow:inset 0 0 0 1px #2f8f46; }
.win-input.find-bad{ background:#fde8e8; box-shadow:inset 0 0 0 1px #c02f2f; }
.win-btn{
  height:24px;
  background:#c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  cursor:pointer;
}
.win-btn:active{ border-top:2px solid #404040; border-left:2px solid #404040; border-right:2px solid #fff; border-bottom:2px solid #fff; }
.iconbtn{ width:34px; min-width:34px; display:flex; align-items:center; justify-content:center; padding:0; }
.view-mode-switch{ display:flex; gap:4px; flex-shrink:0; }
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
.find-inline-hint{ margin-left:4px; color:#7a0000; font-weight:900; font-size:12px; white-space:nowrap; }
.list-head{
  display:flex;
  margin-top:8px;
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:3px 8px 1px 8px;
  font-weight:700;
  font-size:12px;
  overflow:hidden;
}
.list-head-track{ display:flex; width:max-content; will-change:transform; }
.head-wide{ display:flex; flex:0 0 auto; padding-right:10px; box-sizing:border-box; }
.head-cell{
  position:relative;
  cursor:pointer;
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
.head-label{ flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.head-cell.time-col{ padding-left:8px; }
.only-name-head{ padding-left:6px; }
.sort-ind{ min-width:10px; font-size:12px; }
.col-resizer{ position:absolute; top:0; right:0; width:10px; height:100%; cursor:col-resize; }
.col-resizer::after{ content:''; position:absolute; top:0; right:0; width:1px; height:100%; background:rgba(0,0,0,.24); }
.w97-scroll{
  margin-top:2px;
  background:#fff;
  border:1px solid #8d8d8d;
  flex:1;
  overflow:auto;
  padding:8px;
  display:flex;
  gap:0;
}
.w97-col{ flex:0 0 auto; min-width:0; }
.list-col-wide{ flex:0 0 auto; padding-right:10px; box-sizing:border-box; }
.w97-ul{ list-style:none; padding:0; margin:0; }
.w97-li{ padding:0; margin:0; }
.w97-li-row{
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
.w97-li-row.detail-row{ overflow:hidden; }
.w97-li-row.active{ background:#0a246a; color:#fff; }
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
.cell-name{ padding-right:8px; border-right:1px solid #c6c6c6; }
.cell-time{
  padding-left:8px;
  font-size:12px;
  font-weight:700;
  color:#555;
}
</style>