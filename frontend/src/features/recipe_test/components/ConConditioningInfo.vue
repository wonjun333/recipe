<template>
  <div v-if="info" class="con-cond-wrap">
    <fieldset class="con-cond-fieldset">
      <legend>Conditioning Type</legend>
      <div class="con-radio-group">
        <label class="con-radio-item">
          <span class="con-radio-indicator" :class="{ selected: info.isInSitu }"></span>
          In-Situ Conditioning: Polishing parameters pre-empt conditioning parameters
        </label>
        <div v-if="info.isInSitu" class="con-sub-option">
          <span class="con-check-indicator" :class="{ checked: info.partialEnabled }"></span>
          Partial pad conditioning:
          <span class="con-rate-badge">{{ info.partialRate }}%</span>
        </div>
        <label class="con-radio-item">
          <span class="con-radio-indicator" :class="{ selected: !info.isInSitu }"></span>
          Ex-Situ Conditioning: Conditioning is completed before polishing begins
        </label>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeDetail } from '../api/recipeTestApi'

const props = defineProps<{ recipe: RecipeDetail | null }>()

const info = computed(() => {
  const pv = (props.recipe as any)?.meta?.editableModel?.paramValues
  if (!pv || String((props.recipe as any)?.meta?.sourceType ?? '') !== 'con') return null
  const inExArr = pv['IN/EX SITU']
  const isInSitu = Array.isArray(inExArr) ? Number(inExArr[0] ?? 1) === 0 : true
  const partArr = pv['PARTIAL_PAD_CONDITIONING']
  const partialEnabled = Array.isArray(partArr) ? Number(partArr[0] ?? 0) !== 0 : false
  const rateArr = pv['PARTIAL_PAD_RATE']
  const partialRate = Array.isArray(rateArr) ? Math.round(Number(rateArr[0] ?? 100)) : 100
  return { isInSitu, partialEnabled, partialRate }
})
</script>

<style scoped>
.con-cond-wrap {
  padding: 4px 6px 2px;
  background: #d4d0c8;
  border-bottom: 1px solid #a0a0a0;
}

.con-cond-fieldset {
  border: 1px solid #808080;
  padding: 4px 8px 6px;
  margin: 0;
}

.con-cond-fieldset legend {
  font-size: 11px;
  font-weight: 700;
  padding: 0 4px;
  color: #000;
}

.con-radio-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.con-radio-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  cursor: default;
  white-space: nowrap;
}

.con-radio-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #808080;
  background: #fff;
  flex-shrink: 0;
  position: relative;
}

.con-radio-indicator.selected::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #000;
}

.con-sub-option {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding-left: 18px;
}

.con-check-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid #808080;
  background: #fff;
  flex-shrink: 0;
  position: relative;
}

.con-check-indicator.checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  font-size: 11px;
  color: #000;
  font-weight: 900;
}

.con-rate-badge {
  font-weight: 700;
  font-size: 11px;
  color: #000080;
}
</style>
