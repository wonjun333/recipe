<template>
  <div v-if="open" class="w97-modal-overlay polcon-edit-overlay">
    <div class="w97-modal polcon-edit-modal">
      <div class="w97-modal-titlebar">
        <div class="w97-modal-title">
          <span class="title-prefix">Edit</span>
          <span class="title-main">{{ recipeName }}</span>
        </div>
      </div>

      <div class="w97-modal-body polcon-edit-body">
        <div class="edit-filename-row">
          <label class="edit-label">저장 파일명:</label>
          <input
            class="win-input edit-filename-input"
            v-model="outputFileName"
            :placeholder="recipeName"
          />
        </div>

        <div v-if="editableParams.length === 0" class="legacy-empty">
          편집 가능한 파라미터가 없습니다.
        </div>

        <div v-else class="edit-table-wrap">
          <table class="legacy-table edit-table">
            <thead>
              <tr>
                <th class="edit-th edit-th-param">Parameter</th>
                <th
                  v-for="(_, si) in stepRange"
                  :key="si"
                  class="edit-th edit-th-step"
                >Step {{ si + 1 }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="param in editableParams" :key="param.key">
                <td class="edit-td edit-td-param">{{ param.label }}</td>
                <td
                  v-for="(_, si) in stepRange"
                  :key="si"
                  class="edit-td edit-td-val"
                >
                  <input
                    class="win-input edit-cell-input"
                    type="number"
                    step="any"
                    :value="getCellValue(param.key, si)"
                    @change="setCellValue(param.key, si, ($event.target as HTMLInputElement).value)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="errorMsg" class="edit-error">{{ errorMsg }}</div>
      </div>

      <div class="w97-modal-actions">
        <button class="win-btn" @click="handleDownload" :disabled="downloading || editableParams.length === 0">
          {{ downloading ? '생성 중...' : 'Download' }}
        </button>
        <button class="win-btn" @click="handleReset">Reset</button>
        <button class="win-btn" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { RecipeDetail } from '../api/recipeTestApi'
import { recipeTestApi } from '../api/recipeTestApi'

const props = defineProps({
  open: { type: Boolean, default: false },
  eqpId: { type: String, required: true },
  recipe: { type: Object as PropType<RecipeDetail | null>, default: null },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const editedValues = ref<Record<string, number[]>>({})
const outputFileName = ref('')
const downloading = ref(false)
const errorMsg = ref('')

const recipeName = computed(() => props.recipe?.name ?? '')
const editableModel = computed(() => (props.recipe as any)?.meta?.editableModel ?? null)
const stepCount = computed(() => (props.recipe as any)?.meta?.stepCount ?? 1)
const stepRange = computed(() => Array.from({ length: stepCount.value }))

const PARAM_LABELS: Record<string, string> = {
  PLATEN_RPM: 'Platen RPM',
  HEAD_RPM: 'Head RPM',
  'END_BY_MAX/TIME': 'End By Time (s)',
  END_BY_MIN: 'End By Min (s)',
  L1_FLOW_RATE: 'L1 Flow Rate',
  L2_FLOW_RATE: 'L2 Flow Rate',
  L3_FLOW_RATE: 'L3 Flow Rate',
  L4_FLOW_RATE: 'L4 Flow Rate',
  DEILIV_1_FLOW_RATE: 'L1 Flow Rate',
  DEILIV_2_FLOW_RATE: 'L2 Flow Rate',
  DEILIV_3_FLOW_RATE: 'L3 Flow Rate',
  DEILIV_4_FLOW_RATE: 'L4 Flow Rate',
  Z1_STATE_PRESSURE: 'Z1 Pressure (psi)',
  Z2_STATE_PRESSURE: 'Z2 Pressure (psi)',
  Z3_STATE_PRESSURE: 'Z3 Pressure (psi)',
  Z4_STATE_PRESSURE: 'Z4 Pressure (psi)',
  Z5_STATE_PRESSURE: 'Z5 Pressure (psi)',
  RR_STATE_PRESSURE: 'RR Pressure (psi)',
  COND_HEAD_LBF: 'Pad Cond Downforce (lbf)',
  HEAD_SWEEP_VELOCITY: 'Sweep Velocity',
  HEAD_SWEEP_START_POINT: 'Sweep Start',
  HEAD_SWEEP_END_POINT: 'Sweep End',
  PLATEN_ACCEL: 'Platen Accel',
  HEAD_ACCEL_DECEL: 'Head Accel/Decel',
}

const PARAM_ORDER = [
  'PLATEN_RPM', 'HEAD_RPM', 'PLATEN_ACCEL', 'HEAD_ACCEL_DECEL',
  'END_BY_MAX/TIME', 'END_BY_MIN',
  'L1_FLOW_RATE', 'L2_FLOW_RATE', 'L3_FLOW_RATE', 'L4_FLOW_RATE',
  'DEILIV_1_FLOW_RATE', 'DEILIV_2_FLOW_RATE', 'DEILIV_3_FLOW_RATE', 'DEILIV_4_FLOW_RATE',
  'RR_STATE_PRESSURE', 'Z1_STATE_PRESSURE', 'Z2_STATE_PRESSURE', 'Z3_STATE_PRESSURE', 'Z4_STATE_PRESSURE', 'Z5_STATE_PRESSURE',
  'COND_HEAD_LBF', 'HEAD_SWEEP_VELOCITY', 'HEAD_SWEEP_START_POINT', 'HEAD_SWEEP_END_POINT',
]

const editableParams = computed(() => {
  const pv = editableModel.value?.paramValues
  if (!pv) return []
  const allKeys = Object.keys(pv)
  const ordered = PARAM_ORDER.filter(k => allKeys.includes(k))
  const rest = allKeys.filter(k => !PARAM_ORDER.includes(k))
  return [...ordered, ...rest]
    .filter(k => {
      const vals = pv[k]
      if (!Array.isArray(vals) || vals.length === 0) return false
      return !Array.isArray(vals[0])
    })
    .map(k => ({ key: k, label: PARAM_LABELS[k] ?? k }))
})

function getOriginalValues(key: string): number[] {
  const pv = editableModel.value?.paramValues
  if (!pv) return []
  const vals = pv[key] ?? []
  return vals.map((v: any) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0))
}

function getCellValue(key: string, stepIdx: number): number {
  const edited = editedValues.value[key]
  if (edited && stepIdx < edited.length) return edited[stepIdx]
  const orig = getOriginalValues(key)
  return stepIdx < orig.length ? orig[stepIdx] : (orig[orig.length - 1] ?? 0)
}

function setCellValue(key: string, stepIdx: number, raw: string) {
  const num = parseFloat(raw)
  if (isNaN(num)) return
  if (!editedValues.value[key]) {
    editedValues.value[key] = getOriginalValues(key).slice()
  }
  while (editedValues.value[key].length <= stepIdx) {
    editedValues.value[key].push(0)
  }
  editedValues.value[key][stepIdx] = num
}

function buildUpdatedParamValues(): Record<string, number[]> {
  const pv = editableModel.value?.paramValues ?? {}
  const result: Record<string, number[]> = {}
  for (const param of editableParams.value) {
    result[param.key] = Array.from({ length: stepCount.value }, (_, i) => getCellValue(param.key, i))
  }
  return result
}

function handleReset() {
  editedValues.value = {}
  errorMsg.value = ''
}

async function handleDownload() {
  if (!props.recipe) return
  downloading.value = true
  errorMsg.value = ''
  try {
    const updated = buildUpdatedParamValues()
    const fileName = outputFileName.value.trim() || recipeName.value
    const blob = await recipeTestApi.encodePolCon(props.eqpId, props.recipe.id, updated, fileName)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e: any) {
    errorMsg.value = e?.message ?? '다운로드 실패'
  } finally {
    downloading.value = false
  }
}

watch(() => props.open, (val) => {
  if (val) {
    editedValues.value = {}
    errorMsg.value = ''
    outputFileName.value = props.recipe?.name ?? ''
  }
})
</script>

<style scoped>
.polcon-edit-overlay {
  z-index: 2200;
}

.polcon-edit-modal {
  width: 900px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.polcon-edit-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.edit-filename-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.edit-label {
  font-size: 11px;
  white-space: nowrap;
}

.edit-filename-input {
  flex: 1;
  max-width: 400px;
}

.edit-table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #888;
}

.edit-table {
  border-collapse: collapse;
  width: 100%;
  min-width: max-content;
  font-size: 11px;
}

.edit-th {
  background: #000080;
  color: #fff;
  padding: 3px 6px;
  white-space: nowrap;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
}

.edit-th-param {
  text-align: left;
  min-width: 160px;
  position: sticky;
  left: 0;
  z-index: 2;
}

.edit-td {
  padding: 2px 4px;
  border: 1px solid #888;
  vertical-align: middle;
}

.edit-td-param {
  white-space: nowrap;
  font-size: 11px;
  background: #1a1a2e;
  color: #ccc;
  position: sticky;
  left: 0;
  z-index: 1;
}

.edit-td-val {
  min-width: 80px;
}

.edit-cell-input {
  width: 100%;
  text-align: right;
  padding: 1px 3px;
  font-size: 11px;
  box-sizing: border-box;
}

.edit-error {
  color: #ff6b6b;
  font-size: 11px;
  padding: 4px;
}
</style>
