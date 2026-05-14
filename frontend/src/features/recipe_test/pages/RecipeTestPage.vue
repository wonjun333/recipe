<template>
  <section class="page" tabindex="0">
    <div class="recipe-test-shell">
      <RecipeTestHeader
        v-model:line="line"
        v-model:team="team"
        v-model:eqpId="eqpId"
        :filtered-line-options="filteredLineOptions"
        :filtered-team-options="filteredTeamOptions"
        :filtered-eqp-options="filteredEqpOptions"
        :is-loading="isLoading"
        :cart-count="0"
        :cart-open="false"
        :cart-shake-token="0"
        @load="load"
        @reset="resetPage"
        @toggle-cart="noop"
        @register-cart-anchor="noop"
      />
      <LoadingOverlay :visible="isLoading" :message="loadingMessage" />
      <div class="grid">
        <section class="panel">
          <h2>CAS</h2>
          <button v-for="cas in casList" :key="cas.name" :class="{active:selectedCas===cas.name}" @click="selectCas(cas.name)">{{ displayName(cas.name, '.cas') }}</button>
        </section>
        <section class="panel">
          <h2>JOB</h2>
          <button v-for="job in jobList" :key="job.id" :class="{active:selectedJob===job.id}" @click="selectJob(job.id)">{{ displayName(job.jobName, '.job') }}</button>
        </section>
        <section class="panel content">
          <h2>Content</h2>
          <pre>{{ selectedContent }}</pre>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RecipeTestHeader from '../components/RecipeTestHeader.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { recipeTestApi, type EqpOptionItem, type FileEntry, type LoadResponse } from '../api/recipeTestApi'

const line = ref('')
const team = ref('')
const eqpId = ref('')
const isLoading = ref(false)
const loadingMessage = ref('FTP 파일과 목록을 불러오는중...')
const eqpMasterItems = ref<EqpOptionItem[]>([])
const casList = ref<FileEntry[]>([])
const jobList = ref<LoadResponse['jobList']>([])
const selectedCas = ref('')
const selectedJob = ref('')
const selectedContent = ref('')

function noop() {}
function displayName(name: string, ext: string) { return String(name || '').replace(new RegExp(`${ext}$`, 'i'), '') }

const filteredLineOptions = computed(() => Array.from(new Set(eqpMasterItems.value.map(x => x.line).filter(Boolean))).sort())
const filteredTeamOptions = computed(() => Array.from(new Set(eqpMasterItems.value.filter(x => !line.value || x.line === line.value).map(x => x.team).filter(Boolean))).sort())
const filteredEqpOptions = computed(() => Array.from(new Set(eqpMasterItems.value.filter(x => !line.value || x.line === line.value).filter(x => !team.value || x.team === team.value).map(x => x.eqpId).filter(Boolean))).sort())

async function loadEqpOptions() {
  try { const res = await recipeTestApi.getEqpOptions(); eqpMasterItems.value = res.items || [] } catch (err) { console.error(err) }
}
async function load() {
  if (!eqpId.value) { window.alert('설비ID를 선택한 후 Load를 실행하세요.'); return }
  isLoading.value = true
  try {
    const res = await recipeTestApi.load({ line: line.value, team: team.value, eqpId: eqpId.value })
    casList.value = res.casList || []
    jobList.value = res.jobList || []
    selectedContent.value = ''
  } catch (err) {
    window.alert(`Load 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally { isLoading.value = false }
}
function resetPage() { selectedCas.value = ''; selectedJob.value = ''; selectedContent.value = '' }
async function selectCas(casId: string) {
  selectedCas.value = casId
  try { const res = await recipeTestApi.getCasContent(eqpId.value, casId); selectedContent.value = JSON.stringify(res, null, 2) } catch (err) { selectedContent.value = String(err) }
}
async function selectJob(jobId: string) {
  selectedJob.value = jobId
  try { const res = await recipeTestApi.getJobContent(eqpId.value, jobId); selectedContent.value = JSON.stringify(res, null, 2) } catch (err) { selectedContent.value = String(err) }
}
watch(eqpId, (id) => { const m = eqpMasterItems.value.find(x => x.eqpId === id); if (m) { line.value = m.line; team.value = m.team } })
onMounted(loadEqpOptions)
</script>

<style scoped>
.page{display:grid;gap:14px;padding-bottom:12px;overflow-x:hidden;outline:none}.recipe-test-shell{display:grid;gap:14px}.grid{display:flex;gap:14px;align-items:stretch;min-width:0;overflow-x:hidden}.panel{background:#c0c0c0;border:2px outset #fff;padding:8px;display:flex;flex-direction:column;gap:4px;min-width:220px;height:674px;overflow:auto}.panel h2{margin:0 0 8px;font-size:14px}.panel button{text-align:left;background:#fff;border:0;padding:4px;font-weight:700;cursor:pointer}.panel button.active{background:#0a246a;color:#fff}.content{flex:1;background:#fff}.content pre{white-space:pre-wrap;font-size:12px}
</style>
