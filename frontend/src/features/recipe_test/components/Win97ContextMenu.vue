<template>
  <div v-if="open" class="w97-menu" :style="{ left: x + 'px', top: y + 'px' }">
    <div
      v-for="(it, idx) in items"
      :key="idx"
      class="w97-menu-item"
      @click.stop="it.action()"
    >
      {{ it.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

type MenuItem = {
  label: string
  action: () => void
}

defineProps({
  open: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  items: {
    type: Array as PropType<MenuItem[]>,
    default: () => [],
  },
})
</script>

<style scoped>
.w97-menu{
  position: fixed;
  z-index: 9999;
  background: #c0c0c0;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  padding: 4px;
  min-width: 140px;
}
.w97-menu-item{
  padding: 4px 8px;
  font-weight: 900;
  cursor: pointer;
  background: #c0c0c0;
}
.w97-menu-item:hover{
  background:#0a246a;
  color:#fff;
}
</style>