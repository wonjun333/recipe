<template>
  <section
    class="cas-content"
    :class="{ open: visible, 'pane-focus': paneFocus }"
    :style="panelStyle"
    @mousedown="emit('activate')"
    @contextmenu.prevent="emit('open-menu', $event)"
    :ref="setRootRef"
  >
    <Transition name="slideCard">
      <div v-if="visible" class="cas-win97">
        <div class="cas-bar">
          <div class="cas-bar-left">Cas Content</div>
          <div class="cas-bar-right">
            <span class="cas-id">{{ casIdDisplay }}</span>
            <span v-if="editMode" class="edit-pill">EDIT</span>
          </div>
        </div>

        <div class="cas-tabs">
          <button class="win-tab" :class="{ active: tab==='standard' }" @click="emit('update:tab', 'standard')">Standard</button>
          <button class="win-tab" :class="{ active: tab==='pre' }" @click="emit('update:tab', 'pre')">Pre-Polish</button>
          <button class="win-tab" :class="{ active: tab==='gating' }" @click="emit('update:tab', 'gating')">Gating &amp; Rework</button>
          <button class="win-tab" :class="{ active: tab==='post' }" @click="emit('update:tab', 'post')">Post Rework</button>
        </div>

        <div class="cas-body">
          <div v-if="tab==='standard'">
            <div class="cas-std-bar">
              <div class="cas-std-hint">Slot # (1~24) / Job Name</div>
              <div class="cas-std-actions">
                <button v-if="!editMode" class="win-btn save-btn" @click="emit('save-as')">Save As</button>
                <button v-if="!editMode" class="win-btn save-btn" @click="emit('enter-edit')">Edit</button>
                <template v-else>
                  <button class="win-btn save-btn" @click="emit('save')">Save</button>
                  <button class="win-btn" @click="emit('cancel')">Cancel</button>
                </template>
              </div>
            </div>

            <div class="cas-table-wrap">
              <table class="cas-table">
                <colgroup>
                  <col v-for="(w, i) in tableColWidths" :key="`cas-col-${i}`" :style="{ width: `${w}px` }" />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      v-for="(label, i) in tableHeaders"
                      :key="label"
                      :class="{ clickable: i === 1 }"
                      @click="emit('header-click', i)"
                    >
                      <span class="th-label">{{ label }}</span>
                      <span
                        v-if="i < tableHeaders.length - 1"
                        class="col-resizer"
                        @mousedown.prevent.stop="emit('start-resize', { index: i, event: $event })"
                      ></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in tableRows" :key="row.slot">
                    <td class="center cas-td">{{ row.slot }}</td>
                    <td
                      class="center cas-td cas-cell"
                      :class="{ sel: editMode && selectedSlots.includes(row.slot) }"
                      @click="emit('cell-click', { slot: row.slot, jobName: row.jobName, event: $event })"
                    >
                      {{ displayJobName(row.jobName) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="editMode" class="cas-edit-hint">
              Job Name 셀 선택 후 Job List에서 Job 클릭 → 선택된 Slot들의 Job Name이 변경됩니다. (Ctrl/Shift)
            </div>
          </div>

          <div v-else class="cas-todo">(준비중) {{ tabLabel }}</div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType } from 'vue'

type CasTab = 'standard' | 'pre' | 'gating' | 'post'

defineProps({
  visible: { type: Boolean, default: false },
  paneFocus: { type: Boolean, default: false },
  panelStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  casIdDisplay: { type: String, default: '' },
  editMode: { type: Boolean, default: false },
  tab: { type: String as PropType<CasTab>, default: 'standard' },
  tabLabel: { type: String, default: 'Standard' },
  tableRows: {
    type: Array as PropType<Array<{ slot: number; jobName: string }>>,
    default: () => [],
  },
  tableHeaders: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  tableColWidths: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
  selectedSlots: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
})

const emit = defineEmits<{
  (e: 'activate'): void
  (e: 'open-menu', event: MouseEvent): void
  (e: 'register-root', el: HTMLElement | null): void
  (e: 'update:tab', tab: CasTab): void
  (e: 'save-as'): void
  (e: 'enter-edit'): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'header-click', index: number): void
  (e: 'cell-click', payload: { slot: number; jobName: string; event: MouseEvent }): void
  (e: 'start-resize', payload: { index: number; event: MouseEvent }): void
}>()

function displayJobName(name: string) {
  const text = String(name ?? '').trim()
  return text.toLowerCase().endsWith('.job') ? text.slice(0, -4) : text
}

function setRootRef(el: Element | null) {
  emit('register-root', el instanceof HTMLElement ? el : null)
}
</script>

<style scoped>
.pane-focus{
  box-shadow:0 0 0 3px rgba(53,119,255,.16);
}
.cas-win97{
  width:max-content;
  box-sizing:border-box;
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:8px;
  display:flex;
  flex-direction:column;
  gap:8px;
  position:relative;
  height:100%;
}
.cas-bar{
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:6px 8px;
  display:flex;
  justify-content:space-between;
  font-weight:900;
}
.cas-bar-right{
  display:flex;
  align-items:center;
  gap:6px;
}
.cas-id{
  font-weight:900;
}
.edit-pill{
  background:#0a246a;
  color:#fff;
  padding:1px 6px;
  border-radius:999px;
  font-size:10px;
  font-weight:900;
}
.save-btn{
  height:22px;
  padding:0 10px;
}
.cas-tabs{
  display:flex;
  gap:4px;
  width:max-content;
}
.win-tab{
  background:#c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  padding:2px 6px;
  font-weight:900;
  cursor:pointer;
  font-size:11px;
  line-height:1;
}
.win-tab:active{
  border-top:2px solid #404040;
  border-left:2px solid #404040;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
}
.win-tab.active{
  background:#0a246a;
  color:#fff;
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
.win-btn:active{
  border-top:2px solid #404040;
  border-left:2px solid #404040;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
}
.cas-body{
  flex:1;
  overflow:auto;
  background:#e6e2da;
  border:1px solid #8d8d8d;
  padding:8px;
}
.cas-std-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:6px;
}
.cas-std-hint{
  font-weight:900;
  font-size:12px;
  color:#333;
}
.cas-std-actions{
  display:flex;
  gap:6px;
}
.cas-table-wrap{
  background:#fff;
  border-top:2px solid #808080;
  border-left:2px solid #808080;
  border-right:2px solid #fff;
  border-bottom:2px solid #fff;
  overflow:auto;
}
.cas-table{
  width:max-content;
  min-width:100%;
  border-collapse:collapse;
  font-size:13px;
  table-layout:fixed;
}
.cas-table th{
  background:#d4d0c8;
  font-weight:900;
  padding:4px 6px;
  border:1px solid #808080;
  position:relative;
}
.cas-table th.clickable{
  cursor:pointer;
}
.cas-table th.clickable:hover{
  background:#cfc9be;
}
.cas-td{
  border:1px solid #808080;
  padding:2px 4px;
  font-size:13px;
  white-space:nowrap;
  user-select:none;
}
.cas-cell.sel{
  background:#0a246a;
  color:#fff;
}
.cas-cell.clickable{
  cursor:pointer;
  color:#0b3aa4;
  font-weight:900;
}
.cas-cell.clickable:hover{
  text-decoration:underline;
  background:#eaf7ff;
}
.cas-edit-hint{
  margin-top:8px;
  font-size:11px;
  font-weight:900;
  color:#333;
}
.center{
  text-align:center;
}
.cas-todo{
  padding:10px;
  background:#fff;
  border:1px dashed #999;
  font-weight:900;
  color:#6b7280;
}
.th-label{
  display:block;
}
.col-resizer{
  position:absolute;
  top:0;
  right:-4px;
  width:8px;
  height:100%;
  cursor:col-resize;
  z-index:2;
}
.col-resizer::after{
  content:'';
  position:absolute;
  top:0;
  left:3px;
  width:1px;
  height:100%;
  background:rgba(0,0,0,.18);
}
.slideCard-enter-active,
.slideCard-leave-active{
  transition:opacity .22s ease, transform .22s ease;
}
.slideCard-enter-from,
.slideCard-leave-to{
  opacity:0;
  transform:translateY(-6px);
}
.slideCard-enter-to,
.slideCard-leave-from{
  opacity:1;
  transform:translateY(0);
}
</style>
