<template>
  <div v-if="open" class="w97-modal-overlay end-by-overlay">
    <div class="w97-modal end-by-modal">
      <div class="w97-modal-titlebar">
        <div class="w97-modal-title">Select End Step Option for Step {{ stepNumber }}</div>
      </div>

      <div class="end-by-body">
        <div class="end-by-left">
          <fieldset class="end-by-fieldset">
            <legend>End Step Option</legend>
            <div class="radio-group">
              <label v-for="opt in OPTIONS" :key="opt.value" class="radio-item">
                <input type="radio" name="end_step_option" :value="opt.value" v-model="selectedOption" />
                {{ opt.label }}
              </label>
            </div>
          </fieldset>
        </div>

        <div class="end-by-center">
          <div class="time-field">
            <div class="time-label">Max Time</div>
            <input
              class="win-input time-input"
              type="number"
              step="0.1"
              min="0"
              v-model.number="maxTime"
            />
            <div class="time-unit">sec</div>
          </div>
          <div class="time-field" v-if="selectedOption === 3">
            <div class="time-label">Min Time</div>
            <input
              class="win-input time-input"
              type="number"
              step="0.1"
              min="0"
              v-model.number="minTime"
            />
            <div class="time-unit">sec</div>
          </div>
        </div>

        <div class="end-by-right">
          <button class="win-btn" @click="handleOk">OK</button>
          <button class="win-btn" @click="emit('cancel')">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  stepNumber: number
  currentOption: number
  currentMaxTime: number
  currentMinTime: number
}>()

const emit = defineEmits<{
  (e: 'confirm', payload: { option: number; maxTime: number; minTime: number }): void
  (e: 'cancel'): void
}>()

const OPTIONS = [
  { value: 0, label: 'Time' },
  { value: 1, label: 'RPM' },
  { value: 2, label: 'Pressure' },
  { value: 3, label: 'Endpoint' },
  { value: 4, label: 'Time / Endpoint' },
  { value: 5, label: 'All Heads Ready' },
  { value: 6, label: 'Rate' },
  { value: 7, label: 'Rate / Endpoint' },
  { value: 8, label: '% OP (EP)' },
]

const selectedOption = ref(0)
const maxTime = ref(0)
const minTime = ref(0)

watch(() => props.open, (val) => {
  if (val) {
    selectedOption.value = props.currentOption
    maxTime.value = props.currentMaxTime
    minTime.value = props.currentMinTime
  }
})

function handleOk() {
  emit('confirm', {
    option: selectedOption.value,
    maxTime: maxTime.value,
    minTime: minTime.value,
  })
}
</script>

<style scoped>
.end-by-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.end-by-modal {
  background: #d4d0c8;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid #404040;
  border-bottom: 2px solid #404040;
  min-width: 380px;
}

.w97-modal-titlebar {
  background: linear-gradient(90deg, #000080, #1084d0);
  padding: 3px 6px;
}

.w97-modal-title {
  color: #fff;
  font-weight: 900;
  font-size: 12px;
}

.end-by-body {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
}

.end-by-left {
  flex: 1;
}

.end-by-fieldset {
  border: 1px solid #808080;
  padding: 6px 8px 8px;
  margin: 0;
}

.end-by-fieldset legend {
  font-size: 11px;
  font-weight: 700;
  padding: 0 4px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.radio-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.radio-item input {
  cursor: pointer;
  margin: 0;
}

.end-by-center {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 20px;
  min-width: 90px;
}

.time-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.time-label {
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.time-input {
  width: 70px;
  text-align: right;
  font-size: 12px;
  padding: 2px 4px;
  background: #fff;
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
}

.time-unit {
  font-size: 10px;
  color: #444;
}

.end-by-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 20px;
}

.win-btn {
  height: 24px;
  min-width: 60px;
  background: #d4d0c8;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-right: 2px solid #404040;
  border-bottom: 2px solid #404040;
  cursor: pointer;
  font-size: 12px;
  font-family: 'Tahoma', sans-serif;
  padding: 0 10px;
}

.win-btn:active {
  border-top: 2px solid #404040;
  border-left: 2px solid #404040;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
}
</style>
