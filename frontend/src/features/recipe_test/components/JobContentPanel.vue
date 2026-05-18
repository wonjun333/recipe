<template>
  <section
    class="content"
    :class="{ 'pane-focus': paneFocus }"
    :style="panelStyle"
    @mousedown="emit('activate')"
    @contextmenu.prevent="emit('open-menu', $event)"
  >
    <Transition name="slideCard">
      <div v-if="show" class="card content-card" :style="{ height: paneHeight }" :ref="setContentRef">
        <div class="ch">
          <div class="job-head-left">
            <div class="ct">{{ jobName }}</div>
          </div>

          <div class="job-head-right">
            <span v-if="editMode" class="edit-pill edit-pill-strong">EDIT</span>

            <template v-if="!editMode">
              <button class="win-btn save-btn" @click="emit('enter-edit')">Edit</button>
            </template>
            <template v-else>
              <button class="win-btn save-btn" @click="emit('save')">Save</button>
              <button class="win-btn" @click="emit('cancel')">Cancel</button>
            </template>
          </div>
        </div>

        <JobParsedContent
          :parsed="parsed"
          :editable="editMode"
          :none-label="noneLabel"
          :missing-recipe-map="missingRecipeMap"
          @toggle-flag="emit('toggle-flag', $event)"
          @value-click="emit('value-click', $event)"
        />
      </div>
    </Transition>

    <div v-if="!show" class="content-placeholder" :style="{ height: paneHeight }"></div>
  </section>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType } from 'vue'
import type { JobParsed } from '../api/recipeTestApi'
import JobParsedContent from './JobParsedContent.vue'

defineProps({
  show: { type: Boolean, default: false },
  paneFocus: { type: Boolean, default: false },
  panelStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  paneHeight: { type: String, required: true },
  jobName: { type: String, default: '' },
  editMode: { type: Boolean, default: false },
  parsed: { type: Object as PropType<JobParsed | null>, default: null },
  noneLabel: { type: String, default: '(None)' },
  missingRecipeMap: { type: Object as PropType<Record<string, boolean>>, default: () => ({}) },
})

const emit = defineEmits<{
  (e: 'activate'): void
  (e: 'open-menu', event: MouseEvent): void
  (e: 'register-content-el', el: HTMLElement | null): void
  (e: 'enter-edit'): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'toggle-flag', payload: { section: 'preMetrology' | 'postMetrology' | 'polisher' | 'cleaner'; key: string; checked: boolean }): void
  (e: 'value-click', value: string): void
}>()

function setContentRef(el: Element | null) {
  emit('register-content-el', el instanceof HTMLElement ? el : null)
}
</script>

<style scoped>
.pane-focus{
  box-shadow:0 0 0 3px rgba(53,119,255,.16);
}
.card{
  background:#fff;
  border:1px solid #e6e8ef;
  border-radius:14px;
  box-shadow:0 10px 26px rgba(10,20,40,.06);
  padding:12px;
}
.content-card{
  display:flex;
  flex-direction:column;
}
.content-placeholder{
  background:transparent;
}
.ch{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  padding:6px 6px 10px 6px;
}
.job-head-left{
  display:grid;
  gap:4px;
  min-width:0;
}
.job-head-right{
  display:flex;
  align-items:center;
  gap:6px;
  flex-wrap:wrap;
}
.ct{
  font-weight:900;
  color:#111827;
}
.edit-pill{
  background:#0a246a;
  color:#fff;
  padding:1px 6px;
  border-radius:999px;
  font-size:10px;
  font-weight:900;
}
.edit-pill-strong{
  font-size:11px;
  padding:2px 8px;
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
.save-btn{
  height:22px;
  padding:0 10px;
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
```</Transition>