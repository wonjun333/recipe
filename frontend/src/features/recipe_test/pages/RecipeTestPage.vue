<template>
  <section class="page">
    <div class="recipe-test-shell">
      <RecipeTestHeader
        v-model:line="line"
        v-model:team="team"
        v-model:eqpId="eqpId"
        :filtered-line-options="filteredLineOptions"
        :filtered-team-options="filteredTeamOptions"
        :filtered-eqp-options="filteredEqpOptions"
        :is-loading="isLoading"
        @load="load"
        @reset="resetPage"
      />

      <LoadingOverlay :visible="isLoading" :message="loadingMessage" />

      <section class="summary" aria-label="selection summary">
        <div class="summary-card">
          <span class="summary-label">Equipment</span>
          <strong>{{ eqpId || '선택 안됨' }}</strong>
          <span>{{ [line || 'Line 미선택', team || '분임조 미선택'].join(' / ') }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">CAS</span>
          <strong>{{ selectedCas || '선택 안됨' }}</strong>
          <span>{{ casContent?.slots.length ?? 0 }} slots</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">JOB</span>
          <strong>{{ selectedJobContent?.jobName || selectedJob || '선택 안됨' }}</strong>
          <span>{{ selectedJobContent?.baseRecipeName || 'base recipe 없음' }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">RECIPE</span>
          <strong>{{ selectedRecipe?.name || '선택 안됨' }}</strong>
          <span>{{ selectedRecipe?.modifiedAt ? formatDate(selectedRecipe.modifiedAt) : '수정시간 정보 없음' }}</span>
        </div>
      </section>

      <div class="browser-grid">
        <section class="panel">
          <div class="panel-head">
            <h2>CAS</h2>
            <span>{{ casList.length }}</span>
          </div>
          <div class="panel-body list-body">
            <button
              v-for="cas in casList"
              :key="cas.name"
              class="list-item"
              :class="{ active: selectedCas === cas.name }"
              type="button"
              @click="selectCas(cas.name)"
            >
              <strong>{{ displayName(cas.name, '.cas') }}</strong>
              <span>{{ formatDate(cas.modifiedAt) }}</span>
            </button>
            <p v-if="casList.length === 0" class="empty-copy">Load를 실행하면 CAS 목록이 표시됩니다.</p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>JOB</h2>
            <span>{{ filteredJobList.length }}</span>
          </div>
          <div class="panel-body list-body">
            <button
              v-for="job in filteredJobList"
              :key="job.id"
              class="list-item"
              :class="{ active: selectedJob === job.id }"
              type="button"
              @click="selectJob(job.id)"
            >
              <strong>{{ displayName(job.jobName, '.job') }}</strong>
              <span>{{ displayName(job.recipeName, '') }}</span>
            </button>
            <p v-if="filteredJobList.length === 0" class="empty-copy">
              {{ selectedCas ? '선택한 CAS에 연결된 JOB이 없습니다.' : 'CAS를 선택하면 관련 JOB을 우선 표시합니다.' }}
            </p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>RECIPE</h2>
            <span>{{ prioritizedRecipeList.length }}</span>
          </div>
          <div class="panel-body list-body">
            <button
              v-for="recipe in prioritizedRecipeList"
              :key="recipe.id"
              class="list-item"
              :class="{ active: selectedRecipeId === recipe.id }"
              type="button"
              @click="selectRecipe(recipe.id)"
            >
              <strong>{{ displayName(recipe.name, '') }}</strong>
              <span>{{ recipe.modifiedAt ? formatDate(recipe.modifiedAt) : 'modifiedAt 없음' }}</span>
            </button>
            <p v-if="prioritizedRecipeList.length === 0" class="empty-copy">JOB을 선택하면 관련 RECIPE를 확인할 수 있습니다.</p>
          </div>
        </section>
      </div>

      <div class="details-grid">
        <section class="detail-card">
          <div class="detail-head">
            <h3>CAS Detail</h3>
            <span>{{ selectedCas || '-' }}</span>
          </div>
          <table v-if="casContent" class="detail-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Job</th>
                <th>Recipe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in casContent.slots" :key="slot.slot">
                <td>{{ slot.slot }}</td>
                <td>{{ slot.jobName }}</td>
                <td>{{ slot.recipeName }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-copy">CAS를 선택하면 슬롯 구성을 확인할 수 있습니다.</p>
        </section>

        <section class="detail-card">
          <div class="detail-head">
            <h3>JOB Detail</h3>
            <span>{{ selectedJobContent?.jobName || '-' }}</span>
          </div>
          <div v-if="selectedJobContent" class="job-sections">
            <div class="kv-grid">
              <div class="kv-row">
                <span>Base Recipe</span>
                <strong>{{ selectedJobContent.baseRecipeName }}</strong>
              </div>
              <div class="kv-row">
                <span>Pre Metrology</span>
                <strong>{{ selectedJobContent.parsed.preMetrology.recipe || '(None)' }}</strong>
              </div>
              <div class="kv-row">
                <span>Post Metrology</span>
                <strong>{{ selectedJobContent.parsed.postMetrology.recipe || '(None)' }}</strong>
              </div>
            </div>

            <div class="subsection">
              <h4>Polisher Route</h4>
              <table class="detail-table compact">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>P1</th>
                    <th>P2</th>
                    <th>P3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in selectedJobContent.parsed.polisher.rows" :key="row.label">
                    <td>{{ row.label }}</td>
                    <td>{{ row.p1 }}</td>
                    <td>{{ row.p2 }}</td>
                    <td>{{ row.p3 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="subsection">
              <h4>Cleaner Route</h4>
              <table class="detail-table compact">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Module</th>
                    <th>Recipe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in selectedJobContent.parsed.cleaner.rows" :key="`${row.index}-${row.module}`">
                    <td>{{ row.index }}</td>
                    <td>{{ row.module }}</td>
                    <td>{{ row.recipe }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p v-else class="empty-copy">JOB을 선택하면 파싱된 내용을 확인할 수 있습니다.</p>
        </section>

        <section class="detail-card">
          <div class="detail-head">
            <h3>RECIPE Detail</h3>
            <span>{{ selectedRecipeContent?.recipe.name || '-' }}</span>
          </div>
          <div v-if="selectedRecipeContent" class="recipe-detail">
            <table v-if="selectedRecipeContent.recipe.columns.length" class="detail-table compact">
              <thead>
                <tr>
                  <th v-for="column in selectedRecipeContent.recipe.columns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in selectedRecipeContent.recipe.rows" :key="rowIndex">
                  <td v-for="column in selectedRecipeContent.recipe.columns" :key="column">
                    {{ row[column] ?? '' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <pre v-else class="recipe-fallback">{{ JSON.stringify(selectedRecipeContent.recipe, null, 2) }}</pre>
          </div>
          <p v-else class="empty-copy">RECIPE를 선택하면 상세 내용을 확인할 수 있습니다.</p>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import RecipeTestHeader from '../components/RecipeTestHeader.vue'
import {
  recipeTestApi,
  type CasContentResponse,
  type EqpOptionItem,
  type FileEntry,
  type JobContentResponse,
  type LoadResponse,
  type RecipeContentResponse,
} from '../api/recipeTestApi'

type JobListItem = LoadResponse['jobList'][number]
type RecipeListItem = LoadResponse['recipeList'][number]

const line = ref('')
const team = ref('')
const eqpId = ref('')
const isLoading = ref(false)
const loadingMessage = ref('FTP 파일과 목록을 불러오는 중...')
const eqpMasterItems = ref<EqpOptionItem[]>([])
const casList = ref<FileEntry[]>([])
const jobList = ref<JobListItem[]>([])
const recipeList = ref<RecipeListItem[]>([])
const casToJobs = ref<Record<string, string[]>>({})
const selectedCas = ref('')
const selectedJob = ref('')
const selectedRecipeId = ref('')
const casContent = ref<CasContentResponse | null>(null)
const selectedJobContent = ref<JobContentResponse | null>(null)
const selectedRecipeContent = ref<RecipeContentResponse | null>(null)

const filteredLineOptions = computed(() =>
  Array.from(new Set(eqpMasterItems.value.map((item) => item.line).filter(Boolean))).sort(),
)

const filteredTeamOptions = computed(() =>
  Array.from(
    new Set(
      eqpMasterItems.value
        .filter((item) => !line.value || item.line === line.value)
        .map((item) => item.team)
        .filter(Boolean),
    ),
  ).sort(),
)

const filteredEqpOptions = computed(() =>
  Array.from(
    new Set(
      eqpMasterItems.value
        .filter((item) => !line.value || item.line === line.value)
        .filter((item) => !team.value || item.team === team.value)
        .map((item) => item.eqpId)
        .filter(Boolean),
    ),
  ).sort(),
)

const casScopedJobIds = computed(() => {
  if (!selectedCas.value) {
    return [] as string[]
  }

  const fromLoad = casToJobs.value[selectedCas.value]
  if (fromLoad?.length) {
    return fromLoad
  }

  if (casContent.value?.jobIds?.length) {
    return casContent.value.jobIds
  }

  return casContent.value?.slots.map((slot) => slot.jobId).filter(Boolean) ?? []
})

const filteredJobList = computed(() => {
  if (!casScopedJobIds.value.length) {
    return jobList.value
  }

  const visibleIds = new Set(casScopedJobIds.value)
  return jobList.value.filter((job) => visibleIds.has(job.id))
})

const selectedRecipe = computed(() => recipeList.value.find((recipe) => recipe.id === selectedRecipeId.value) ?? null)

const prioritizedRecipeList = computed(() => {
  if (!recipeList.value.length) {
    return [] as RecipeListItem[]
  }

  const baseRecipeName = selectedJobContent.value?.baseRecipeName
  const slotRecipeName = casContent.value?.slots.find((slot) => slot.jobId === selectedJob.value)?.recipeName
  const priorityName = baseRecipeName || slotRecipeName

  if (!priorityName) {
    return recipeList.value
  }

  return [...recipeList.value].sort((left, right) => {
    const leftScore = left.name === priorityName ? 0 : 1
    const rightScore = right.name === priorityName ? 0 : 1
    return leftScore - rightScore || left.name.localeCompare(right.name)
  })
})

function displayName(name: string, ext: string) {
  if (!ext) {
    return name
  }

  return name.replace(new RegExp(`${escapeRegExp(ext)}$`, 'i'), '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatDate(value?: string) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function syncSelectionFromEqp(id: string) {
  const matched = eqpMasterItems.value.find((item) => item.eqpId === id)
  if (!matched) {
    return
  }

  line.value = matched.line
  team.value = matched.team
}

function resetLoadedState() {
  casList.value = []
  jobList.value = []
  recipeList.value = []
  casToJobs.value = {}
  selectedCas.value = ''
  selectedJob.value = ''
  selectedRecipeId.value = ''
  casContent.value = null
  selectedJobContent.value = null
  selectedRecipeContent.value = null
}

function resetPage() {
  resetLoadedState()
}

async function loadEqpOptions() {
  try {
    const response = await recipeTestApi.getEqpOptions()
    eqpMasterItems.value = response.items || []
  } catch (error) {
    window.alert(`설비 목록을 불러오지 못했습니다: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function load() {
  if (!eqpId.value) {
    window.alert('설비 ID를 선택한 후 Load를 실행하세요.')
    return
  }

  isLoading.value = true
  loadingMessage.value = 'CAS / JOB / RECIPE 목록을 불러오는 중...'

  try {
    const response = await recipeTestApi.load({
      line: line.value,
      team: team.value,
      eqpId: eqpId.value,
    })

    casList.value = response.casList || []
    jobList.value = response.jobList || []
    recipeList.value = response.recipeList || []
    casToJobs.value = response.casToJobs || {}
    selectedCas.value = ''
    selectedJob.value = ''
    selectedRecipeId.value = ''
    casContent.value = null
    selectedJobContent.value = null
    selectedRecipeContent.value = null
  } catch (error) {
    window.alert(`Load 실패: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

async function selectCas(casId: string) {
  selectedCas.value = casId
  selectedJob.value = ''
  selectedRecipeId.value = ''
  selectedJobContent.value = null
  selectedRecipeContent.value = null
  loadingMessage.value = `CAS ${casId} 내용을 불러오는 중...`
  isLoading.value = true

  try {
    casContent.value = await recipeTestApi.getCasContent(eqpId.value, casId)
  } catch (error) {
    casContent.value = null
    window.alert(`CAS 조회 실패: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

async function selectJob(jobId: string) {
  selectedJob.value = jobId
  selectedRecipeId.value = ''
  selectedRecipeContent.value = null
  loadingMessage.value = `JOB ${jobId} 내용을 불러오는 중...`
  isLoading.value = true

  try {
    const response = await recipeTestApi.getJobContent(eqpId.value, jobId)
    selectedJobContent.value = response

    const matchedRecipe = recipeList.value.find((recipe) => recipe.name === response.baseRecipeName)
    if (matchedRecipe) {
      await selectRecipe(matchedRecipe.id, false)
    }
  } catch (error) {
    selectedJobContent.value = null
    window.alert(`JOB 조회 실패: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

async function selectRecipe(recipeId: string, useOwnLoadingState = true) {
  selectedRecipeId.value = recipeId

  if (useOwnLoadingState) {
    loadingMessage.value = `RECIPE ${recipeId} 내용을 불러오는 중...`
    isLoading.value = true
  }

  try {
    selectedRecipeContent.value = await recipeTestApi.getRecipeContent(eqpId.value, recipeId)
  } catch (error) {
    selectedRecipeContent.value = null
    window.alert(`RECIPE 조회 실패: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    if (useOwnLoadingState) {
      isLoading.value = false
    }
  }
}

watch(eqpId, (id) => {
  syncSelectionFromEqp(id)
  resetLoadedState()
})

watch([line, team], () => {
  if (!eqpId.value) {
    return
  }

  const stillValid = eqpMasterItems.value.some(
    (item) =>
      item.eqpId === eqpId.value &&
      (!line.value || item.line === line.value) &&
      (!team.value || item.team === team.value),
  )

  if (!stillValid) {
    eqpId.value = ''
  }
})

onMounted(loadEqpOptions)
</script>

<style scoped>
.page{display:grid;gap:14px;padding-bottom:12px;overflow-x:hidden}.recipe-test-shell{display:grid;gap:14px}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.summary-card{display:grid;gap:4px;padding:14px 16px;border:1px solid #dfe5f0;border-radius:14px;background:linear-gradient(180deg,#ffffff,#f8fbff);box-shadow:0 10px 24px rgba(10,20,40,.05)}.summary-label{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#64748b}.summary-card strong{font-size:16px}.summary-card span:last-child{font-size:12px;color:#475569}.browser-grid,.details-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.panel,.detail-card{display:grid;gap:12px;padding:12px;border:1px solid #dfe5f0;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(10,20,40,.05);min-width:0}.panel{min-height:320px}.panel-head,.detail-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.panel-head h2,.detail-head h3{margin:0;font-size:15px}.panel-head span,.detail-head span{font-size:12px;color:#64748b}.panel-body{min-height:0}.list-body{display:grid;align-content:start;gap:8px;overflow:auto}.list-item{display:grid;gap:4px;padding:12px;border:1px solid #d6deeb;border-radius:12px;background:#f8fbff;text-align:left;cursor:pointer;transition:border-color .15s ease,background-color .15s ease,transform .15s ease}.list-item strong{font-size:13px;color:#0f172a}.list-item span{font-size:12px;color:#475569}.list-item:hover{border-color:#7aa2ff;background:#eef4ff;transform:translateY(-1px)}.list-item.active{border-color:#0a246a;background:#0a246a}.list-item.active strong,.list-item.active span{color:#fff}.detail-card{align-content:start}.detail-table{width:100%;border-collapse:collapse;background:#fff}.detail-table th,.detail-table td{border:1px solid #d8e0ee;padding:8px;text-align:left;vertical-align:top;font-size:12px}.detail-table th{background:#f5f8ff;font-weight:800}.detail-table.compact th,.detail-table.compact td{padding:6px}.empty-copy{margin:0;color:#64748b;font-size:13px}.job-sections,.recipe-detail{display:grid;gap:12px}.kv-grid{display:grid;gap:8px}.kv-row{display:grid;grid-template-columns:140px 1fr;gap:10px;padding:10px 12px;border:1px solid #dfe5f0;border-radius:12px;background:#f8fbff}.kv-row span{font-size:12px;color:#475569}.kv-row strong{font-size:13px;color:#0f172a}.subsection{display:grid;gap:8px}.subsection h4{margin:0;font-size:13px}.recipe-fallback{margin:0;padding:12px;border-radius:12px;background:#0f172a;color:#e2e8f0;white-space:pre-wrap;overflow:auto}

@media (max-width: 1100px) {
  .summary,
  .browser-grid,
  .details-grid {
    grid-template-columns:1fr 1fr;
  }
}

@media (max-width: 720px) {
  .summary,
  .browser-grid,
  .details-grid {
    grid-template-columns:1fr;
  }
}
</style>
