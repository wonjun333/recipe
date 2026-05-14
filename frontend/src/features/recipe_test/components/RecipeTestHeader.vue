<template>
  <header class="header">
    <button class="title-wrap" type="button" @click="emit('reset')">
      <span class="t1">Recipe Test</span>
      <span class="t2">CAS → JOB → RECIPE</span>
    </button>
    <div class="controls">
      <label class="inline-field">
        <span class="field-label">Line</span>
        <select class="ctl" :value="line" @change="emit('update:line', ($event.target as HTMLSelectElement).value)">
          <option value="">(선택 안함)</option>
          <option v-for="v in filteredLineOptions" :key="v" :value="v">{{ v }}</option>
        </select>
      </label>
      <label class="inline-field">
        <span class="field-label">분임조</span>
        <select class="ctl" :value="team" @change="emit('update:team', ($event.target as HTMLSelectElement).value)">
          <option value="">(선택 안함)</option>
          <option v-for="v in filteredTeamOptions" :key="v" :value="v">{{ v }}</option>
        </select>
      </label>
      <label class="inline-field eqp-field">
        <span class="field-label">설비 ID</span>
        <select class="ctl" :value="eqpId" @change="emit('update:eqpId', ($event.target as HTMLSelectElement).value)">
          <option value="">(선택 안함)</option>
          <option v-for="v in filteredEqpOptions" :key="v" :value="v">{{ v }}</option>
        </select>
      </label>
      <button class="btn" :disabled="isLoading" @click="emit('load')">{{ isLoading ? 'Loading...' : 'Load' }}</button>
    </div>
  </header>
</template>
<script setup lang="ts">
defineProps<{
  line: string
  team: string
  eqpId: string
  filteredLineOptions: string[]
  filteredTeamOptions: string[]
  filteredEqpOptions: string[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:line', v: string): void
  (e: 'update:team', v: string): void
  (e: 'update:eqpId', v: string): void
  (e: 'load'): void
  (e: 'reset'): void
}>()
</script>
<style scoped>
.header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;min-height:52px;background:#fff;border:1px solid #e6e8ef;border-radius:12px;box-shadow:0 8px 24px rgba(10,20,40,.05)}.title-wrap{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;padding:0;cursor:pointer}.t1{font-size:16px;font-weight:900}.t2{font-size:11px;color:#6b7280}.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.inline-field{display:inline-flex;align-items:center;gap:6px}.field-label{font-size:12px;font-weight:800;color:#4b5563}.ctl{height:30px;min-width:110px;padding:0 8px;border:1px solid #cfd6e4;border-radius:9px;background:#fff;font-size:12px}.btn{height:30px;padding:0 12px;border-radius:9px;border:1px solid #111827;background:#111827;color:#fff;font-size:12px;font-weight:900;cursor:pointer}
</style>
