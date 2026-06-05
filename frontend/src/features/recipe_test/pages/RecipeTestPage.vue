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
      :cart-count="cartCount"
      :cart-open="cartOpen"
      :cart-shake-token="cartShakeToken"
      @load="load(false)"
      @reset="resetPageToBlank"
      @toggle-cart="toggleCartPanel"
      @register-cart-anchor="setCartAnchor"
    />

    <Teleport to="body">
      <Transition name="cartDock">
        <div v-if="cartOpen" class="cart-dismiss-layer" @mousedown.self="closeCartOverlay">
          <div class="cart-overlay" :style="cartOverlayStyle" @mousedown.stop>
            <TransferCartPanel
              :open="cartOpen"
              :items="cartViewItems"
              :target-options="cartTargetOptions"
              :selected-target-eqp-ids="selectedCartTargetEqpIds"
              :moving="cartMoving"
              :cart-maker="cartMaker"
              :cart-model-group="cartModelGroup"
              @set-target-eqp-ids="setCartTargetEqpIds"
              @remove-item="removeCartItem"
              @clear="clearCart"
              @move="moveCartItems"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="cart-fly-layer">
      <div
        v-for="token in cartFlyTokens"
        :key="token.id"
        class="cart-fly-token"
        :style="{ transform: `translate(${token.tx}px, ${token.ty}px)` }"
      >
        {{ token.label }}
      </div>
    </div>

    <LoadingOverlay :visible="isLoading" :message="loadingMessage" />

    <div class="grid">
      <CasFileListPanel
        v-model="casQueryModel"
        :pane-focus="activePane==='casList'"
        :panel-style="casPanelStyle"
        :query-class="casClass"
        :find-compact="isCasInactive"
        :hint="casHint"
        :scroll-left="casScrollLeft"
        :list-mode="casListMode"
        :columns="casListViewCols"
        :selected-ids="selectedCasIds"
        :col-widths="casListColWidths"
        :sort-key="casSortKey"
        :sort-dir="casSortDir"
        @activate="activateArea('casList', 'cas')"
        @open-menu="onCasListMenu"
        @search="applyCasSearch(true)"
        @toggle-sort="onCasSortToggle"
        @start-resize="onCasListResize"
        @body-scroll="onListBodyScroll('cas')"
        @item-click="onCasListItemClick"
        @item-contextmenu="onCasListItemContextMenu"
        @register-item-ref="onCasItemRef"
        @register-scroll-el="setCasScrollEl"
        @update:listMode="casListMode = $event"
      />

      <CasContentPanel
        :visible="casContentVisible"
        :pane-focus="activePane==='casContent'"
        :panel-style="casContentStyle"
        :cas-id-display="casSelectedSingleDisplay"
        :edit-mode="casEditMode"
        :tab="casTab"
        :tab-label="casTabLabel"
        :table-rows="casTableRows"
        :table-headers="casTableHeaders"
        :table-col-widths="tableColWidths.cas"
        :selected-slots="selectedSlotNumbers"
        @activate="activateArea('casContent', 'cas')"
        @open-menu="onCasContentMenu"
        @register-root="setCasContentRoot"
        @update:tab="casTab = $event"
        @save-as="casContentSaveAs"
        @enter-edit="casContentEnterEdit"
        @save="casSaveClicked"
        @cancel="casCancelRequested"
        @header-click="onCasTableHeaderClick"
        @cell-click="onCasContentCellClick"
        @start-resize="onCasContentResize"
      />

      <JobFileListPanel
        v-model="jobQueryModel"
        :pane-focus="activePane==='jobList' && keyboardControlMode==='job'"
        :attention="jobListAttention"
        :panel-style="jobPanelStyle"
        :query-class="jobClass"
        :hint="jobHint"
        :scroll-left="jobScrollLeft"
        :list-mode="jobListMode"
        :columns="jobListViewCols"
        :selected-ids="selectedJobIds"
        :col-widths="jobListColWidths"
        :sort-key="jobSortKey"
        :sort-dir="jobSortDir"
        @activate="activateArea('jobList', 'job')"
        @open-menu="onJobListMenu"
        @search="applyJobSearch(true)"
        @toggle-sort="onJobSortToggle"
        @start-resize="onJobListResize"
        @body-scroll="onListBodyScroll('job')"
        @item-click="onJobListItemClick"
        @item-contextmenu="onJobListItemContextMenu"
        @register-item-ref="onJobItemRef"
        @register-scroll-el="setJobScrollEl"
        @update:listMode="jobListMode = $event"
      />

      <JobContentPanel
        :show="showJobContent"
        :pane-focus="activePane==='jobContent' && keyboardControlMode==='job'"
        :panel-style="contentPaneStyle"
        :pane-height="paneHeight"
        :job-name="selectedJobDisplayName"
        :edit-mode="jobEditMode"
        :parsed="selectedJobParsed"
        :none-label="NONE_LABEL"
        :missing-recipe-map="selectedJobMissingRecipeMap"
        @activate="activateArea('jobContent', 'job')"
        @open-menu="onJobContentMenu"
        @register-content-el="setJobContentRoot"
        @save-as="jobContentSaveAs"
        @enter-edit="jobContentEnterEdit"
        @save="jobSaveClicked"
        @cancel="jobCancelRequested"
        @toggle-flag="onJobParsedToggleFlag"
        @value-click="onJobParsedValueClick"
      />
    </div>

    <RecipePanel
      :open="recipePanelOpen"
      :active-platen="activePlaten"
      v-model:findModel="recipeFindModel"
      :find-class="recipeFindClass"
      :recipe-cols="recipeCols"
      :selected-recipe-ids="selectedRecipeIds"
      :selected-recipe-single="selectedRecipeSingle"
      :title-base="recipePanelTitleBase"
      :emphasize-text="recipePanelEmphasizeText"
      :edit-mode="recipeEditMode"
      :list-mode="recipeListMode"
      :scroll-left="recipeScrollLeft"
      :col-widths="recipeListColWidths"
      @activate="activateArea('recipeArea', 'recipe')"
      @area-click="onRecipeAreaClick"
      @open-menu="onRecipeListMenu"
      @apply-find="applyRecipeFind(true)"
      @close="closeRecipePanel"
      @pick="onRecipePanelPick"
      @item-contextmenu="onRecipeListItemContextMenu"
      @register-item-ref="onRecipeItemRef"
      @register-root="setRecipePanelRoot"
      @update:listMode="recipeListMode = $event"
      @body-scroll="onRecipeBodyScroll"
      @start-resize="onRecipeListResize"
      @register-scroll-el="setRecipeScrollEl"
    />

    <Win97ContextMenu
      :open="ctxMenu.open"
      :x="ctxMenu.x"
      :y="ctxMenu.y"
      :items="ctxMenu.items"
    />

    <Win97ConfirmDialog
      :open="confirmModal.open"
      :title="confirmModal.title"
      :tone="confirmModal.tone"
      :message="confirmModal.message"
      @yes="confirmYes"
      @no="confirmNo"
    />

    <RecipePickerDialog
      :open="recipePicker.open"
      :find-class="recipePickerFindClass"
      :hint="recipePickerHint"
      v-model:query="recipePickerQueryModel"
      :platen="recipePicker.platen"
      :recipe-cols="recipePickerCols"
      :preview-id="recipePicker.previewId"
      :preview-recipe="previewRecipe"
      :title-base="recipePickerTitleBase"
      :emphasize-text="recipePickerEmphasizeText"
      :list-mode="recipePickerListMode"
      :scroll-left="recipePickerScrollLeft"
      :col-widths="recipePickerColWidths"
      :wide="jobEditMode"
      @apply-find="applyRecipePickerFind(true)"
      @item-click="onRecipePickerItemClick"
      @select="pickRecipeForJob"
      @close="closeRecipePicker"
      @register-item-ref="onRecipePickerItemRef"
      @update:listMode="recipePickerListMode = $event"
      @body-scroll="onRecipePickerBodyScroll"
      @start-resize="onRecipePickerListResize"
      @register-scroll-el="setRecipePickerScrollEl"
    />

    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  recipeTestApi,
  type JobConfigPayload,
  type RecipeDetail,
  type FileEntry,
  type JobParsed,
  type JobRecipeClickPayload,
  type RecipeSourceKind,
  type EqpOptionItem,
  type TransferCartItem,
} from '../api/recipeTestApi'
import RecipeTestHeader from '../components/RecipeTestHeader.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import CasFileListPanel from '../components/CasFileListPanel.vue'
import CasContentPanel from '../components/CasContentPanel.vue'
import JobFileListPanel from '../components/JobFileListPanel.vue'
import JobContentPanel from '../components/JobContentPanel.vue'
import RecipePanel from '../components/RecipePanel.vue'
import RecipePickerDialog from '../components/RecipePickerDialog.vue'
import Win97ContextMenu from '../components/Win97ContextMenu.vue'
import Win97ConfirmDialog from '../components/Win97ConfirmDialog.vue'
import TransferCartPanel from '../components/TransferCartPanel.vue'

/** Per_Col */
const CAS_PER_COL = 25
const JOB_PER_COL = 25
const RECIPE_PER_COL = 8

/** Heights */
const PANE_H = 662
const LIST_PANE_H = 674
const paneHeight = `${PANE_H}px`
const listPaneHeight = `${LIST_PANE_H}px`

/** constants */
const NONE_LABEL = '(None)'
const NONE_RECIPE: RecipeDetail = {
  id: 'R_NONE',
  name: NONE_LABEL,
  modifiedAt: '',
  sourceKind: 'recipe',
  columns: ['Info'],
  rows: [{ Info: 'No recipe selected.' }]
}
const CAS_NONE_ID = '__CAS_NONE__'
const JOB_NONE_ID = '__JOB_NONE__'
const DEFAULT_RECIPE_SOURCE: RecipeSourceKind = 'recipe'
const NO_PREVIEW_SOURCE_KINDS = new Set<RecipeSourceKind>(['isrmAlgorithm', 'rtpcRecipe'])


const RECIPE_SOURCE_EXTS: Record<RecipeSourceKind, string[]> = {
  recipe: ['.br', '.meg', '.dryr', '.drpr', '.pol', '.con', '.alg', '.seg', '.scx', '.cln'],
  polishRecipe: ['.pol'],
  conditionRecipe: ['.con'],
  exSituCondition: ['.con'],
  specialExSitu: ['.con'],
  isrmAlgorithm: ['.alg', '.seg'],
  rtpcRecipe: ['.scx'],
  hcluPostLoad: ['.cln'],
  hcluPreUnload: ['.cln'],
  megasonics: ['.meg'],
  brush1: ['.br'],
  brush2: ['.br'],
  vaporDryer: ['.dryr', '.drpr'],
  metrologyRecipe: [],
}

type CasListItem = FileEntry
type JobItem = {
  id: string
  jobName: string
  recipe: RecipeDetail
  modifiedAt?: string
}
type JobConfig = JobConfigPayload

type ConfirmTone = 'default' | 'warn'

/** options */
const lineOptionsLocal = ref<string[]>([])
const teamOptionsLocal = ref<string[]>([])
const eqpOptionsLocal = ref<string[]>([])
const eqpMasterItems = ref<EqpOptionItem[]>([])

const line = ref('')
const team = ref('')
const eqpId = ref('')

const actorName = ref('')

const actorNameModel = computed({
  get: () => actorName.value,
  set: (value: string) => {
    actorName.value = String(value || '')
    try { window.localStorage.setItem('recipe_test_actor_name', actorName.value) } catch {}
  },
})


const isLoading = ref(false)
const hasLoadedFiles = ref(false)
const loadingMessage = ref('FTP 파일과 목록을 불러오는중...')

const casHeadEl = ref<HTMLDivElement|null>(null)
const jobHeadEl = ref<HTMLDivElement|null>(null)
const jobScrollEl = ref<HTMLDivElement|null>(null)
const casScrollLeft = ref(0)
const jobScrollLeft = ref(0)

/** active pane / keyboard control */
type PaneKey = 'casList' | 'casContent' | 'jobList' | 'jobContent' | 'recipeArea'
type KeyboardMode = 'cas' | 'job' | 'recipe'

const activePane = ref<PaneKey>('casList')
const keyboardControlMode = ref<KeyboardMode>('cas')

function activateArea(pane: PaneKey, mode: KeyboardMode) {
  activePane.value = pane
  keyboardControlMode.value = mode
}

function ensureActorName() {
  let value = String(actorName.value || '').trim()
  if (!value) {
    try { value = String(window.localStorage.getItem('recipe_test_actor_name') || '').trim() } catch {}
  }
  actorName.value = value
  return value || 'Unknown'
}
function getActorName() {
  return ensureActorName()
}
function getActorTeam() {
  return String(team.value || '').trim()
}

function loadHistory() { /* History page에서 별도 조회 */ }


/** util */
function naturalCompare(a: string, b: string) {
  if (a === NONE_LABEL && b === NONE_LABEL) return 0
  if (a === NONE_LABEL) return -1
  if (b === NONE_LABEL) return 1
  return a.localeCompare(b, ['ko-KR', 'en-US'], {
    numeric: true,
    sensitivity: 'base',
    ignorePunctuation: true,
  })
}

function stripFileExt(name: unknown, exts: string[] = []) {
  const text = String(name ?? '').trim()
  if (!text) return ''
  const lower = text.toLowerCase()
  for (const ext of exts) {
    const extLower = String(ext).toLowerCase()
    if (lower.endsWith(extLower)) {
      return text.slice(0, text.length - ext.length)
    }
  }
  return text
}

function displayCasName(name: unknown) {
  if (String(name ?? '').trim() === CAS_NONE_ID) return NONE_LABEL
  return stripFileExt(name, ['.cas'])
}
function displayJobName(name: unknown) {
  if (String(name ?? '').trim() === JOB_NONE_ID) return NONE_LABEL
  return stripFileExt(name, ['.job'])
}
function displayRecipeName(name: unknown, sourceKind: RecipeSourceKind = DEFAULT_RECIPE_SOURCE) {
  return stripFileExt(name, RECIPE_SOURCE_EXTS[sourceKind] ?? RECIPE_SOURCE_EXTS.recipe)
}
function normalizeRecipeDisplayName(name: unknown, sourceKind: RecipeSourceKind = DEFAULT_RECIPE_SOURCE) {
  return normalizeSearchValue(displayRecipeName(name, sourceKind))
}
function recipeDisplayNameEquals(a: unknown, b: unknown, sourceKind: RecipeSourceKind = DEFAULT_RECIPE_SOURCE) {
  return normalizeRecipeDisplayName(a, sourceKind) === normalizeRecipeDisplayName(b, sourceKind)
}
function makeTempSourceRecipeId(kind: RecipeSourceKind, name: string) {
  return `RCP_TMP::${kind}::${displayRecipeName(name, kind)}`
}
function isTempSourceRecipeId(recipeId: string | undefined | null) {
  return String(recipeId || '').startsWith('RCP_TMP::')
}
function parseTempSourceRecipeIdLocal(recipeId: string | undefined | null) {
  const raw = String(recipeId || '')
  if (!raw.startsWith('RCP_TMP::')) return null
  const payload = raw.slice('RCP_TMP::'.length)
  const idx = payload.indexOf('::')
  if (idx < 0) return null
  return {
    sourceKind: payload.slice(0, idx) as RecipeSourceKind,
    recipeName: payload.slice(idx + 2),
  }
}

function findLoadedSourceRecipeByName(name: string, sourceKind: RecipeSourceKind) {
  const pools = [
    ...(recipeSourceCache[sourceKind] ?? []),
    ...allRecipes.value.filter(r => (r.sourceKind ?? sourceKind) === sourceKind),
  ]
  const clean = displayRecipeName(name, sourceKind)
  const exact = pools.find(r => recipeDisplayNameEquals(r.name, clean, sourceKind))
  if (exact) return exact

  const normRaw = normalizeSearchValue(String(name || ''))
  const rawMatch = pools.find(r => normalizeSearchValue(String(r.name || '')) === normRaw)
  if (rawMatch) return rawMatch

  const exts = RECIPE_SOURCE_EXTS[sourceKind] ?? []
  for (const ext of exts) {
    const withExt = `${clean}${ext}`
    const hit = pools.find(r => normalizeSearchValue(String(r.name || '')) === normalizeSearchValue(withExt))
    if (hit) return hit
  }
  return null
}

function syncResolvedRecipeId(oldId: string, newId: string) {
  if (!oldId || !newId || oldId === newId) return
  if (selectedRecipes.has(oldId)) {
    selectedRecipes.delete(oldId)
    selectedRecipes.add(newId)
  }
  if (lastRecipe.value === oldId) lastRecipe.value = newId
  if (recipePicker.previewId === oldId) recipePicker.previewId = newId
  recipesData.value = recipesData.value.filter(r => r.id !== oldId)
  for (const key of Object.keys(recipeSourceCache)) {
    const sourceKind = key as RecipeSourceKind
    const cached = recipeSourceCache[sourceKind]
    if (cached?.length) {
      recipeSourceCache[sourceKind] = cached.filter(r => r.id !== oldId)
    }
  }
}
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T
}

function parseModifiedTimeKey(value: string | undefined) {
  const text = String(value || '').trim()
  const m = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(AM|PM)$/i)
  if (!m) return Number.MIN_SAFE_INTEGER

  let [, mm, dd, yy, hh, mi, ap] = m
  let hour = Number(hh)
  if (ap.toUpperCase() === 'AM') {
    if (hour === 12) hour = 0
  } else {
    if (hour !== 12) hour += 12
  }
  const year = 2000 + Number(yy)
  const date = new Date(year, Number(mm) - 1, Number(dd), hour, Number(mi), 0, 0)
  return date.getTime()
}

function displayModifiedTime(value: string | undefined) {
  const text = String(value || '').trim()
  const raw12h = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(AM|PM)$/i)
  if (raw12h) {
    let [, mm, dd, yy, hh, mi, ap] = raw12h
    let hour = Number(hh)
    if (ap.toUpperCase() === 'AM') {
      if (hour === 12) hour = 0
    } else {
      if (hour !== 12) hour += 12
    }
    return `${yy}-${mm}-${dd} ${String(hour).padStart(2, '0')}:${mi}`
  }

  const raw24h = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/)
  if (raw24h) {
    const [, mm, dd, yy, hh, mi] = raw24h
    return `${yy}-${mm}-${dd} ${hh}:${mi}`
  }

  return text
}

function sortCasData() { casData.value = [...casData.value] }
function sortJobsData() { jobsData.value = [...jobsData.value] }
function sortRecipesData() {
  recipesData.value = [...recipesData.value].sort((a, b) => naturalCompare(a.name, b.name))
}

function createPlaceholderRecipe(
  id: string,
  name: string,
  info = 'Select a recipe.',
  modifiedAt = '',
  sourceKind: RecipeSourceKind = 'recipe'
): RecipeDetail {
  const lower = String(name || '').toLowerCase()
  if (sourceKind === 'isrmAlgorithm' || sourceKind === 'rtpcRecipe' || lower.endsWith('.alg') || lower.endsWith('.seg') || lower.endsWith('.scx')) {
    return createNoPreviewRecipe(id, name, modifiedAt, sourceKind)
  }
  return {
    id,
    name,
    modifiedAt: displayModifiedTime(modifiedAt),
    sourceKind,
    columns: ['Info'],
    rows: [{ Info: info }],
  }
}
function createNoPreviewRecipe(
  id: string,
  name: string,
  modifiedAt = '',
  sourceKind: RecipeSourceKind = 'recipe'
): RecipeDetail {
  return {
    id,
    name,
    modifiedAt: displayModifiedTime(modifiedAt),
    sourceKind,
    columns: [],
    rows: [],
  }
}

function isPlaceholderRecipe(recipe: RecipeDetail | null | undefined) {
  if (!recipe) return true
  return recipe.columns.length === 1 && recipe.columns[0] === 'Info'
}
function upsertRecipeInSourceCache(detail: RecipeDetail) {
  const sourceKind = (detail.sourceKind ?? activeRecipeSourceKind.value) as RecipeSourceKind
  const cached = recipeSourceCache[sourceKind]
  if (!cached?.length) return
  const idx = cached.findIndex(r => r.id === detail.id)
  const next = { ...detail, sourceKind }
  if (idx >= 0) {
    recipeSourceCache[sourceKind] = [...cached.slice(0, idx), next, ...cached.slice(idx + 1)]
    return
  }
  const sameNameIdx = cached.findIndex(r => recipeDisplayNameEquals(r.name, next.name, sourceKind))
  if (sameNameIdx >= 0) {
    recipeSourceCache[sourceKind] = [...cached.slice(0, sameNameIdx), next, ...cached.slice(sameNameIdx + 1)]
  }
}
function replaceRecipeDetail(detail: RecipeDetail) {
  const normalized: RecipeDetail = {
    ...detail,
    modifiedAt: displayModifiedTime(String(detail.modifiedAt ?? '').trim()),
    sourceKind: (detail.sourceKind ?? activeRecipeSourceKind.value) as RecipeSourceKind,
  }
  const idx = recipesData.value.findIndex(r => r.id === normalized.id)
  if (idx >= 0) {
    const prev = recipesData.value[idx]
    const nextModifiedAt = String(normalized.modifiedAt ?? '').trim() || String(prev.modifiedAt ?? '').trim()
    recipesData.value[idx] = { ...normalized, modifiedAt: displayModifiedTime(nextModifiedAt) }
  } else {
    const sameNameIdx = recipesData.value.findIndex(r => (r.sourceKind ?? normalized.sourceKind) === normalized.sourceKind && recipeDisplayNameEquals(r.name, normalized.name, normalized.sourceKind ?? DEFAULT_RECIPE_SOURCE))
    if (sameNameIdx >= 0) {
      recipesData.value[sameNameIdx] = { ...recipesData.value[sameNameIdx], ...normalized }
    } else {
      recipesData.value = [...recipesData.value, normalized]
    }
  }
  upsertRecipeInSourceCache(normalized)
  sortRecipesData()
}
function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}
function clearObject(obj: Record<string, any>) {
  for (const key of Object.keys(obj)) delete obj[key]
}

const INVALID_FILENAME_CHARS = /[\/:*?"<>|]/
const asciiNameInputEl = ref<HTMLInputElement | null>(null)
const asciiNameModal = reactive({
  open: false,
  title: 'Rename',
  placeholder: '',
  value: '',
  resolve: null as ((value: string | null) => void) | null,
})

function sanitizeAsciiFileNameInput(raw: string) {
  return Array.from(String(raw ?? ''))
    .filter(ch => {
      const code = ch.charCodeAt(0)
      if (code < 32 || code > 126) return false
      return !INVALID_FILENAME_CHARS.test(ch)
    })
    .join('')
}

function onAsciiNameInput(event: Event) {
  const nextValue = sanitizeAsciiFileNameInput((event.target as HTMLInputElement).value)
  asciiNameModal.value = nextValue
  ;(event.target as HTMLInputElement).value = nextValue
}

function onAsciiNamePaste(event: ClipboardEvent) {
  const pasted = sanitizeAsciiFileNameInput(event.clipboardData?.getData('text') ?? '')
  const input = event.target as HTMLInputElement
  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? input.value.length
  const next = `${asciiNameModal.value.slice(0, start)}${pasted}${asciiNameModal.value.slice(end)}`
  asciiNameModal.value = sanitizeAsciiFileNameInput(next)
  requestAnimationFrame(() => {
    input.value = asciiNameModal.value
    const caret = Math.min(start + pasted.length, asciiNameModal.value.length)
    input.setSelectionRange(caret, caret)
  })
}

function onAsciiBeforeInput(event: InputEvent) {
  const data = event.data ?? ''
  if (!data) return
  if (sanitizeAsciiFileNameInput(data) !== data) {
    event.preventDefault()
  }
}

function onAsciiCompositionEnd(event: CompositionEvent) {
  const input = event.target as HTMLInputElement
  const nextValue = sanitizeAsciiFileNameInput(input.value)
  asciiNameModal.value = nextValue
  input.value = nextValue
}

function openAsciiNamePrompt(title: string, initialValue: string, _placeholder = '') {
  const input = window.prompt(title, initialValue)
  if (input == null) return Promise.resolve<string | null>(null)
  return Promise.resolve(input)
}


function normalizeSearchValue(s: string) {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')
}
function hasSpace(s:string){ return /\s/.test(s) }
function hasComma(s:string){ return s.includes(',') }

function pickBestDisplayValue(raw: string, candidates: string[]) {
  const q = normalizeSearchValue(raw)
  if (!q) return null

  const exact = candidates.find(c => normalizeSearchValue(c) === q)
  if (exact) return exact

  let best: string | null = null
  let bestLen = -1
  for (const c of candidates) {
    const norm = normalizeSearchValue(c)
    if (q.startsWith(norm) && norm.length > bestLen) {
      best = c
      bestLen = norm.length
    }
  }
  if (best) return best

  const starts = candidates.find(c => normalizeSearchValue(c).startsWith(q))
  if (starts) return starts

  return candidates[0] ?? null
}

function isSelectableRecipeValue(value: string | undefined) {
  const v = String(value || '').trim()
  return v !== '' && v !== NONE_LABEL
}

/** base arrays */
const casData = ref<CasListItem[]>([])
const jobsData = ref<JobItem[]>([])
const recipesData = ref<RecipeDetail[]>([])
const jobParsedMap = reactive<Record<string, JobParsed>>({})
const recipeSourceCache = reactive<Record<string, RecipeDetail[]>>({})
const recipeSourceTitleMap = reactive<Record<string, string>>({ recipe: 'Recipe' })
const snapshotCachedKinds = new Set<string>()
const activeRecipeSourceKind = ref<RecipeSourceKind>(DEFAULT_RECIPE_SOURCE)
const inventorySnapshotHash = ref('')
let inventorySnapshotTimer: number | null = null

/** sorting / list widths */
const casSortKey = ref<null | 'name' | 'modifiedAt'>(null)
const casSortDir = ref<null | 'asc' | 'desc'>(null)

const jobSortKey = ref<null | 'jobName' | 'modifiedAt'>(null)
const jobSortDir = ref<null | 'asc' | 'desc'>(null)

function toggleSort(
  keyRef: { value: null | string },
  dirRef: { value: null | 'asc' | 'desc' },
  key: string
) {
  if (keyRef.value !== key) {
    keyRef.value = key
    dirRef.value = 'asc'
    return
  }
  if (dirRef.value === 'asc') {
    dirRef.value = 'desc'
    return
  }
  keyRef.value = null
  dirRef.value = null
}

function sortIndicator(
  keyRef: { value: null | string },
  dirRef: { value: null | 'asc' | 'desc' },
  key: string
) {
  if (keyRef.value !== key || !dirRef.value) return ''
  return dirRef.value === 'asc' ? '▲' : '▼'
}

const casListColWidths = reactive({
  name: 158,
  modifiedAt: 82,
})

const jobListColWidths = reactive({
  name: 178,
  modifiedAt: 82,
})

const recipeListColWidths = reactive({
  name: 150,
  modifiedAt: 92,
})

const recipePickerColWidths = reactive({
  name: 169,
  modifiedAt: 139,
})

const casListMode = ref<'name' | 'detail'>('name')
const jobListMode = ref<'name' | 'detail'>('name')
const recipeListMode = ref<'name' | 'detail'>('name')
const recipePickerListMode = ref<'name' | 'detail'>('name')
const recipeScrollLeft = ref(0)
const recipePickerScrollLeft = ref(0)

const recipePanelTitleBase = ref('Recipe')
const recipePanelEmphasizeText = ref('')
const recipePickerTitleBase = ref('Recipe')
const recipePickerEmphasizeText = ref('')

type ListKey = 'cas' | 'job'
type ListColKey = 'name' | 'modifiedAt'

const listResizeState = reactive<{
  active: boolean
  listKey: ListKey | null
  colKey: ListColKey | null
  startX: number
  startW: number
}>({
  active: false,
  listKey: null,
  colKey: null,
  startX: 0,
  startW: 0,
})

function startListResize(listKey: ListKey, colKey: ListColKey, e: MouseEvent) {
  const target = listKey === 'cas' ? casListColWidths : jobListColWidths

  listResizeState.active = true
  listResizeState.listKey = listKey
  listResizeState.colKey = colKey
  listResizeState.startX = e.clientX
  listResizeState.startW = target[colKey]

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onListResizeMove)
  window.addEventListener('mouseup', stopListResize)
}

function onListResizeMove(e: MouseEvent) {
  if (!listResizeState.active || !listResizeState.listKey || !listResizeState.colKey) return

  const delta = e.clientX - listResizeState.startX
  const minW = listResizeState.colKey === 'modifiedAt' ? 82 : 70
  const nextW = Math.max(minW, listResizeState.startW + delta)

  const target = listResizeState.listKey === 'cas' ? casListColWidths : jobListColWidths
  target[listResizeState.colKey] = nextW
}

function onListBodyScroll(kind: ListKey) {
  if (kind === 'cas' && casScrollEl.value) casScrollLeft.value = casScrollEl.value.scrollLeft
  if (kind === 'job' && jobScrollEl.value) jobScrollLeft.value = jobScrollEl.value.scrollLeft
}

function stopListResize() {
  listResizeState.active = false
  listResizeState.listKey = null
  listResizeState.colKey = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onListResizeMove)
  window.removeEventListener('mouseup', stopListResize)
}

function onRecipeBodyScroll() {
  if (recipeScrollEl.value) recipeScrollLeft.value = recipeScrollEl.value.scrollLeft
}
function onRecipePickerBodyScroll() {
  if (recipePickerScrollEl.value) recipePickerScrollLeft.value = recipePickerScrollEl.value.scrollLeft
}

type RecipeListResizeTarget = 'panel' | 'picker'
const recipeListResizeState = reactive<{
  active: boolean
  target: RecipeListResizeTarget | null
  colKey: 'name' | 'modifiedAt' | null
  startX: number
  startW: number
}>({
  active: false,
  target: null,
  colKey: null,
  startX: 0,
  startW: 0,
})

function startRecipeResize(target: RecipeListResizeTarget, colKey: 'name' | 'modifiedAt', e: MouseEvent) {
  const widths = target === 'panel' ? recipeListColWidths : recipePickerColWidths
  recipeListResizeState.active = true
  recipeListResizeState.target = target
  recipeListResizeState.colKey = colKey
  recipeListResizeState.startX = e.clientX
  recipeListResizeState.startW = widths[colKey]
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onRecipeResizeMove)
  window.addEventListener('mouseup', stopRecipeResize)
}

function onRecipeResizeMove(e: MouseEvent) {
  if (!recipeListResizeState.active || !recipeListResizeState.target || !recipeListResizeState.colKey) return
  const widths = recipeListResizeState.target === 'panel' ? recipeListColWidths : recipePickerColWidths
  const delta = e.clientX - recipeListResizeState.startX
  const minW = recipeListResizeState.colKey === 'modifiedAt' ? 82 : 90
  widths[recipeListResizeState.colKey] = Math.max(minW, recipeListResizeState.startW + delta)
}

function stopRecipeResize() {
  recipeListResizeState.active = false
  recipeListResizeState.target = null
  recipeListResizeState.colKey = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onRecipeResizeMove)
  window.removeEventListener('mouseup', stopRecipeResize)
}

function onRecipeListResize(payload: { colKey: 'name' | 'modifiedAt'; event: MouseEvent }) {
  startRecipeResize('panel', payload.colKey, payload.event)
}
function onRecipePickerListResize(payload: { colKey: 'name' | 'modifiedAt'; event: MouseEvent }) {
  startRecipeResize('picker', payload.colKey, payload.event)
}

/** computed sorted lists */
const casItems = computed(() => {
  const arr = [...casData.value]
  if (casSortKey.value && casSortDir.value) {
    arr.sort((a, b) => {
      const cmp = casSortKey.value === 'name'
        ? naturalCompare(displayCasName(a.name), displayCasName(b.name))
        : parseModifiedTimeKey(a.modifiedAt) - parseModifiedTimeKey(b.modifiedAt)
      return casSortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return arr
})

const jobs = computed<JobItem[]>(() => {
  const sorted = [...jobsData.value]
  if (jobSortKey.value && jobSortDir.value) {
    sorted.sort((a, b) => {
      const cmp = jobSortKey.value === 'jobName'
        ? naturalCompare(displayJobName(a.jobName), displayJobName(b.jobName))
        : parseModifiedTimeKey(a.modifiedAt) - parseModifiedTimeKey(b.modifiedAt)
      return jobSortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return sorted
})

const allRecipes = computed<RecipeDetail[]>(() => {
  const sorted = [...recipesData.value].sort((a,b)=>naturalCompare(a.name,b.name))
  return [NONE_RECIPE, ...sorted]
})

const casDisplayItems = computed(() => hasLoadedFiles.value ? ([{ name: CAS_NONE_ID, modifiedAt: '' } as CasListItem, ...casItems.value]) : [])
const jobDisplayItems = computed(() => hasLoadedFiles.value ? ([{ id: JOB_NONE_ID, jobName: NONE_LABEL, recipe: NONE_RECIPE, modifiedAt: '' } as JobItem, ...jobs.value]) : [])

const filteredLineOptions = computed(() => {
  const lines = eqpMasterItems.value.map(x => x.line).filter(Boolean)
  const unique = lines.filter((v, i, arr) => arr.indexOf(v) === i).sort()
  return unique.length ? unique : [...lineOptionsLocal.value]
})

const filteredTeamOptions = computed(() => {
  const teams = eqpMasterItems.value
    .filter(x => !line.value || x.line === line.value)
    .map(x => x.team)
    .filter(Boolean)
  const unique = teams.filter((v, i, arr) => arr.indexOf(v) === i).sort()
  if (unique.length) return unique
  if (!eqpMasterItems.value.length) return [...teamOptionsLocal.value]
  const fallback = (!line.value ? teamOptionsLocal.value : eqpMasterItems.value.filter(x => x.line === line.value).map(x => x.team))
  return fallback.filter((v, i, arr) => !!v && arr.indexOf(v) === i).sort()
})

const filteredEqpOptions = computed(() => {
  const items = eqpMasterItems.value
    .filter(x => !line.value || x.line === line.value)
    .filter(x => !team.value || x.team === team.value)

  const eqps = items.map(x => x.eqpId).filter(Boolean)
  const unique = eqps.filter((v, i, arr) => arr.indexOf(v) === i).sort()
  if (unique.length) return unique
  return [...eqpOptionsLocal.value]
})

async function loadEqpOptions() {
  const cacheKey = 'recipe-test:eqp-options'
  try {
    const res = await recipeTestApi.getEqpOptions()
    eqpMasterItems.value = res.items
    lineOptionsLocal.value = res.lineOptions
    teamOptionsLocal.value = res.teamOptions
    eqpOptionsLocal.value = res.eqpOptions
    window.localStorage.setItem(cacheKey, JSON.stringify(res))
  } catch (err) {
    console.error('loadEqpOptions failed:', err)
    try {
      const cached = window.localStorage.getItem(cacheKey)
      if (cached) {
        const res = JSON.parse(cached)
        eqpMasterItems.value = Array.isArray(res?.items) ? res.items : []
        lineOptionsLocal.value = Array.isArray(res?.lineOptions) ? res.lineOptions : []
        teamOptionsLocal.value = Array.isArray(res?.teamOptions) ? res.teamOptions : []
        eqpOptionsLocal.value = Array.isArray(res?.eqpOptions) ? res.eqpOptions : []
      }
    } catch (cacheErr) {
      console.error('loadEqpOptions cache restore failed:', cacheErr)
    }
  }

}

watch(line, (nextLine) => {
  if (team.value && !eqpMasterItems.value.some(x => (!nextLine || x.line === nextLine) && x.team === team.value)) {
    team.value = ''
  }

  if (eqpId.value && !eqpMasterItems.value.some(x => x.eqpId === eqpId.value && (!nextLine || x.line === nextLine) && (!team.value || x.team === team.value))) {
    eqpId.value = ''
  }
})

watch(team, (nextTeam) => {
  if (nextTeam && !line.value) {
    const matchedLine = eqpMasterItems.value.find(x => x.team === nextTeam)?.line ?? ''
    if (matchedLine) line.value = matchedLine
  }

  if (eqpId.value && !eqpMasterItems.value.some(x => x.eqpId === eqpId.value && (!line.value || x.line === line.value) && (!nextTeam || x.team === nextTeam))) {
    eqpId.value = ''
  }
})

watch(eqpId, (nextEqpId) => {
  if (!nextEqpId) return
  const matched = eqpMasterItems.value.find(x => x.eqpId === nextEqpId)
  if (!matched) return
  if (matched.line && matched.line !== line.value) line.value = matched.line
  if (matched.team && matched.team !== team.value) team.value = matched.team
})

/** mapping */
const casToJobs = ref<Record<string,string[]>>({})

/** selections */
const selectedCas = reactive(new Set<string>())
const selectedJobs = reactive(new Set<string>())
const selectedRecipes = reactive(new Set<string>(['R_NONE']))

type CartKind = 'cas' | 'job' | 'recipe'
type CartItem = {
  key: string
  kind: CartKind
  name: string
  sourceEqpId: string
  sourceKind?: RecipeSourceKind
  maker: string
  modelGroup: string
}
const cartItems = ref<CartItem[]>([])
const cartOpen = ref(false)
const cartMoving = ref(false)
const selectedCartTargetEqpIdsSet = reactive(new Set<string>())
const cartFlyTokens = ref<Array<{ id: number; label: string; x: number; y: number; tx: number; ty: number }>>([])
const cartShakeToken = ref(0)
const currentEqpMeta = computed(() => eqpMasterItems.value.find(x => x.eqpId === eqpId.value) ?? null)
const cartCount = computed(() => cartItems.value.length)
const cartMaker = computed(() => cartItems.value[0]?.maker ?? '')
const cartModelGroup = computed(() => cartItems.value[0]?.modelGroup ?? '')
const cartViewItems = computed(() => cartItems.value)
const cartTargetOptions = computed(() => {
  if (!cartItems.value.length) return [] as EqpOptionItem[]
  const excluded = new Set(cartItems.value.map(x => x.sourceEqpId))
  return eqpMasterItems.value
    .filter(x => !excluded.has(x.eqpId))
    .filter(x => !cartMaker.value || x.maker === cartMaker.value)
    .filter(x => !cartModelGroup.value || x.modelGroup === cartModelGroup.value)
})
const selectedCartTargetEqpIds = computed(() => Array.from(selectedCartTargetEqpIdsSet))

/** anchors */
const casAnchorIdx = ref<number|null>(null)
const jobAnchorIdx = ref<number|null>(null)
const recipeAnchorIdx = ref<number|null>(null)
const recipePickerAnchorIdx = ref<number|null>(null)

/** cursor idx */
const casCursorIdx = ref<number | null>(null)
const jobCursorIdx = ref<number | null>(null)
const recipeCursorIdx = ref<number | null>(null)

/** last ids */
const lastCas = ref('')
const lastJob = ref('')
const lastRecipe = ref('R_NONE')

/** refs */
const casScrollEl = ref<HTMLDivElement|null>(null)
const legacyPanelEl = ref<HTMLElement|null>(null)
const jobContentEl = ref<HTMLElement|null>(null)
const recipeScrollEl = ref<HTMLDivElement|null>(null)
const recipePickerScrollEl = ref<HTMLDivElement|null>(null)
const casContentEl = ref<HTMLElement|null>(null)
const cartAnchorEl = ref<HTMLElement|null>(null)
const cartOverlayPos = reactive({ top: 86, right: 20 })

function updateCartOverlayPos() {
  const rect = cartAnchorEl.value?.getBoundingClientRect()
  if (!rect) {
    cartOverlayPos.top = 86
    cartOverlayPos.right = 20
    return
  }
  cartOverlayPos.top = Math.round(rect.bottom + 10)
  cartOverlayPos.right = Math.max(16, Math.round(window.innerWidth - rect.right))
}

const cartOverlayStyle = computed(() => ({
  top: `${cartOverlayPos.top}px`,
  right: `${cartOverlayPos.right}px`,
}))

const casRefs = new Map<string, HTMLElement>()
const jobRefs = new Map<string, HTMLElement>()
const recipeRefs = new Map<string, HTMLElement>()
const recipePickerRefs = new Map<string, HTMLElement>()

function setCasRef(id:string, el:HTMLElement|null){ if(el) casRefs.set(id, el) }
function setJobRef(id:string, el:HTMLElement|null){ if(el) jobRefs.set(id, el) }
function setRecipeRef(id:string, el:HTMLElement|null){ if(el) recipeRefs.set(id, el) }
function setRecipePickerRef(id:string, el:HTMLElement|null){ if(el) recipePickerRefs.set(id, el) }
function setCasScrollEl(el: HTMLDivElement | null) {
  casScrollEl.value = el
}
function setJobScrollEl(el: HTMLDivElement | null) {
  jobScrollEl.value = el
}
function setRecipeScrollEl(el: HTMLDivElement | null) {
  recipeScrollEl.value = el
}
function setRecipePickerScrollEl(el: HTMLDivElement | null) {
  recipePickerScrollEl.value = el
}
function setCartAnchor(el: HTMLElement | null) {
  cartAnchorEl.value = el
  updateCartOverlayPos()
}
function toggleCartPanel() {
  cartOpen.value = !cartOpen.value
  if (cartOpen.value) nextTick(() => updateCartOverlayPos())
}

function closeCartOverlay() {
  cartOpen.value = false
}

function setCasContentRoot(el: HTMLElement | null) {
  casContentEl.value = el
}
function setJobContentRoot(el: HTMLElement | null) {
  jobContentEl.value = el
}
function setRecipePanelRoot(el: HTMLElement | null) {
  legacyPanelEl.value = el
}
function onCasItemRef(payload: { id: string; el: HTMLElement | null }) {
  setCasRef(payload.id, payload.el)
}
function onJobItemRef(payload: { id: string; el: HTMLElement | null }) {
  setJobRef(payload.id, payload.el)
}
function onRecipeItemRef(payload: { id: string; el: HTMLElement | null }) {
  setRecipeRef(payload.id, payload.el)
}
function onRecipePickerItemRef(payload: { id: string; el: HTMLElement | null }) {
  setRecipePickerRef(payload.id, payload.el)
}

function resetCasScrollToLeftTop(){
  if(casScrollEl.value){
    casScrollEl.value.scrollLeft=0
    casScrollEl.value.scrollTop=0
  }
}
function findScrollableParent(el: HTMLElement | null): HTMLElement | null {
  let cur = el?.parentElement ?? null
  while (cur) {
    const style = window.getComputedStyle(cur)
    const canScrollY = /(auto|scroll)/.test(style.overflowY) && cur.scrollHeight > cur.clientHeight
    const canScrollX = /(auto|scroll)/.test(style.overflowX) && cur.scrollWidth > cur.clientWidth
    if (canScrollX || canScrollY || cur.classList.contains('w97-scroll')) return cur
    cur = cur.parentElement
  }
  return null
}

function scrollElementIntoPaddedView(el: HTMLElement | null, padding = 8) {
  if (!el) return
  const container = findScrollableParent(el)
  if (!container) {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return
  }

  const style = window.getComputedStyle(container)
  const padX = Math.max(padding, parseFloat(style.paddingLeft || '0') || 0, parseFloat(style.paddingRight || '0') || 0)
  const padY = Math.max(padding, parseFloat(style.paddingTop || '0') || 0, parseFloat(style.paddingBottom || '0') || 0)
  const elRect = el.getBoundingClientRect()
  const boxRect = container.getBoundingClientRect()

  if (elRect.left < boxRect.left + padX) {
    container.scrollLeft -= (boxRect.left + padX) - elRect.left
  } else if (elRect.right > boxRect.right - padX) {
    container.scrollLeft += elRect.right - (boxRect.right - padX)
  }

  if (elRect.top < boxRect.top + padY) {
    container.scrollTop -= (boxRect.top + padY) - elRect.top
  } else if (elRect.bottom > boxRect.bottom - padY) {
    container.scrollTop += elRect.bottom - (boxRect.bottom - padY)
  }
}

async function scrollIntoView(map:Map<string,HTMLElement>, id:string|null | undefined, padding = 8){
  await nextTick()
  if(!id) return
  scrollElementIntoPaddedView(map.get(id) ?? null, padding)
}

/** scroll helpers */
let scrollBottomTimer: any = null
function scrollPageToBottom(delay = 80) {
  clearTimeout(scrollBottomTimer)
  scrollBottomTimer = setTimeout(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  }, delay)
}
async function ensureRecipePanelVisibleOnOpen(delay = 50) {
  clearTimeout(scrollBottomTimer)
  scrollBottomTimer = setTimeout(() => {
    const panel = legacyPanelEl.value
    if (!panel) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
      return
    }
    const rect = panel.getBoundingClientRect()
    const fullyVisible = rect.top >= 8 && rect.bottom <= window.innerHeight - 12
    if (fullyVisible) return
    const targetTop = Math.max(0, window.scrollY + rect.top - 16)
    window.scrollTo({ top: targetTop, behavior: 'smooth' })
  }, delay)
}
function onRecipeAreaClick() {
  activateArea('recipeArea', 'recipe')
}

/** columns */
const casCols = computed(() => {
  const arr = casDisplayItems.value
  const out: CasListItem[][] = []
  for (let i=0;i<arr.length;i+=CAS_PER_COL) out.push(arr.slice(i,i+CAS_PER_COL))
  return out
})
const jobCols = computed(() => {
  const arr = jobDisplayItems.value
  const out: JobItem[][] = []
  for (let i=0;i<arr.length;i+=JOB_PER_COL) out.push(arr.slice(i,i+JOB_PER_COL))
  return out
})
const recipeCols = computed(() => {
  const arr = allRecipes.value
  const out: RecipeDetail[][] = []
  for (let i=0;i<arr.length;i+=RECIPE_PER_COL) out.push(arr.slice(i,i+RECIPE_PER_COL))
  return out
})


const selectedCasIds = computed(() => Array.from(selectedCas))
const selectedJobIds = computed(() => Array.from(selectedJobs))
const selectedRecipeIds = computed(() => Array.from(selectedRecipes))
const selectedSlotNumbers = computed(() => Array.from(selectedSlotCells))
const casSelectedSingleDisplay = computed(() => displayCasName(casSelectedSingle.value))
const selectedJobDisplayName = computed(() => displayJobName(selectedJobSingleReal.value?.jobName))
const casListViewCols = computed(() =>
  casCols.value.map(col =>
    col.map(item => ({
      name: item.name,
      displayName: displayCasName(item.name),
      displayModifiedAt: displayModifiedTime(item.modifiedAt),
    }))
  )
)
const jobListViewCols = computed(() =>
  jobCols.value.map(col =>
    col.map(item => ({
      id: item.id,
      jobName: item.jobName,
      displayName: displayJobName(item.jobName),
      displayModifiedAt: displayModifiedTime(item.modifiedAt ?? ''),
    }))
  )
)

/** cas content / animated widths */
const casSelectedSingle = computed(() => {
  if (selectedCas.size !== 1) return null
  const id = Array.from(selectedCas)[0]
  return id === CAS_NONE_ID ? null : id
})
const previewJobId = computed(() => {
  if (selectedJobs.size === 1) {
    const id = Array.from(selectedJobs)[0]
    return id && id !== JOB_NONE_ID ? id : ''
  }
  const fallback = String(lastJob.value || '')
  if (fallback && fallback !== JOB_NONE_ID && selectedJobs.has(fallback)) return fallback
  return ''
})
const selectedJobSingleReal = computed(() => {
  const id = previewJobId.value
  if (!id) return null
  return jobsData.value.find(j => j.id === id) ?? null
})
const showJobContent = computed(()=>!!selectedJobSingleReal.value)
const selectedJobParsed = computed(() => {
  const jobId = selectedJobSingleReal.value?.id
  if (!jobId) return null
  return jobParsedMap[jobId] ?? null
})

const jobMissingRecipeMapById = reactive<Record<string, Record<string, boolean>>>({})
const selectedJobMissingRecipeMap = computed(() => {
  const jobId = selectedJobSingleReal.value?.id
  if (!jobId) return {}
  return jobMissingRecipeMapById[jobId] ?? {}
})

function jobMissingKey(...parts: Array<string | number | null | undefined>) {
  return parts.filter(v => v !== undefined && v !== null && String(v) !== '').join('::')
}
function polisherSourceKindForLabel(rowLabel: string): RecipeSourceKind {
  if (rowLabel === 'Polish Recipe') return 'polishRecipe'
  if (rowLabel === 'Condition Recipe') return 'conditionRecipe'
  if (rowLabel === 'Ex Situ Condition') return 'exSituCondition'
  if (rowLabel === 'Special Ex Situ') return 'specialExSitu'
  if (rowLabel === 'ISRM Algorithm') return 'isrmAlgorithm'
  if (rowLabel === 'RTPC Recipe') return 'rtpcRecipe'
  return 'recipe'
}
function cleanerSourceKindForLabel(label: string): RecipeSourceKind {
  if (label === 'Megasonics') return 'megasonics'
  if (label === 'Brush 1') return 'brush1'
  if (label === 'Brush 2') return 'brush2'
  if (label === 'Vapor Dryer') return 'vaporDryer'
  return 'recipe'
}
async function primeRecipeSourceCache(sourceKind: RecipeSourceKind) {
  if (!eqpId.value) return
  if (sourceKind === 'recipe') {
    if (!recipeSourceCache.recipe?.length) recipeSourceCache.recipe = [...recipesData.value]
    return
  }
  // If cache was populated from snapshot (DB-only), force API call once to get FTP+DB merged data
  if (recipeSourceCache[sourceKind]?.length && !snapshotCachedKinds.has(sourceKind)) return
  snapshotCachedKinds.delete(sourceKind)
  try {
    const res = await recipeTestApi.getRecipeSourceList(eqpId.value, sourceKind)
    recipeSourceTitleMap[sourceKind] = res.titleBase
    const items = res.items.map(item =>
      NO_PREVIEW_SOURCE_KINDS.has(item.sourceKind)
        ? createNoPreviewRecipe(item.id, item.name, item.modifiedAt, item.sourceKind)
        : createPlaceholderRecipe(item.id, item.name, `${res.titleBase} preview placeholder`, item.modifiedAt, item.sourceKind)
    )
    recipeSourceCache[sourceKind] = [...items]
  } catch (err) {
    console.warn('primeRecipeSourceCache failed:', sourceKind, err)
  }
}
function recipeExistsInSource(sourceKind: RecipeSourceKind, value: string) {
  const clean = String(value || '').trim()
  if (!clean || clean === NONE_LABEL) return true
  const list = sourceKind === 'recipe'
    ? (recipeSourceCache.recipe?.length ? recipeSourceCache.recipe : recipesData.value)
    : (recipeSourceCache[sourceKind] ?? [])
  if (!list.length) return true
  return list.some(r => recipeDisplayNameEquals(r.name, clean, sourceKind))
}
async function refreshJobMissingRecipeMap(jobId: string) {
  const parsed = jobParsedMap[jobId]
  if (!parsed) {
    delete jobMissingRecipeMapById[jobId]
    return
  }

  const kinds = new Set<RecipeSourceKind>()
  const addKind = (value: string | undefined, kind: RecipeSourceKind) => {
    const txt = String(value || '').trim()
    if (!txt || txt === NONE_LABEL) return
    kinds.add(kind)
  }

  addKind(parsed.preMetrology?.recipe, 'metrologyRecipe')
  addKind(parsed.postMetrology?.recipe, 'metrologyRecipe')
  addKind(parsed.hcluRecipes?.postLoad, 'hcluPostLoad')
  addKind(parsed.hcluRecipes?.preUnload, 'hcluPreUnload')
  for (const row of parsed.polisher?.rows ?? []) addKind((row as any)?.p1, polisherSourceKindForLabel((row as any)?.label || ''))
  for (const row of parsed.polisher?.rows ?? []) addKind((row as any)?.p2, polisherSourceKindForLabel((row as any)?.label || ''))
  for (const row of parsed.polisher?.rows ?? []) addKind((row as any)?.p3, polisherSourceKindForLabel((row as any)?.label || ''))
  ;(parsed.cleaner?.rows ?? []).forEach((row: any, idx: number) => addKind(row?.recipe, cleanerSourceKindForLabel(cleanerModuleLabelForRow(row, idx))))

  await Promise.all(Array.from(kinds).map(k => primeRecipeSourceCache(k)))

  const next: Record<string, boolean> = {}
  next[jobMissingKey('preMetrology')] = !recipeExistsInSource('metrologyRecipe', parsed.preMetrology?.recipe ?? '')
  next[jobMissingKey('postMetrology')] = !recipeExistsInSource('metrologyRecipe', parsed.postMetrology?.recipe ?? '')
  next[jobMissingKey('hclu','postLoad')] = !recipeExistsInSource('hcluPostLoad', parsed.hcluRecipes?.postLoad ?? '')
  next[jobMissingKey('hclu','preUnload')] = !recipeExistsInSource('hcluPreUnload', parsed.hcluRecipes?.preUnload ?? '')

  for (const row of parsed.polisher?.rows ?? []) {
    const label = (row as any)?.label || ''
    const kind = polisherSourceKindForLabel(label)
    next[jobMissingKey('polisher', label, 'p1')] = !recipeExistsInSource(kind, (row as any)?.p1 ?? '')
    next[jobMissingKey('polisher', label, 'p2')] = !recipeExistsInSource(kind, (row as any)?.p2 ?? '')
    next[jobMissingKey('polisher', label, 'p3')] = !recipeExistsInSource(kind, (row as any)?.p3 ?? '')
  }
  ;(parsed.cleaner?.rows ?? []).forEach((row: any, idx: number) => {
    const moduleLabel = cleanerModuleLabelForRow(row, idx)
    const kind = cleanerSourceKindForLabel(moduleLabel)
    next[jobMissingKey('cleaner', idx)] = !recipeExistsInSource(kind, row?.recipe ?? '')
  })
  jobMissingRecipeMapById[jobId] = next
}

watch(() => selectedJobSingleReal.value?.id, (jobId) => {
  if (jobId) void refreshJobMissingRecipeMap(jobId)
}, { immediate: true })

const casContentCanShow = computed(() => {
  return casEditMode.value || activePane.value === 'casList' || activePane.value === 'casContent'
})
const casContentVisible = computed(() => {
  return !!casSelectedSingle.value && casContentCanShow.value
})

const isJobFocused = computed(() => activePane.value === 'jobContent' && showJobContent.value)
const isCasInactive = computed(() => activePane.value !== 'casList' && activePane.value !== 'casContent')
const singleLinkedJobMode = computed(() => !!casSelectedSingle.value && selectedJobs.size === 1)

const casPanelStyle = computed(() => {
  let w = 'clamp(351px, 22.5vw, 450px)'
  let minW = '351px'
  if (isCasInactive.value) { w = 'clamp(306px, 18vw, 360px)'; minW = '306px' }
  if (isJobFocused.value || activePane.value === 'recipeArea') { w = 'clamp(306px, 18vw, 360px)'; minW = '306px' }

  return { height: listPaneHeight, width: w, flexBasis: w, minWidth: minW, flexShrink: '0' }
})

const casContentStyle = computed(() => {
  if (!casContentVisible.value) {
    return { height: listPaneHeight, width: '0px', flexBasis: '0px' }
  }
  const w = 'max-content'
  return { height: listPaneHeight, width: w, flexBasis: w, flexShrink: '0' }
})

const jobPanelStyle = computed(() => {
  let w = activePane.value === 'jobList'
    ? 'clamp(599px, 36.5vw, 750px)'
    : 'clamp(400px, 20vw, 500px)'

  if (singleLinkedJobMode.value && showJobContent.value) {
    w = 'clamp(500px, 30vw, 600px)'
  }
  return { height: listPaneHeight, width: w, flexBasis: w }
})

const contentPaneStyle = computed(() => ({
  flexGrow: '0',
  width: 'max-content',
  flexBasis: 'max-content',
  flexShrink: '0',
}))

/** cas tab */
const casTab = ref<'standard'|'pre'|'gating'|'post'>('standard')
const casTabLabel = computed(()=>
  casTab.value==='pre' ? 'Pre-Polish' :
  casTab.value==='gating' ? 'Gating & Rework' :
  casTab.value==='post' ? 'Post Rework' : 'Standard'
)

/** cas table */
type CasSlotRow = { slot:number; jobId:string; jobName:string; recipeName:string }
const casTableMap = reactive<Record<string, CasSlotRow[]>>({})
const casLoadingMap = reactive<Record<string, boolean>>({})
const jobLoadingMap = reactive<Record<string, boolean>>({})
const recipeLoadingMap = reactive<Record<string, boolean>>({})

const casTableRows = computed(() => {
  const casId = casSelectedSingle.value
  if(!casId) return []
  return casTableMap[casId] ?? []
})

function normalizeJobNameForMatch(name: string) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .replace(/\.[A-Z0-9]+$/, '')
    .replace(/\s+/g, '')
}

function findJobIdsByName(jobName: string): string[] {
  const key = normalizeJobNameForMatch(jobName)
  return jobsData.value
    .filter(j => normalizeJobNameForMatch(j.jobName) === key)
    .map(j => j.id)
}

function cleanerModuleLabelForRow(row: { index?: string; module?: string }, idx: number) {
  const raw = `${String(row.index ?? '')} ${String(row.module ?? '')}`.toLowerCase().replace(/\s+/g, ' ')
  if (raw.includes('cleaner input') || raw.includes('clean input') || raw.includes('cl input')) return 'Cleaner Input'
  if (raw.includes('megasonic')) return 'Megasonics'
  if (raw.includes('brush 1') || raw.includes('brush1')) return 'Brush 1'
  if (raw.includes('brush 2') || raw.includes('brush2')) return 'Brush 2'
  if (raw.includes('vapor dryer') || raw.includes('dryer')) return 'Vapor Dryer'
  if (raw.includes('cleaner output') || raw.includes('clean output') || raw.includes('cl output')) return 'Cleaner Output'

  return ['Cleaner Input', 'Megasonics', 'Brush 1', 'Brush 2', 'Vapor Dryer', 'Cleaner Output'][idx] ?? 'Cleaner'
}

function extractJobIdsFromCasRows(rows: Array<{ jobId?: string; jobName?: string }>) {
  const ids = new Set<string>()

  for (const row of rows) {
    if (row.jobId && jobsData.value.find(j => j.id === row.jobId)) {
      ids.add(row.jobId)
      continue
    }

    const matches = findJobIdsByName(row.jobName ?? '')
    for (const id of matches) ids.add(id)
  }

  return Array.from(ids)
}

function syncJobSelectionFromCasRows(
  rows: Array<{ jobId?: string; jobName?: string }>
) {
  const ids = extractJobIdsFromCasRows(rows)
  if (!ids.length) {
    selectedJobs.clear()
    selectedJobs.add(JOB_NONE_ID)
    lastJob.value = JOB_NONE_ID
    jobAnchorIdx.value = jobDisplayItems.value.findIndex(j => j.id === JOB_NONE_ID)
    jobCursorIdx.value = jobAnchorIdx.value
    setJobQueryProgram(NONE_LABEL)
    return
  }

  selectedJobs.clear()
  ids.forEach(id => selectedJobs.add(id))

  lastJob.value = ids[0]
  jobAnchorIdx.value = jobDisplayItems.value.findIndex(j => j.id === ids[0])
  jobCursorIdx.value = jobAnchorIdx.value

  const matchedJobs = jobsData.value.filter(j => ids.includes(j.id))
  setJobQueryProgram(
    ids.length === 1
      ? (displayJobName(matchedJobs[0]?.jobName ?? NONE_LABEL))
      : matchedJobs.map(j => displayJobName(j.jobName)).sort(naturalCompare).join(', ')
  )

  // 자동 선택 시에는 Job pane을 강제로 활성화하지 않음
  void scrollIntoView(jobRefs, ids[0])
  if (ids.length === 1) {
    void fetchJobContent(ids[0])
  }
}

async function ensureRecipeDetailById(recipeId: string) {
  if (!recipeId || recipeId === 'R_NONE') return

  if (isTempSourceRecipeId(recipeId)) {
    const parsed = parseTempSourceRecipeIdLocal(recipeId)
    if (parsed) {
      const resolved = findLoadedSourceRecipeByName(parsed.recipeName, parsed.sourceKind)
      if (resolved && resolved.id !== recipeId) {
        syncResolvedRecipeId(recipeId, resolved.id)
        await ensureRecipeDetailById(resolved.id)
        return
      }
    }
  }

  if (recipeLoadingMap[recipeId]) return

  const current = allRecipes.value.find(r => r.id === recipeId)
  if (!current || !isPlaceholderRecipe(current)) return

  recipeLoadingMap[recipeId] = true
  try {
    const res = await recipeTestApi.getRecipeContent(eqpId.value, recipeId)
    replaceRecipeDetail(res.recipe)
    if (res.recipe?.id && res.recipe.id !== recipeId) {
      syncResolvedRecipeId(recipeId, res.recipe.id)
    }
  } catch (err) {
    console.error('ensureRecipeDetailById failed:', err)
  } finally {
    recipeLoadingMap[recipeId] = false
  }
}

function ensureRecipeByName(name: string, sourceKind: RecipeSourceKind = activeRecipeSourceKind.value) {
  const clean = displayRecipeName(name, sourceKind)
  if (!clean || clean === NONE_LABEL) return NONE_RECIPE

  const sourceItems = (recipeSourceCache[sourceKind] ?? []).filter(r => r.id !== 'R_NONE')
  const fallbackItems = allRecipes.value.filter(r => r.id !== 'R_NONE')
  const matcher = (recipe: RecipeDetail) => recipeDisplayNameEquals(recipe.name, clean, sourceKind)

  let found = sourceItems.find(matcher)
  if (!found) found = fallbackItems.find(matcher)
  if (!found) {
    found = sourceItems.find(r => normalizeSearchValue(String(r.name)) === normalizeSearchValue(String(name)))
      ?? fallbackItems.find(r => normalizeSearchValue(String(r.name)) === normalizeSearchValue(String(name)))
  }
  if (!found) {
    found = findLoadedSourceRecipeByName(clean, sourceKind)
  }
  if (found) return found

  const id = makeTempSourceRecipeId(sourceKind, clean)
  found = recipesData.value.find(r => r.id === id)
  if (!found) {
    found = NO_PREVIEW_SOURCE_KINDS.has(sourceKind)
      ? createNoPreviewRecipe(id, clean, '', sourceKind)
      : createPlaceholderRecipe(id, clean, `${recipeSourceTitleMap[sourceKind] || 'Recipe'} placeholder preview`, '', sourceKind)
    recipesData.value = [...recipesData.value.filter(r => r.id !== id), found]
    recipeSourceCache[sourceKind] = [...sourceItems, found]
    sortRecipesData()
  }
  return found
}

function setActiveRecipeSource(sourceKind: RecipeSourceKind, items: RecipeDetail[]) {
  activeRecipeSourceKind.value = sourceKind
  recipeSourceCache[sourceKind] = [...items]
  recipesData.value = [...items]
  sortRecipesData()
}

async function ensureRecipeSourceLoaded(sourceKind: RecipeSourceKind) {
  if (sourceKind === 'recipe' && recipeSourceCache.recipe) {
    setActiveRecipeSource('recipe', recipeSourceCache.recipe)
    return
  }

  if (recipeSourceCache[sourceKind]?.length) {
    setActiveRecipeSource(sourceKind, recipeSourceCache[sourceKind])
    return
  }

  const res = await recipeTestApi.getRecipeSourceList(eqpId.value, sourceKind)
  if (sourceKind === 'metrologyRecipe' && res.readError) {
    console.warn('metrology source read failed:', res.readError)
  }
  recipeSourceTitleMap[sourceKind] = res.titleBase
  const items = res.items.map(item =>
    NO_PREVIEW_SOURCE_KINDS.has(item.sourceKind)
      ? createNoPreviewRecipe(item.id, item.name, item.modifiedAt, item.sourceKind)
      : createPlaceholderRecipe(item.id, item.name, `${res.titleBase} preview placeholder`, item.modifiedAt, item.sourceKind)
  )
  setActiveRecipeSource(sourceKind, items)
}

async function onJobParsedValueClick(payload: JobRecipeClickPayload) {
  if (jobEditMode.value) {
    await openRecipePickerForPayload(payload)
    return
  }

  await ensureRecipeSourceLoaded(payload.sourceKind)
  const recipe = ensureRecipeByName(payload.value, payload.sourceKind)
  void openRecipePanelWithRecipe(recipe, payload.platen ?? 1, payload.titleBase, payload.emphasizeText ?? '')
}

function toggleJobParsedFlag(section: 'preMetrology' | 'postMetrology' | 'polisher' | 'cleaner', key: string, checked: boolean) {
  const jobId = selectedJobSingleReal.value?.id
  if (!jobId || !jobEditMode.value) return
  const parsed = jobParsedMap[jobId]
  if (!parsed || !parsed[section]) return
  parsed[section][key] = checked
}

function jobValueCellClass(value: string, platen?: number) {
  return {
    clickable: isSelectableRecipeValue(value),
    'platen2-col': platen === 2,
  }
}

async function fetchCasContent(casId: string) {
  if (!casId || casId === CAS_NONE_ID) return
  if (casLoadingMap[casId]) return

  casLoadingMap[casId] = true
  try {
    const res = await recipeTestApi.getCasContent(eqpId.value, casId)
    casTableMap[casId] = res.slots.map(x => ({
      slot: x.slot,
      jobId: x.jobId,
      jobName: x.jobName,
      recipeName: x.recipeName,
    }))

    const derivedIds = extractJobIdsFromCasRows(
      res.slots.map(x => ({
        jobId: x.jobId,
        jobName: x.jobName,
      }))
    )

    const apiIds = (res.jobIds ?? []).filter(id => jobsData.value.find(j => j.id === id))
    const merged = Array.from(new Set([...apiIds, ...derivedIds]))

    casToJobs.value[casId] = merged

    if (selectedCas.size === 1 && selectedCas.has(casId)) {
      applyCasToJobsFromSelection()
      syncJobSelectionFromCasRows(
        res.slots.map(x => ({
          jobId: x.jobId,
          jobName: x.jobName,
        }))
      )
    }
  } catch (err) {
    console.error('fetchCasContent failed:', err)
  } finally {
    casLoadingMap[casId] = false
  }
}

async function fetchJobContent(jobId: string) {
  if (!jobId || jobId === JOB_NONE_ID) return
  if (jobLoadingMap[jobId]) return

  jobLoadingMap[jobId] = true
  try {
    const res = await recipeTestApi.getJobContent(eqpId.value, jobId)

    jobParsedMap[jobId] = deepClone(res.parsed)
    await refreshJobMissingRecipeMap(jobId)

    const job = jobsData.value.find(j => j.id === jobId)
    if (job) {
      const baseRecipePool = [NONE_RECIPE, ...((recipeSourceCache.recipe ?? recipesData.value).filter(r => r.id !== 'R_NONE'))]
      const actualRecipe =
        baseRecipePool.find(r => r.name === res.baseRecipeName && r.id !== 'R_NONE') ?? null

      job.recipe = actualRecipe ?? createPlaceholderRecipe(
        `BASE_${jobId}`,
        res.baseRecipeName || job.recipe.name,
        'Base recipe summary',
        '',
        'recipe'
      )
    }
  } catch (err) {
    console.error('fetchJobContent failed:', err)
  } finally {
    jobLoadingMap[jobId] = false
  }
}

/** cas edit */
const casEditMode = ref(false)
const selectedSlotCells = reactive(new Set<number>())
const casAnchorSlot = ref<number|null>(null)

function clearCasCellSelection(){
  selectedSlotCells.clear()
  casAnchorSlot.value=null
}
function selectJobNameColumn(){
  if(!casEditMode.value) return
  selectedSlotCells.clear()
  for(let s=1;s<=24;s++) selectedSlotCells.add(s)
  casAnchorSlot.value=1
}
function onCasTableHeaderClick(idx:number){
  if(idx===1){
    selectJobNameColumn()
  }
}

/** job list attention */
const jobListAttention = ref(false)
let jobAttentionTimer: any = null
function triggerJobListAttention() {
  clearTimeout(jobAttentionTimer)
  jobListAttention.value = false
  requestAnimationFrame(() => {
    jobListAttention.value = true
    jobAttentionTimer = setTimeout(() => {
      jobListAttention.value = false
    }, 900)
  })
}

function onCasCellClick(slot:number, jobName:string, e:MouseEvent){
  if(!casEditMode.value){
    e.preventDefault()
    e.stopPropagation()
    return
  }

  e.preventDefault()
  e.stopPropagation()

  const ctrl = e.ctrlKey || e.metaKey
  const shift = e.shiftKey

  if(!ctrl && !shift){
    selectedSlotCells.clear()
    selectedSlotCells.add(slot)
    casAnchorSlot.value=slot
  } else if(ctrl){
    selectedSlotCells.has(slot) ? selectedSlotCells.delete(slot) : selectedSlotCells.add(slot)
    casAnchorSlot.value=slot
  } else {
    const anchor = casAnchorSlot.value ?? slot
    const a=Math.min(anchor,slot), b=Math.max(anchor,slot)
    selectedSlotCells.clear()
    for(let s=a;s<=b;s++) selectedSlotCells.add(s)
  }

  triggerJobListAttention()
}

const casBaseline = reactive<Record<string,string>>({})
function snapshotCasBaseline(casId:string){
  casBaseline[casId] = JSON.stringify(casTableMap[casId] ?? [])
}
function casDirty(casId:string){
  const cur = JSON.stringify(casTableMap[casId] ?? [])
  const base = casBaseline[casId] ?? '[]'
  return cur !== base
}
function revertCas(casId:string){
  const base = casBaseline[casId]
  if(!base) return
  casTableMap[casId] = JSON.parse(base)
}
function applyJobToSelectedSlots(jobId:string){
  const casId = casSelectedSingle.value
  if(!casId) return
  if(!casEditMode.value) return
  if(selectedSlotCells.size===0) return

  const rows = casTableMap[casId] ?? []
  const job = jobsData.value.find(j=>j.id===jobId)
  const jobName = job ? displayJobName(job.jobName) : NONE_LABEL
  const recipeName = job ? job.recipe.name : ''
  for(const slot of selectedSlotCells){
    const r = rows.find(x=>x.slot===slot)
    if(!r) continue
    r.jobId = jobId
    r.jobName = jobName
    r.recipeName = recipeName
  }
}

function jobSearchInCasContent(jobName: string) {
  const matchedIds = findJobIdsByName(jobName)
  if (!matchedIds.length) return

  selectedJobs.clear()
  matchedIds.forEach(id => selectedJobs.add(id))

  lastJob.value = matchedIds[0]
  jobAnchorIdx.value = jobDisplayItems.value.findIndex(j => j.id === matchedIds[0])
  jobCursorIdx.value = jobAnchorIdx.value

  const matchedJobs = jobsData.value.filter(j => matchedIds.includes(j.id))
  setJobQueryProgram(
    matchedIds.length === 1
      ? (displayJobName(matchedJobs[0]?.jobName ?? NONE_LABEL))
      : matchedJobs.map(j => displayJobName(j.jobName)).sort(naturalCompare).join(', ')
  )

  if (matchedIds.length === 1) {
    void scrollIntoView(jobRefs, matchedIds[0])
    void fetchJobContent(matchedIds[0])
  } else {
    void scrollIntoView(jobRefs, matchedIds[0])
  }
}

/** job edit */
const jobEditMode = ref(false)
const jobConfigMap = reactive<Record<string, JobConfig>>({})
const jobBaseline = reactive<Record<string,string>>({})

function ensureJobConfig(jobId:string){
  if(!jobId) return
  if(jobConfigMap[jobId]) return
  const base = jobsData.value.find(j=>j.id===jobId)
  const baseName = base?.recipe?.name ?? NONE_LABEL
  jobConfigMap[jobId] = {
    p1: baseName,
    p2: baseName,
    p3: baseName,
    piPre: 'NONE',
    piPost: 'DATA',
    unloadModule: 'DATA',
  }
}
function snapshotJobBaseline(jobId:string){
  jobBaseline[jobId] = JSON.stringify(jobParsedMap[jobId] ?? {})
}
function jobDirty(jobId:string){
  const cur = JSON.stringify(jobParsedMap[jobId] ?? {})
  const base = jobBaseline[jobId] ?? '{}'
  return cur !== base
}
function revertJob(jobId:string){
  const base = jobBaseline[jobId]
  if(!base) return
  jobParsedMap[jobId] = JSON.parse(base)
}
function jobPlatenRecipeName(p:1|2|3){
  const jobId = selectedJobSingleReal.value?.id
  if(!jobId) return ''
  const parsed = jobParsedMap[jobId]
  if (!parsed?.polisher?.rows?.length) return ''
  const row = parsed.polisher.rows.find((x:any) => x.label === 'Polish Recipe')
  if (!row) return ''
  return p===1 ? row.p1 : p===2 ? row.p2 : row.p3
}

/** recipe panel */
const recipePanelOpen = ref(false)
const activePlaten = ref<1|2|3>(1)
const recipeEditMode = ref(false)
const recipeFind = ref('')
const recipeFindState = ref<'ok'|'bad'|'idle'>('idle')

const recipeFindModel = computed({
  get:()=>recipeFind.value,
  set:(v:string)=>{ recipeFind.value=v }
})
const recipeFindClass = computed(() =>
  recipeFindState.value==='ok' ? 'find-ok' :
  recipeFindState.value==='bad' ? 'find-bad' : ''
)

const selectedRecipeSingle = computed(() => {
  if(selectedRecipes.size!==1) return null
  const id = Array.from(selectedRecipes)[0]
  if(id==='R_NONE') return null
  return allRecipes.value.find(r=>r.id===id) ?? null
})

function closeRecipePanel(){
  recipePanelOpen.value=false
  recipeEditMode.value=false
  recipePanelTitleBase.value='Recipe'
  recipePanelEmphasizeText.value='' 
  selectedRecipes.clear()
  selectedRecipes.add('R_NONE')
  lastRecipe.value='R_NONE'
  setRecipeFindProgram('')
  recipeFindState.value='idle'
  if (recipeSourceCache.recipe) {
    setActiveRecipeSource('recipe', recipeSourceCache.recipe)
  }
}

type ReloadRestoreSpec = {
  casNames: string[]
  jobNames: string[]
  recipeNames: Array<{ name: string; sourceKind: RecipeSourceKind }>
  keepRecipePanel: boolean
  activePane: PaneKey
  keyboardMode: KeyboardMode
  previewJobName?: string
}

function captureReloadRestoreSpec(overrides?: Partial<ReloadRestoreSpec>): ReloadRestoreSpec {
  const currentPreviewName = (() => {
    const previewIdNow = previewJobId.value || lastJob.value
    const job = jobsData.value.find(j => j.id === previewIdNow)
    return job?.jobName ?? ''
  })()
  return {
    casNames: Array.from(selectedCas).filter(Boolean),
    jobNames: Array.from(selectedJobs).map(id => jobsData.value.find(j => j.id === id)?.jobName ?? id).filter(Boolean),
    recipeNames: Array.from(selectedRecipes).map(id => {
      const recipe = allRecipes.value.find(r => r.id === id)
      return {
        name: recipe?.name ?? '',
        sourceKind: (recipe?.sourceKind ?? activeRecipeSourceKind.value) as RecipeSourceKind,
      }
    }).filter(x => x.name),
    keepRecipePanel: recipePanelOpen.value,
    activePane: activePane.value,
    keyboardMode: keyboardControlMode.value,
    previewJobName: currentPreviewName,
    ...(overrides || {}),
  }
}

async function reloadAndRestoreSelections(spec: ReloadRestoreSpec) {
  await load(spec.keepRecipePanel)

  selectedCas.clear()
  for (const name of spec.casNames) {
    if (casData.value.some(item => item.name === name)) selectedCas.add(name)
  }
  lastCas.value = selectedCas.size ? Array.from(selectedCas)[selectedCas.size - 1] || '' : ''

  if (selectedCas.size === 1) {
    const casId = Array.from(selectedCas)[0]
    if (casId) await fetchCasContent(casId)
  }

  selectedJobs.clear()
  for (const name of spec.jobNames) {
    const found = jobsData.value.find(item => item.jobName === name)
    if (found) selectedJobs.add(found.id)
  }

  const previewJob = spec.previewJobName
    ? jobsData.value.find(item => item.jobName === spec.previewJobName)
    : null
  if (previewJob && selectedJobs.has(previewJob.id)) {
    lastJob.value = previewJob.id
  } else {
    lastJob.value = selectedJobs.size ? Array.from(selectedJobs)[selectedJobs.size - 1] || '' : ''
  }

  selectedRecipes.clear()
  for (const token of spec.recipeNames) {
    const found = allRecipes.value.find(item => (item.sourceKind ?? activeRecipeSourceKind.value) === token.sourceKind && String(item.name || '') === String(token.name || ''))
    if (found) selectedRecipes.add(found.id)
  }
  if (!selectedRecipes.size) selectedRecipes.add('R_NONE')
  lastRecipe.value = Array.from(selectedRecipes)[selectedRecipes.size - 1] || 'R_NONE'

  const previewJobIdAfterReload = lastJob.value && selectedJobs.has(lastJob.value)
    ? lastJob.value
    : (selectedJobs.size ? Array.from(selectedJobs)[selectedJobs.size - 1] || '' : '')
  if (previewJobIdAfterReload && previewJobIdAfterReload !== JOB_NONE_ID) {
    await fetchJobContent(previewJobIdAfterReload)
  }
  if (spec.keepRecipePanel && selectedRecipes.size === 1) {
    const recipeId = Array.from(selectedRecipes)[0]
    if (recipeId && recipeId !== 'R_NONE') {
      await ensureRecipeDetailById(recipeId)
      await nextTick()
      await scrollIntoView(recipeRefs, recipeId)
    }
  }

  activePane.value = spec.activePane
  keyboardControlMode.value = spec.keyboardMode
}

let suppressOutsideCloseUntil = 0
async function openRecipePanelWithRecipe(recipe: RecipeDetail, platen:1|2|3 = 1, titleBase = 'Recipe', emphasizeText = '') {
  activePlaten.value = platen
  recipePanelTitleBase.value = titleBase || 'Recipe'
  recipePanelEmphasizeText.value = emphasizeText || ''
  recipePanelOpen.value = true
  recipeEditMode.value = false
  activateArea('recipeArea', 'recipe')

  const recipeSourceKind = recipe.sourceKind ?? activeRecipeSourceKind.value
  const preferred = isTempSourceRecipeId(recipe.id)
    ? (findLoadedSourceRecipeByName(recipe.name, recipeSourceKind) ?? recipe)
    : recipe

  const found = allRecipes.value.find(r =>
    r.id === preferred.id || (
      (r.sourceKind ?? recipeSourceKind) === recipeSourceKind
      && recipeDisplayNameEquals(r.name, preferred.name, recipeSourceKind)
    )
  ) ?? preferred

  selectedRecipes.clear()
  selectedRecipes.add(found.id)
  lastRecipe.value = found.id
  recipeCursorIdx.value = allRecipes.value.findIndex(r => r.id === found.id)

  setRecipeFindProgram(displayRecipeName(found.name, found.sourceKind ?? activeRecipeSourceKind.value))
  recipeFindState.value = 'ok'

  await ensureRecipeDetailById(found.id)

  await nextTick()
  await scrollIntoView(recipeRefs, lastRecipe.value || found.id)
  await ensureRecipePanelVisibleOnOpen()

  suppressOutsideCloseUntil = Date.now() + 350
}

async function openRecipePanel(platen:1|2|3){
  const jobId = selectedJobSingleReal.value?.id
  if(!jobId) return
  const parsed = jobParsedMap[jobId]
  const row = parsed?.polisher?.rows?.find((x:any) => x.label === 'Polish Recipe')
  if (!row) return
  const wanted =
    platen===1 ? row.p1 :
    platen===2 ? row.p2 :
    row.p3

  if (!isSelectableRecipeValue(wanted)) return

  await ensureRecipeSourceLoaded('polishRecipe')
  const found = ensureRecipeByName(wanted, 'polishRecipe')
  await openRecipePanelWithRecipe(found, platen, 'Polish Recipe', `Platen ${platen}`)
}

/** recipe picker */
const recipePicker = reactive<{ open:boolean; query:string; jobId:string; platen:1|2|3; previewId:string }>({
  open:false, query:'', jobId:'', platen:1, previewId:''
})
const recipePickerTarget = ref<JobRecipeClickPayload | null>(null)
const recipePickerSourceKind = ref<RecipeSourceKind>('polishRecipe')
const recipePickerProgram = ref(false)
const recipePickerState = ref<'ok'|'bad'|'idle'>('idle')
const recipePickerHint = ref('')

const recipePickerQueryModel = computed({
  get:()=>recipePicker.query,
  set:(v:string)=>{ recipePicker.query = v }
})
const recipePickerFindClass = computed(() =>
  recipePickerState.value==='ok' ? 'find-ok' :
  recipePickerState.value==='bad' ? 'find-bad' : ''
)

async function openRecipePickerForPayload(payload: JobRecipeClickPayload) {
  const jobId = selectedJobSingleReal.value?.id
  if (!jobId) return

  recipePickerTarget.value = payload
  recipePickerSourceKind.value = payload.sourceKind
  recipePickerTitleBase.value = payload.titleBase || 'Recipe'
  recipePickerEmphasizeText.value = payload.emphasizeText ?? ''
  recipePickerListMode.value = recipeListMode.value
  await ensureRecipeSourceLoaded(payload.sourceKind)

  recipePicker.open = true
  recipePicker.query = ''
  recipePicker.jobId = jobId
  recipePicker.platen = payload.platen ?? 1
  recipePickerState.value = 'idle'
  recipePickerHint.value = ''

  const currentName = payload.value || (payload.platen ? jobPlatenRecipeName(payload.platen) : '')
  const current = ensureRecipeByName(currentName || NONE_LABEL, payload.sourceKind)
  const resolvedCurrent = isTempSourceRecipeId(current.id) ? (findLoadedSourceRecipeByName(current.name, payload.sourceKind) ?? current) : current
  recipePicker.previewId = resolvedCurrent.id
  recipePickerAnchorIdx.value = filteredRecipePickerList.value.findIndex(r=>r.id===resolvedCurrent.id)
  nextTick(() => scrollIntoView(recipePickerRefs, resolvedCurrent.id))
  void ensureRecipeDetailById(resolvedCurrent.id)
}

function onJobRecipeCellClick(platen:1|2|3){
  const currentName = jobPlatenRecipeName(platen)
  void onJobParsedValueClick({
    value: currentName,
    sourceKind: 'polishRecipe',
    titleBase: 'Polish Recipe',
    emphasizeText: `Platen ${platen}`,
    platen,
  })
}

const activeRecipePickerPool = computed(() => {
  const sourceItems = recipeSourceCache[recipePickerSourceKind.value] ?? recipesData.value
  return [NONE_RECIPE, ...[...sourceItems].sort((a,b)=>naturalCompare(a.name,b.name))]
})

const filteredRecipePickerList = computed(() => {
  const q = normalizeSearchValue(recipePicker.query)
  const pool = activeRecipePickerPool.value
  if(!q) return pool
  return pool.filter(r => normalizeSearchValue(displayRecipeName(r.name, recipePickerSourceKind.value)).includes(q))
})
const previewRecipe = computed(() => activeRecipePickerPool.value.find(r => r.id === recipePicker.previewId) ?? null)
const recipePickerCols = computed(() => {
  const arr = filteredRecipePickerList.value
  const out: RecipeDetail[][] = []
  for(let i=0;i<arr.length;i+=RECIPE_PER_COL) out.push(arr.slice(i,i+RECIPE_PER_COL))
  return out
})

watch(filteredRecipePickerList, (list) => {
  if(!recipePicker.open) return
  if(list.length && !list.find(x=>x.id===recipePicker.previewId)){
    recipePicker.previewId = list[0].id
    recipePickerAnchorIdx.value = 0
    scrollIntoView(recipePickerRefs, list[0].id)
    void ensureRecipeDetailById(list[0].id)
  }
})

watch(() => recipePicker.query, () => {
  if(!recipePicker.open) return
  if(recipePickerProgram.value) return
  if(hasComma(recipePicker.query)) return
  clearTimeout(tRecipePicker)
  if(!recipePicker.query.trim()){
    recipePickerState.value = 'idle'
    recipePickerHint.value = ''
    return
  }
  tRecipePicker = setTimeout(()=>applyRecipePickerFind(false),160)
})

function onRecipePickerItemClick(id:string){
  recipePicker.previewId = id
  recipePickerAnchorIdx.value = filteredRecipePickerList.value.findIndex(r=>r.id===id)
  void ensureRecipeDetailById(id)
}

function jobStoredRecipeValue(recipe: RecipeDetail, sourceKind: RecipeSourceKind) {
  if (!recipe || recipe.id === 'R_NONE') return NONE_LABEL
  const rawName = String(recipe.name || '').trim()
  if (!rawName) return NONE_LABEL
  if (sourceKind === 'isrmAlgorithm' || sourceKind === 'rtpcRecipe') return rawName
  return displayRecipeName(rawName, sourceKind) || NONE_LABEL
}

function applyRecipePickerFind(_byButton:boolean){
  const raw = recipePicker.query
  const q = normalizeSearchValue(raw)
  const list = activeRecipePickerPool.value
  if(!q || !list.length) return

  const matches = list.filter(r => normalizeSearchValue(displayRecipeName(r.name, r.sourceKind ?? activeRecipeSourceKind.value)).includes(q))
  if(!matches.length){
    recipePickerState.value = 'bad'
    recipePickerHint.value = '검색 결과 없음'
    return
  }

  const best = matches.find(r=>normalizeSearchValue(displayRecipeName(r.name, recipePickerSourceKind.value))===q) ?? matches[0]
  recipePicker.previewId = best.id
  recipePickerAnchorIdx.value = filteredRecipePickerList.value.findIndex(r=>r.id===best.id)
  scrollIntoView(recipePickerRefs, best.id)
  void ensureRecipeDetailById(best.id)

  recipePickerState.value = 'ok'
  recipePickerHint.value = ''
  if(normalizeSearchValue(displayRecipeName(best.name, recipePickerSourceKind.value))===q){
    recipePickerProgram.value = true
    recipePicker.query = displayRecipeName(best.name, recipePickerSourceKind.value)
    recipePickerProgram.value = false
  }
}

function pickRecipeForJob(r: RecipeDetail){
  if(!r) return
  const jobId = recipePicker.jobId
  ensureJobConfig(jobId)
  const parsed = jobParsedMap[jobId]
  const target = recipePickerTarget.value
  if (!parsed || !target) return

  const polisherLabelMap: Record<string, string> = {
    polishRecipe: 'Polish Recipe',
    conditionRecipe: 'Condition Recipe',
    exSituCondition: 'Ex Situ Condition',
    specialExSitu: 'Special Ex Situ',
    isrmAlgorithm: 'ISRM Algorithm',
    rtpcRecipe: 'RTPC Recipe',
  }

  const cleanerKindMap: Record<string, string> = {
    megasonics: 'Megasonics',
    brush1: 'Brush 1',
    brush2: 'Brush 2',
    vaporDryer: 'Vapor Dryer',
  }

  if (target.sourceKind in polisherLabelMap) {
    const row = parsed?.polisher?.rows?.find((x:any) => x.label === polisherLabelMap[target.sourceKind])
    if (row) {
      const nextValue = jobStoredRecipeValue(r, target.sourceKind)
      if(recipePicker.platen===1) row.p1 = nextValue
      if(recipePicker.platen===2) row.p2 = nextValue
      if(recipePicker.platen===3) row.p3 = nextValue
    }
  } else if (target.sourceKind === 'hcluPostLoad') {
    parsed.hcluRecipes = parsed.hcluRecipes || { postLoad: NONE_LABEL, preUnload: NONE_LABEL }
    parsed.hcluRecipes.postLoad = jobStoredRecipeValue(r, target.sourceKind)
  } else if (target.sourceKind === 'hcluPreUnload') {
    parsed.hcluRecipes = parsed.hcluRecipes || { postLoad: NONE_LABEL, preUnload: NONE_LABEL }
    parsed.hcluRecipes.preUnload = jobStoredRecipeValue(r, target.sourceKind)
  } else if (target.sourceKind === 'recipe' && /Pre-Metrology/i.test(target.titleBase)) {
    parsed.preMetrology.recipe = jobStoredRecipeValue(r, target.sourceKind)
  } else if (target.sourceKind === 'recipe' && /Post-Metrology/i.test(target.titleBase)) {
    parsed.postMetrology.recipe = jobStoredRecipeValue(r, target.sourceKind)
  } else if (target.sourceKind in cleanerKindMap) {
    const wanted = cleanerKindMap[target.sourceKind]
    const row = parsed?.cleaner?.rows?.find((x:any, idx:number) => cleanerModuleLabelForRow(x, idx) === wanted)
    if (row) row.recipe = jobStoredRecipeValue(r, target.sourceKind)
  }

  recipePicker.open=false
  recipePickerTarget.value = null
}
function closeRecipePicker(){ recipePicker.open=false; recipePickerTitleBase.value='Recipe'; recipePickerEmphasizeText.value=''; recipePickerTarget.value = null }


function onCasListMenu(event: MouseEvent) {
  openListMenu('cas', event)
}
function onJobListMenu(event: MouseEvent) {
  openListMenu('job', event)
}
function onRecipeListMenu(event: MouseEvent) {
  openListMenu('recipe', event)
}
function onCasContentMenu(event: MouseEvent) {
  openContentMenu('casContent', event)
}
function onJobContentMenu(event: MouseEvent) {
  openContentMenu('jobContent', event)
}
function onCasSortToggle(key: 'name' | 'modifiedAt') {
  toggleSort(casSortKey, casSortDir, key)
}
function onJobSortToggle(key: 'jobName' | 'modifiedAt') {
  toggleSort(jobSortKey, jobSortDir, key)
}
function onCasListResize(payload: { colKey: 'name' | 'modifiedAt'; event: MouseEvent }) {
  startListResize('cas', payload.colKey, payload.event)
}
function onJobListResize(payload: { colKey: 'name' | 'modifiedAt'; event: MouseEvent }) {
  startListResize('job', payload.colKey, payload.event)
}
function onCasListItemClick(payload: { id: string; event: MouseEvent }) {
  onCasClick(payload.id, payload.event)
}
function onJobListItemClick(payload: { id: string; event: MouseEvent }) {
  onJobClick(payload.id, payload.event)
}
function onRecipePanelPick(payload: { recipeId: string; event: MouseEvent }) {
  onRecipePick(payload.recipeId, payload.event)
}
function onCasContentCellClick(payload: { slot: number; jobName: string; event: MouseEvent }) {
  onCasCellClick(payload.slot, payload.jobName, payload.event)
}
function onCasContentResize(payload: { index: number; event: MouseEvent }) {
  startResize('cas', payload.index, payload.event)
}
function onJobParsedToggleFlag(payload: {
  section: 'preMetrology' | 'postMetrology' | 'polisher' | 'cleaner'
  key: string
  checked: boolean
}) {
  toggleJobParsedFlag(payload.section, payload.key, payload.checked)
}

/** search state */
const casQuery = ref('')
const jobQuery = ref('')
const casState = ref<'ok'|'bad'|'idle'>('idle')
const jobState = ref<'ok'|'bad'|'idle'>('idle')
const casHint = ref('')
const jobHint = ref('')

const casProgram = ref(false)
const jobProgram = ref(false)
const recipeProgram = ref(false)

const casQueryModel = computed({
  get:()=>casQuery.value,
  set:(v:string)=>{ casQuery.value=v }
})
const jobQueryModel = computed({
  get:()=>jobQuery.value,
  set:(v:string)=>{ jobQuery.value=v }
})

const casClass = computed(()=> casState.value==='ok'?'find-ok':casState.value==='bad'?'find-bad':'')
const jobClass = computed(()=> jobState.value==='ok'?'find-ok':jobState.value==='bad'?'find-bad':'')

let skipCasWatch = false
let skipJobWatch = false
let skipRecipeWatch = false
function setCasQueryProgram(v:string){ skipCasWatch = true; casQuery.value = v }
function setJobQueryProgram(v:string){ skipJobWatch = true; jobQuery.value = v }
function setRecipeFindProgram(v:string){ skipRecipeWatch = true; recipeFind.value = v }

function joinSelectedJobsStr(){
  return jobsData.value.filter(j=>selectedJobs.has(j.id)).map(j=>displayJobName(j.jobName)).sort(naturalCompare).join(', ')
}
function joinSelectedCasStr(){
  return Array.from(selectedCas).slice().map(displayCasName).sort(naturalCompare).join(', ')
}
function joinSelectedRecipesStr(){
  return allRecipes.value.filter(r=>selectedRecipes.has(r.id)).map(r=>displayRecipeName(r.name, r.sourceKind ?? activeRecipeSourceKind.value)).sort(naturalCompare).join(', ')
}
/** cas -> jobs */
function applyCasToJobsFromSelection(){
  const jobSet = new Set<string>()
  for(const cas of selectedCas){
    const ids = casToJobs.value[cas] ?? []
    for(const id of ids){
      if(jobsData.value.find(j=>j.id===id)) jobSet.add(id)
    }
  }

  selectedJobs.clear()
  if(jobSet.size===0){
    selectedJobs.add(JOB_NONE_ID)
    lastJob.value = JOB_NONE_ID
    jobAnchorIdx.value = jobDisplayItems.value.findIndex(j => j.id === JOB_NONE_ID)
    jobCursorIdx.value = jobAnchorIdx.value
    setJobQueryProgram(NONE_LABEL)
    return
  }

  const ids = Array.from(jobSet)
  for(const id of ids) selectedJobs.add(id)
  lastJob.value = ids[0]
  jobAnchorIdx.value = jobDisplayItems.value.findIndex(j => j.id === ids[0])
  jobCursorIdx.value = jobAnchorIdx.value
  setJobQueryProgram(joinSelectedJobsStr())
  void scrollIntoView(jobRefs, ids[0])

  if (ids.length === 1) {
    void fetchJobContent(ids[0])
  }
}

/** range selection */
function selectRangeString(set:Set<string>, list:string[], a:number, b:number){
  set.clear()
  const lo=Math.min(a,b), hi=Math.max(a,b)
  for(let i=lo;i<=hi;i++) set.add(list[i])
}
function selectRangeJob(set:Set<string>, list:JobItem[], a:number, b:number){
  set.clear()
  const lo=Math.min(a,b), hi=Math.max(a,b)
  for(let i=lo;i<=hi;i++) set.add(list[i].id)
}
function selectRangeRecipe(set:Set<string>, list:RecipeDetail[], a:number, b:number){
  set.clear()
  const lo=Math.min(a,b), hi=Math.max(a,b)
  for(let i=lo;i<=hi;i++) set.add(list[i].id)
}

function getVisibleIndex(
  ids: string[],
  selectedSet: Set<string>,
  lastId: string,
  cursorIdx: number | null
) {
  if (cursorIdx !== null && cursorIdx >= 0 && cursorIdx < ids.length) return cursorIdx

  const selectedIdx = ids.findIndex(id => selectedSet.has(id))
  if (selectedIdx >= 0) return selectedIdx

  const lastIdx = ids.indexOf(lastId)
  if (lastIdx >= 0) return lastIdx

  return 0
}

/** clicks */
function doSelectCas(casId:string, e:MouseEvent){
  const list = casDisplayItems.value.map(x => x.name)
  const idx = list.indexOf(casId)
  const ctrl = e.ctrlKey || e.metaKey
  const shift = e.shiftKey

  if(shift && casAnchorIdx.value!==null){
    selectRangeString(selectedCas, list, casAnchorIdx.value, idx)
  } else if(ctrl){
    if(selectedCas.has(casId)) selectedCas.delete(casId)
    else selectedCas.add(casId)
    casAnchorIdx.value=idx
  } else {
    selectedCas.clear()
    selectedCas.add(casId)
    casAnchorIdx.value=idx
  }

  casCursorIdx.value = idx
  setCasQueryProgram(selectedCas.size===1 ? displayCasName(Array.from(selectedCas)[0]) : joinSelectedCasStr())
  casState.value = 'ok'
  casHint.value = ''
  scrollIntoView(casRefs, casId)
  applyCasToJobsFromSelection()

  if (selectedCas.size === 1) {
    activePane.value = 'casContent'
    void fetchCasContent(Array.from(selectedCas)[0])
  }
}

function onCasClick(casId:string, e:MouseEvent){
  activateArea('casList', 'cas')
  lastCas.value=casId

  if (casId === CAS_NONE_ID) {
    selectedCas.clear()
    selectedCas.add(CAS_NONE_ID)
    casCursorIdx.value = casDisplayItems.value.findIndex(x => x.name === CAS_NONE_ID)
    casAnchorIdx.value = casCursorIdx.value
    setCasQueryProgram(NONE_LABEL)
    casState.value = 'ok'
    casHint.value = ''
    selectedJobs.clear()
    selectedJobs.add(JOB_NONE_ID)
    setJobQueryProgram(NONE_LABEL)
    jobCursorIdx.value = jobDisplayItems.value.findIndex(j => j.id === JOB_NONE_ID)
    jobAnchorIdx.value = jobCursorIdx.value
    activePane.value = 'casList'
    return
  }

  if(casEditMode.value){
    const prevCasId = casSelectedSingle.value
    if(prevCasId && casDirty(prevCasId)){
      openConfirm({
        title:'Warning',
        tone:'warn',
        message:'Cas Edit을 종료하시겠습니까? 종료한다면 변경내용은 저장되지 않습니다.',
        onYes:()=>{
          revertCas(prevCasId)
          casEditMode.value=false
          clearCasCellSelection()
          doSelectCas(casId, e)
        },
        onNo:()=>{}
      })
      return
    }
    casEditMode.value=false
    clearCasCellSelection()
  }

  doSelectCas(casId, e)
}

function doSelectJob(jobId:string, e:MouseEvent){
  const list = jobDisplayItems.value
  const idx = list.findIndex(j=>j.id===jobId)
  const ctrl = e.ctrlKey || e.metaKey
  const shift = e.shiftKey

  if(shift && jobAnchorIdx.value!==null){
    selectRangeJob(selectedJobs, list, jobAnchorIdx.value, idx)
  } else if(ctrl){
    if(selectedJobs.has(jobId)) selectedJobs.delete(jobId)
    else selectedJobs.add(jobId)
    jobAnchorIdx.value=idx
  } else {
    selectedJobs.clear()
    selectedJobs.add(jobId)
    jobAnchorIdx.value=idx
  }

  jobCursorIdx.value = idx

  setJobQueryProgram(
    selectedJobs.size===1
      ? (displayJobName(list.find(j=>j.id===Array.from(selectedJobs)[0])?.jobName ?? ''))
      : jobsData.value
          .filter(j => selectedJobs.has(j.id))
          .map(j => displayJobName(j.jobName))
          .sort(naturalCompare)
          .join(', ')
  )

  jobState.value = 'ok'
  jobHint.value = ''

  scrollIntoView(jobRefs, jobId)

  if (selectedJobs.size === 1) {
    activePane.value = 'jobList'
    void fetchJobContent(Array.from(selectedJobs)[0])
  }
}

function onJobClick(jobId:string, e:MouseEvent){
  activateArea('jobList', 'job')
  lastJob.value=jobId

  if (jobId === JOB_NONE_ID) {
    selectedJobs.clear()
    selectedJobs.add(JOB_NONE_ID)
    const noneIdx = jobDisplayItems.value.findIndex(j => j.id === JOB_NONE_ID)
    jobCursorIdx.value = noneIdx
    jobAnchorIdx.value = noneIdx
    setJobQueryProgram(NONE_LABEL)
    jobState.value = 'ok'
    jobHint.value = ''
    activePane.value = 'jobList'
    return
  }

  const list = jobDisplayItems.value
  const idx = list.findIndex(j=>j.id===jobId)
  const ctrl = e.ctrlKey || e.metaKey
  const shift = e.shiftKey

  if(casEditMode.value && selectedSlotCells.size>0){
    selectedJobs.clear()
    selectedJobs.add(jobId)
    setJobQueryProgram(displayJobName(list.find(j=>j.id===jobId)?.jobName ?? ''))
    applyJobToSelectedSlots(jobId)
    scrollIntoView(jobRefs, jobId)
    jobListAttention.value = false
    return
  }

  if(jobEditMode.value){
    const prevJobId = selectedJobSingleReal.value?.id
    if(prevJobId && jobDirty(prevJobId)){
      openConfirm({
        title:'Warning',
        tone:'warn',
        message:'Job Edit을 종료하시겠습니까? 종료한다면 변경내용은 저장되지 않습니다.',
        onYes:()=>{
          revertJob(prevJobId)
          jobEditMode.value=false
          doSelectJob(jobId, e)
        },
        onNo:()=>{}
      })
      return
    }
    jobEditMode.value=false
  }

  doSelectJob(jobId, e)
}

function onRecipePick(recipeId:string, e:MouseEvent){
  activateArea('recipeArea', 'recipe')
  lastRecipe.value=recipeId

  const list = allRecipes.value
  const idx = list.findIndex(r=>r.id===recipeId)
  const ctrl = e.ctrlKey || e.metaKey
  const shift = e.shiftKey

  if(shift && recipeAnchorIdx.value!==null){
    selectRangeRecipe(selectedRecipes, list, recipeAnchorIdx.value, idx)
  } else if(ctrl){
    if(selectedRecipes.has(recipeId)) selectedRecipes.delete(recipeId)
    else selectedRecipes.add(recipeId)
    if(selectedRecipes.size===0) selectedRecipes.add('R_NONE')
    recipeAnchorIdx.value=idx
  } else {
    selectedRecipes.clear()
    selectedRecipes.add(recipeId)
    recipeAnchorIdx.value=idx
  }

  recipeCursorIdx.value = idx

  setRecipeFindProgram(selectedRecipes.size===1
    ? displayRecipeName(list.find(r=>r.id===Array.from(selectedRecipes)[0])?.name ?? '', list.find(r=>r.id===Array.from(selectedRecipes)[0])?.sourceKind ?? activeRecipeSourceKind.value)
    : joinSelectedRecipesStr())

  scrollIntoView(recipeRefs, recipeId)
  void ensureRecipeDetailById(recipeId)
}

/** search actions */
function applyCasSearch(_byButton:boolean){
  const raw = casQuery.value
  const q = normalizeSearchValue(raw)
  const list = casDisplayItems.value
  if(!q || !list.length) return

  const matches = list.filter(x => normalizeSearchValue(displayCasName(x.name)).includes(q))
  if(!matches.length){
    casState.value = 'bad'
    casHint.value = '검색 결과 없음'
    return
  }

  const best = matches.find(x => normalizeSearchValue(displayCasName(x.name)) === q) ?? matches[0]
  selectedCas.clear()
  selectedCas.add(best.name)
  lastCas.value = best.name
  activateArea('casList', 'cas')
  casAnchorIdx.value = casDisplayItems.value.findIndex(x => x.name === best.name)
  casCursorIdx.value = casAnchorIdx.value
  scrollIntoView(casRefs, best.name)

  casState.value = 'ok'
  casHint.value = ''

  applyCasToJobsFromSelection()
  if (best.name !== CAS_NONE_ID) {
    void fetchCasContent(best.name)
  }
}

function applyJobSearch(_byButton:boolean){
  const raw = jobQuery.value
  const q = normalizeSearchValue(raw)
  const list = jobDisplayItems.value
  if(!q || !list.length) return

  const matches = list.filter(j => normalizeSearchValue(displayJobName(j.jobName)).includes(q))
  if(!matches.length){
    jobState.value = 'bad'
    jobHint.value = '검색 결과 없음'
    return
  }

  const best = matches.find(j => normalizeSearchValue(displayJobName(j.jobName)) === q) ?? matches[0]
  selectedJobs.clear()
  selectedJobs.add(best.id)
  lastJob.value = best.id
  activateArea('jobList', 'job')
  jobAnchorIdx.value = jobDisplayItems.value.findIndex(j=>j.id===best.id)
  jobCursorIdx.value = jobAnchorIdx.value
  scrollIntoView(jobRefs, best.id)

  jobState.value = 'ok'
  jobHint.value = ''

  if (best.id !== JOB_NONE_ID) {
    void fetchJobContent(best.id)
  }
}

function applyRecipeFind(_byButton:boolean){
  const raw = recipeFind.value
  const q = normalizeSearchValue(raw)
  const list = allRecipes.value
  if(!q || !list.length) return

  const matches = list.filter(r => normalizeSearchValue(displayRecipeName(r.name, r.sourceKind ?? activeRecipeSourceKind.value)).includes(q))
  if(!matches.length){
    recipeFindState.value = 'bad'
    return
  }

  const best = matches.find(r => normalizeSearchValue(displayRecipeName(r.name, r.sourceKind ?? activeRecipeSourceKind.value)) === q) ?? matches[0]
  selectedRecipes.clear()
  selectedRecipes.add(best.id)
  lastRecipe.value=best.id
  activateArea('recipeArea', 'recipe')
  recipeCursorIdx.value = allRecipes.value.findIndex(r => r.id === best.id)
  scrollIntoView(recipeRefs, best.id)
  void ensureRecipeDetailById(best.id)

  recipeFindState.value = 'ok'
  if (normalizeSearchValue(displayRecipeName(best.name, best.sourceKind ?? activeRecipeSourceKind.value)) === q) {
    setRecipeFindProgram(displayRecipeName(best.name, best.sourceKind ?? activeRecipeSourceKind.value))
  }
}

/** debounce */
let tCas:any=null
let tJob:any=null
let tRec:any=null
let tRecipePicker:any=null

watch(casQuery, ()=>{
  if(skipCasWatch){ skipCasWatch = false; return }
  if(casProgram.value) return
  if(hasComma(casQuery.value)) return
  clearTimeout(tCas)
  if(!casQuery.value.trim()){
    casState.value = 'idle'
    casHint.value = ''
    return
  }
  tCas=setTimeout(()=>applyCasSearch(false),160)
})
watch(jobQuery, ()=>{
  if(skipJobWatch){ skipJobWatch = false; return }
  if(jobProgram.value) return
  if(hasComma(jobQuery.value)) return
  clearTimeout(tJob)
  if(!jobQuery.value.trim()){
    jobState.value = 'idle'
    jobHint.value = ''
    return
  }
  tJob=setTimeout(()=>applyJobSearch(false),160)
})
watch(recipeFind, ()=>{
  if(skipRecipeWatch){ skipRecipeWatch = false; return }
  if(recipeProgram.value) return
  if(hasComma(recipeFind.value)) return
  clearTimeout(tRec)
  if(!recipeFind.value.trim()){
    recipeFindState.value = 'idle'
    return
  }
  tRec=setTimeout(()=>applyRecipeFind(false),160)
})

/** job edit actions */
function jobContentEnterEdit(){
  const jobId = selectedJobSingleReal.value?.id
  if(!jobId) return
  snapshotJobBaseline(jobId)
  jobEditMode.value=true
  activateArea('jobContent', 'job')
}
function jobSaveClicked(){
  const jobId = selectedJobSingleReal.value?.id
  const job = selectedJobSingleReal.value
  if(!jobId || !job || !jobEditMode.value) return
  if(jobDirty(jobId)){
    openConfirm({
      title:'Confirm',
      tone:'default',
      message:'기존 Job Edit 내용과 차이가 있습니다. 저장하시겠습니까?',
      onYes: async () => {
        try {
          await recipeTestApi.persistJob(eqpId.value, jobId, job.jobName, deepClone(jobParsedMap[jobId] ?? {}), getActorName(), getActorTeam())
          jobBaseline[jobId]=JSON.stringify(jobParsedMap[jobId]??{})
          jobEditMode.value=false
        } catch (err) {
          window.alert(`JOB 저장 실패: ${getErrorMessage(err)}`)
        }
      },
      onNo:()=>{ revertJob(jobId); jobEditMode.value=false },
    })
  } else {
    jobEditMode.value=false
  }
}
function jobCancelRequested(){
  const jobId = selectedJobSingleReal.value?.id
  if(!jobId) return
  if(jobDirty(jobId)){
    openConfirm({
      title:'Warning',
      tone:'warn',
      message:'Job Edit을 종료하시겠습니까? 종료한다면 변경내용은 저장되지 않습니다.',
      onYes:()=>{ revertJob(jobId); jobEditMode.value=false },
      onNo:()=>{}
    })
  } else {
    jobEditMode.value=false
  }
}

function animateCartFly(label: string, startX: number, startY: number) {
  const anchor = cartAnchorEl.value?.getBoundingClientRect()
  if (!anchor) return
  const id = Date.now() + Math.floor(Math.random() * 1000)
  cartFlyTokens.value = [...cartFlyTokens.value, {
    id,
    label,
    x: startX,
    y: startY,
    tx: startX,
    ty: startY,
  }]
  requestAnimationFrame(() => {
    cartFlyTokens.value = cartFlyTokens.value.map(token =>
      token.id === id
        ? { ...token, tx: anchor.left + anchor.width / 2, ty: anchor.top + anchor.height / 2 }
        : token
    )
  })
  window.setTimeout(() => {
    cartFlyTokens.value = cartFlyTokens.value.filter(token => token.id !== id)
  }, 720)
}

function clearCart() {
  cartItems.value = []
  selectedCartTargetEqpIdsSet.clear()
}

function removeCartItem(key: string) {
  cartItems.value = cartItems.value.filter(item => item.key !== key)
  if (!cartItems.value.length) selectedCartTargetEqpIdsSet.clear()
}

function setCartTargetEqpIds(targetEqpIds: string[]) {
  selectedCartTargetEqpIdsSet.clear()
  for (const id of targetEqpIds) {
    if (id) selectedCartTargetEqpIdsSet.add(id)
  }
}

function pushCartItem(kind: CartKind, name: string, sourceKind?: RecipeSourceKind, event?: MouseEvent) {
  const meta = currentEqpMeta.value
  if (!meta) {
    window.alert('현재 설비 메타 정보를 찾을 수 없습니다.')
    return
  }

  if (cartItems.value.length) {
    if (cartMaker.value && meta.maker !== cartMaker.value) {
      window.alert('기존 Cart와 다른 Maker 설비의 Content입니다. Cart를 비운 후 다시 담아주세요.')
      return
    }
    if (cartModelGroup.value && meta.modelGroup !== cartModelGroup.value) {
      window.alert('기존 Cart와 다른 설비군(model_group)입니다. Cart를 비운 후 다시 담아주세요.')
      return
    }
  }

  const key = `${kind}:${meta.eqpId}:${sourceKind ?? ''}:${name}`
  if (cartItems.value.find(item => item.key === key)) return

  cartItems.value = [...cartItems.value, {
    key,
    kind,
    name,
    sourceEqpId: meta.eqpId,
    sourceKind,
    maker: meta.maker ?? '',
    modelGroup: meta.modelGroup ?? '',
  }]

  if (event) animateCartFly(name, event.clientX, event.clientY)
  cartShakeToken.value += 1
}


function addSelectedCasToCart(event?: MouseEvent) {
  Array.from(selectedCas)
    .filter(id => id && id !== CAS_NONE_ID)
    .forEach(id => pushCartItem('cas', id, undefined, event))
}

function addSelectedJobsToCart(event?: MouseEvent) {
  jobDisplayItems.value
    .filter(item => selectedJobs.has(item.id) && item.id !== JOB_NONE_ID)
    .forEach(item => pushCartItem('job', item.jobName, undefined, event))
}

function addSelectedRecipesToCart(event?: MouseEvent) {
  allRecipes.value
    .filter(item => selectedRecipes.has(item.id) && item.id !== 'R_NONE')
    .forEach(item => pushCartItem('recipe', item.name, item.sourceKind ?? activeRecipeSourceKind.value, event))
}
async function moveCartItems() {
  if (!cartItems.value.length) {
    window.alert('Cart가 비어 있습니다.')
    return
  }
  if (!selectedCartTargetEqpIds.value.length) {
    window.alert('Move To 설비를 선택하세요.')
    return
  }

  cartMoving.value = true
  try {
    const res = await recipeTestApi.transferFiles({
      items: cartItems.value.map(item => ({
        kind: item.kind,
        name: item.name,
        sourceEqpId: item.sourceEqpId,
        sourceKind: item.sourceKind,
      })),
      targetEqpIds: selectedCartTargetEqpIds.value,
      actorName: getActorName(),
      actorTeam: getActorTeam(),
    })

    const movedCount = Array.isArray(res.moved) ? res.moved.length : 0
    const failed = Array.isArray(res.failed) ? res.failed : []
    const failedMessage = failed.length
      ? `\n실패 ${failed.length}건\n` + failed.map(x => `- ${x.targetEqpId}: ${x.name} (${x.reason})`).join('\n')
      : ''

    void loadHistory()
    window.alert(`Transfer 완료: ${movedCount}건${failedMessage}`)
    if (!failed.length) {
      clearCart()
      cartOpen.value = false
    }
  } catch (err) {
    window.alert(`Transfer 실패: ${getErrorMessage(err)}`)
  } finally {
    cartMoving.value = false
  }
}

function selectSingleCasForContext(casId: string) {
  selectedCas.clear()
  selectedCas.add(casId)
  lastCas.value = casId
  casAnchorIdx.value = casDisplayItems.value.findIndex(x => x.name === casId)
  casCursorIdx.value = casAnchorIdx.value
  setCasQueryProgram(displayCasName(casId))
  casState.value = 'ok'
  casHint.value = ''
  activateArea('casList', 'cas')
  applyCasToJobsFromSelection()
  if (casId !== CAS_NONE_ID) void fetchCasContent(casId)
}

function selectSingleJobForContext(jobId: string) {
  selectedJobs.clear()
  selectedJobs.add(jobId)
  lastJob.value = jobId
  jobAnchorIdx.value = jobDisplayItems.value.findIndex(x => x.id === jobId)
  jobCursorIdx.value = jobAnchorIdx.value
  const job = jobDisplayItems.value.find(x => x.id === jobId)
  setJobQueryProgram(displayJobName(job?.jobName ?? ''))
  jobState.value = 'ok'
  jobHint.value = ''
  activateArea('jobList', 'job')
  if (jobId !== JOB_NONE_ID) void fetchJobContent(jobId)
}

function selectSingleRecipeForContext(recipeId: string) {
  selectedRecipes.clear()
  selectedRecipes.add(recipeId)
  lastRecipe.value = recipeId
  recipeAnchorIdx.value = allRecipes.value.findIndex(x => x.id === recipeId)
  recipeCursorIdx.value = recipeAnchorIdx.value
  const recipe = allRecipes.value.find(x => x.id === recipeId)
  setRecipeFindProgram(displayRecipeName(recipe?.name ?? '', recipe?.sourceKind ?? activeRecipeSourceKind.value))
  recipeFindState.value = 'ok'
  activateArea('recipeArea', 'recipe')
  if (recipeId !== 'R_NONE') void ensureRecipeDetailById(recipeId)
}

function onCasListItemContextMenu(payload: { id: string; event: MouseEvent }) {
  if (!selectedCas.has(payload.id)) {
    selectSingleCasForContext(payload.id)
  } else {
    lastCas.value = payload.id
    casCursorIdx.value = casDisplayItems.value.findIndex(x => x.name === payload.id)
    activateArea('casList', 'cas')
  }
  openListMenu('cas', payload.event)
}

function onJobListItemContextMenu(payload: { id: string; event: MouseEvent }) {
  if (!selectedJobs.has(payload.id)) {
    selectSingleJobForContext(payload.id)
  } else {
    lastJob.value = payload.id
    jobCursorIdx.value = jobDisplayItems.value.findIndex(x => x.id === payload.id)
    activateArea('jobList', 'job')
  }
  openListMenu('job', payload.event)
}

function onRecipeListItemContextMenu(payload: { recipeId: string; event: MouseEvent }) {
  if (!selectedRecipes.has(payload.recipeId)) {
    selectSingleRecipeForContext(payload.recipeId)
  } else {
    lastRecipe.value = payload.recipeId
    recipeCursorIdx.value = allRecipes.value.findIndex(x => x.id === payload.recipeId)
    activateArea('recipeArea', 'recipe')
  }
  openListMenu('recipe', payload.event)
}

/** context menu */
type MenuItem = { label:string; action:()=>void }
const ctxMenu = reactive<{ open:boolean; x:number; y:number; items:MenuItem[] }>({ open:false, x:0, y:0, items:[] })

async function casListEnterEdit(){
  const casId = casSelectedSingle.value
  if(!casId) return
  if(!casTableMap[casId]){
    try { await fetchCasContent(casId) } catch {}
  }
  activateArea('casContent', 'cas')
  casContentEnterEdit()
}

async function jobListEnterEdit(){
  const jobId = selectedJobSingleReal.value?.id || previewJobId.value
  if(!jobId || jobId === JOB_NONE_ID) return
  if(!jobParsedMap[jobId]){
    try { await fetchJobContent(jobId) } catch {}
  }
  activateArea('jobContent', 'job')
  jobContentEnterEdit()
}

function openListMenu(kind:'cas'|'job'|'recipe', e:MouseEvent){
  ctxMenu.open=true
  ctxMenu.x=e.clientX
  ctxMenu.y=e.clientY
  const items: MenuItem[] = []

  if(kind==='cas'){
    const multi = Array.from(selectedCas).length > 1
    const singleEditable = !multi && !!casSelectedSingle.value
    items.push({ label:'Add to Cart', action:()=>{ ctxMenu.open=false; addSelectedCasToCart(e) } })
    if(multi){
      items.push({ label:'Delete', action:()=>{ ctxMenu.open=false; casListDelete() } })
    } else {
      if(singleEditable){
        items.push({ label:'Edit', action:()=>{ ctxMenu.open=false; void casListEnterEdit() } })
      }
      items.push({ label:'Rename', action:()=>{ ctxMenu.open=false; casListEditRename() } })
      items.push({ label:'Save As', action:()=>{ ctxMenu.open=false; casListSaveAs() } })
      items.push({ label:'Delete', action:()=>{ ctxMenu.open=false; casListDelete() } })
    }
  }

  if(kind==='job'){
    const multi = Array.from(selectedJobs).length > 1
    const singleEditable = !multi && !!selectedJobSingleReal.value
    items.push({ label:'Add to Cart', action:()=>{ ctxMenu.open=false; addSelectedJobsToCart(e) } })
    if(multi){
      items.push({ label:'Delete', action:()=>{ ctxMenu.open=false; jobListDelete() } })
    } else {
      if(singleEditable){
        items.push({ label:'Edit', action:()=>{ ctxMenu.open=false; void jobListEnterEdit() } })
      }
      items.push({ label:'Rename', action:()=>{ ctxMenu.open=false; jobListEditRename() } })
      items.push({ label:'Save As', action:()=>{ ctxMenu.open=false; jobListSaveAs() } })
      items.push({ label:'Delete', action:()=>{ ctxMenu.open=false; jobListDelete() } })
    }
  }

  if(kind==='recipe'){
    const multi = Array.from(selectedRecipes).filter(x=>x!=='R_NONE').length > 1
    items.push({ label:'Add to Cart', action:()=>{ ctxMenu.open=false; addSelectedRecipesToCart(e) } })
    if(multi){
      items.push({ label:'Delete', action:()=>{ ctxMenu.open=false; recipeListDelete() } })
    } else {
      items.push({ label:'Rename', action:()=>{ ctxMenu.open=false; recipeListEditRename() } })
      items.push({ label:'Save As', action:()=>{ ctxMenu.open=false; recipeListSaveAs() } })
      items.push({ label:'Delete', action:()=>{ ctxMenu.open=false; recipeListDelete() } })
    }
  }

  ctxMenu.items = items
}

function openContentMenu(kind:'casContent'|'jobContent', e:MouseEvent){
  ctxMenu.open=true
  ctxMenu.x=e.clientX
  ctxMenu.y=e.clientY

  if(kind==='casContent'){
    ctxMenu.items=[
      { label:'Add to Cart', action:()=>{ ctxMenu.open=false; addSelectedCasToCart(e) } },
      casEditMode.value
        ? { label:'Edit Cancel', action:()=>{ ctxMenu.open=false; casCancelRequested() } }
        : { label:'Edit', action:()=>{ ctxMenu.open=false; casContentEnterEdit() } },
      { label:'Save As', action:()=>{ ctxMenu.open=false; casContentSaveAs() } },
    ]
  } else {
    ctxMenu.items=[
      { label:'Add to Cart', action:()=>{ ctxMenu.open=false; addSelectedJobsToCart(e) } },
      jobEditMode.value
        ? { label:'Edit Cancel', action:()=>{ ctxMenu.open=false; jobCancelRequested() } }
        : { label:'Edit', action:()=>{ ctxMenu.open=false; jobContentEnterEdit() } },
      { label:'Save As', action:()=>{ ctxMenu.open=false; jobContentSaveAs() } },
    ]
  }
}

/** confirm */
const confirmModal = reactive<{
  open:boolean
  title:string
  tone:ConfirmTone
  message:string
  onYes:(()=>void)|null
  onNo:(()=>void)|null
}>({
  open:false,
  title:'Confirm',
  tone:'default',
  message:'',
  onYes:null,
  onNo:null
})
function openConfirm(p:{ title:string; tone:ConfirmTone; message:string; onYes:()=>void; onNo:()=>void }){
  confirmModal.open=true
  confirmModal.title=p.title
  confirmModal.tone=p.tone
  confirmModal.message=p.message
  confirmModal.onYes=p.onYes
  confirmModal.onNo=p.onNo
}
function confirmYes(){
  const fn=confirmModal.onYes
  confirmModal.open=false
  confirmModal.onYes=null
  confirmModal.onNo=null
  fn?.()
}
function confirmNo(){
  const fn=confirmModal.onNo
  confirmModal.open=false
  confirmModal.onYes=null
  confirmModal.onNo=null
  fn?.()
}

/** file ops actions */
function makeRecipeIdByName(name: string, sourceKind: RecipeSourceKind = activeRecipeSourceKind.value) {
  return sourceKind === 'recipe'
    ? `RCP::${name}`
    : `RCP_SRC::${sourceKind}::${name}`
}

function syncRecipeCacheAfterRename(sourceKind: RecipeSourceKind, oldId: string, newId: string, newName: string) {
  recipesData.value = recipesData.value.map(r =>
    r.id === oldId ? { ...r, id: newId, name: newName, sourceKind } : r
  )

  const cached = recipeSourceCache[sourceKind]
  if (cached?.length) {
    recipeSourceCache[sourceKind] = cached.map(r =>
      r.id === oldId ? { ...r, id: newId, name: newName, sourceKind } : r
    )
  }
  sortRecipesData()
}

function syncRecipeCacheAfterDelete(deletedIds: string[], sourceKindMap: Record<string, RecipeSourceKind>) {
  recipesData.value = recipesData.value.filter(r => !deletedIds.includes(r.id))
  for (const [id, sourceKind] of Object.entries(sourceKindMap)) {
    const cached = recipeSourceCache[sourceKind]
    if (cached?.length) {
      recipeSourceCache[sourceKind] = cached.filter(r => r.id !== id)
    }
  }
  sortRecipesData()
}

async function casListEditRename(){
  if(selectedCas.size!==1) return
  const casId = Array.from(selectedCas)[0]
  if (!casId || casId === CAS_NONE_ID) return

  const newNameRaw = await openAsciiNamePrompt('Rename CAS', displayCasName(casId), 'New CAS name')
  const newName = newNameRaw?.trim()
  if(!newName || newName===displayCasName(casId)) return

  try {
    const res = await recipeTestApi.renameFile({
      eqpId: eqpId.value,
      kind: 'cas',
      sourceName: casId,
      targetName: newName,
    })
    const newFullName = res.name

    casData.value = casData.value.map(x => x.name === casId ? { ...x, name: newFullName } : x)

    casToJobs.value[newFullName] = casToJobs.value[casId] ? [...casToJobs.value[casId]] : []
    delete casToJobs.value[casId]

    if (casTableMap[casId]) {
      casTableMap[newFullName] = casTableMap[casId]
      delete casTableMap[casId]
    }
    if (casBaseline[casId]) {
      casBaseline[newFullName] = casBaseline[casId]
      delete casBaseline[casId]
    }

    sortCasData()
    selectedCas.clear()
    selectedCas.add(newFullName)
    lastCas.value = newFullName
    setCasQueryProgram(displayCasName(newFullName))
    await scrollIntoView(casRefs, newFullName)
  } catch (err) {
    window.alert(`CAS Rename 실패: ${getErrorMessage(err)}`)
  }
}

async function casListSaveAs(){
  if(selectedCas.size!==1) return
  const casId = Array.from(selectedCas)[0]
  const src = casData.value.find(x => x.name === casId)
  if (!src) return

  const newIdRaw = await openAsciiNamePrompt('Save As - New CAS ID', `${displayCasName(casId)}_COPY`, 'New CAS ID')
  const newId = newIdRaw?.trim()
  if(!newId) return

  const ext = src.name.toLowerCase().endsWith('.cas') ? '.cas' : ''
  const newFull = `${newId}${ext}`
  const slots = JSON.parse(JSON.stringify(casTableMap[casId] ?? []))

  try {
    await recipeTestApi.persistCas(eqpId.value, casId, newFull, slots, getActorName(), getActorTeam())
  } catch (err) {
    window.alert(`CAS Save As 실패: ${getErrorMessage(err)}`)
    return
  }

  casData.value = [...casData.value, { ...src, name: newFull }]
  casToJobs.value[newFull]=[...(casToJobs.value[casId]??[])]
  casTableMap[newFull]=slots
  casBaseline[newFull]=JSON.stringify(casTableMap[newFull]??[])
  sortCasData()

  selectedCas.clear()
  selectedCas.add(newFull)
  lastCas.value=newFull
  setCasQueryProgram(displayCasName(newFull))
  await scrollIntoView(casRefs, newFull)
}
function casListDelete(){
  const ids = Array.from(selectedCas).filter(id => id && id !== CAS_NONE_ID)
  if(ids.length===0) return

  openConfirm({
    title:'Confirm',
    tone:'default',
    message:'정말 삭제하시겠습니까?',
    onYes: async ()=>{
      try {
        const res = await recipeTestApi.deleteFiles(
          eqpId.value,
          ids.map(name => ({ kind: 'cas', name }))
        )
        const deletedNames = (res.deleted ?? []).map(x => x.name)
        for (const id of deletedNames) {
          casData.value = casData.value.filter(x => x.name !== id)
          delete casToJobs.value[id]
          delete casTableMap[id]
          delete casBaseline[id]
        }
        sortCasData()
        resetCasSelectionOnly()
        applyCasToJobsFromSelection()

        if (res.failed?.length) {
          window.alert(`CAS 삭제 부분 실패\n${res.failed.map(x => `- ${x.name}: ${x.reason}`).join('\n')}`)
        }
      } catch (err) {
        window.alert(`CAS 삭제 실패: ${getErrorMessage(err)}`)
      }
    },
    onNo:()=>{}
  })
}

/** cas content actions */
function casContentEnterEdit(){
  const casId = casSelectedSingle.value
  if(!casId) return
  snapshotCasBaseline(casId)
  casEditMode.value=true
  clearCasCellSelection()
  activateArea('casContent', 'cas')
}
function casSaveClicked(){
  const casId = casSelectedSingle.value
  if(!casId) return
  if(!casEditMode.value) return

  if(casDirty(casId)){
    openConfirm({
      title:'Confirm',
      tone:'default',
      message:'기존 Cas Content와 차이가 있습니다. 이대로 저장하시겠습니까?',
      onYes: async () => {
        try {
          await recipeTestApi.persistCas(eqpId.value, casId, casId, casTableMap[casId] ?? [], getActorName(), getActorTeam())
          casBaseline[casId]=JSON.stringify(casTableMap[casId]??[])
          casEditMode.value=false
          clearCasCellSelection()
        } catch (err) {
          window.alert(`CAS 저장 실패: ${getErrorMessage(err)}`)
        }
      },
      onNo:()=>{ revertCas(casId); casEditMode.value=false; clearCasCellSelection() },
    })
  } else {
    casEditMode.value=false
    clearCasCellSelection()
  }
}
function casCancelRequested(){
  const casId = casSelectedSingle.value
  if(!casId) return
  if(casDirty(casId)){
    openConfirm({
      title:'Warning',
      tone:'warn',
      message:'Cas Edit을 종료하시겠습니까? 종료한다면 변경내용은 저장되지 않습니다.',
      onYes:()=>{ revertCas(casId); casEditMode.value=false; clearCasCellSelection() },
      onNo:()=>{}
    })
  } else {
    casEditMode.value=false
    clearCasCellSelection()
  }
}
async function casContentSaveAs(){
  const casId = casSelectedSingle.value
  if(!casId) return

  const src = casData.value.find(x => x.name === casId)
  if (!src) return

  const newIdRaw = await openAsciiNamePrompt('Save As - New CAS ID', `${displayCasName(casId)}_COPY`, 'New CAS ID')
  const newId = newIdRaw?.trim()
  if(!newId) return

  const ext = src.name.toLowerCase().endsWith('.cas') ? '.cas' : ''
  const newFull = `${newId}${ext}`
  const slots = JSON.parse(JSON.stringify(casTableMap[casId] ?? []))

  try {
    await recipeTestApi.persistCas(eqpId.value, casId, newFull, slots, getActorName(), getActorTeam())
  } catch (err) {
    window.alert(`CAS Save As 실패: ${getErrorMessage(err)}`)
    return
  }

  casData.value = [...casData.value, { ...src, name: newFull }]
  casToJobs.value[newFull]=[...(casToJobs.value[casId]??[])]
  casTableMap[newFull]=slots
  casBaseline[newFull]=JSON.stringify(casTableMap[newFull]??[])
  sortCasData()

  selectedCas.clear()
  selectedCas.add(newFull)
  lastCas.value=newFull
  setCasQueryProgram(displayCasName(newFull))
  await scrollIntoView(casRefs, newFull)
}

/** job list actions */
async function jobListEditRename(){
  if(selectedJobs.size!==1) return
  const oldJobId = Array.from(selectedJobs)[0]
  if (!oldJobId || oldJobId === JOB_NONE_ID) return

  const job = jobsData.value.find(j=>j.id===oldJobId)
  if(!job) return

  const newNameRaw = await openAsciiNamePrompt('Rename JOB', displayJobName(job.jobName), 'New JOB name')
  const newName = newNameRaw?.trim()
  if(!newName || newName===displayJobName(job.jobName)) return

  try {
    const res = await recipeTestApi.renameFile({
      eqpId: eqpId.value,
      kind: 'job',
      sourceName: job.jobName,
      targetName: newName,
      actorName: getActorName(),
      actorTeam: getActorTeam(),
    })
    void loadHistory()
    const renamedName = res.name
    const snapshot = captureReloadRestoreSpec({
      jobNames: [renamedName],
      previewJobName: renamedName,
    })
    await reloadAndRestoreSelections(snapshot)
    const restored = jobsData.value.find(j => j.jobName === renamedName)
    if (restored) {
      selectedJobs.clear()
      selectedJobs.add(restored.id)
      lastJob.value = restored.id
      setJobQueryProgram(displayJobName(restored.jobName))
      await fetchJobContent(restored.id)
      await scrollIntoView(jobRefs, restored.id)
    }
  } catch (err) {
    window.alert(`JOB Rename 실패: ${getErrorMessage(err)}`)
  }
}

async function jobListSaveAs(){
  if(selectedJobs.size!==1) return
  const jobId = Array.from(selectedJobs)[0]

  const job = jobsData.value.find(j=>j.id===jobId)
  if(!job) return

  const newNameRaw = await openAsciiNamePrompt('Save As - New JOB Name', `${displayJobName(job.jobName)}_COPY`, 'New JOB Name')
  const newName = newNameRaw?.trim()
  if(!newName) return

  const ext = job.jobName.toLowerCase().endsWith('.job') ? '.job' : ''
  const newJobName = `${newName}${ext}`
  const parsedClone = JSON.parse(JSON.stringify(jobParsedMap[jobId] ?? {}))
  const snapshot = captureReloadRestoreSpec({
    jobNames: [newJobName],
    previewJobName: newJobName,
  })

  try {
    await recipeTestApi.persistJob(eqpId.value, jobId, newJobName, parsedClone, getActorName(), getActorTeam())
    void loadHistory()
    await reloadAndRestoreSelections(snapshot)
    const restored = jobsData.value.find(j => j.jobName === newJobName)
    if (restored) {
      selectedJobs.clear()
      selectedJobs.add(restored.id)
      lastJob.value = restored.id
      setJobQueryProgram(displayJobName(restored.jobName))
      await fetchJobContent(restored.id)
      await scrollIntoView(jobRefs, restored.id)
    }
  } catch (err) {
    window.alert(`JOB Save As 실패: ${getErrorMessage(err)}`)
    return
  }
}

function jobListDelete(){
  const ids = Array.from(selectedJobs).filter(id => id && id !== JOB_NONE_ID)
  if(ids.length===0) return

  openConfirm({
    title:'Confirm',
    tone:'default',
    message:'정말 삭제하시겠습니까?',
    onYes: async ()=>{
      try {
        const items = ids.map(id => {
          const job = jobsData.value.find(j => j.id === id)
          return { kind: 'job' as const, name: job?.jobName ?? id }
        })
        const res = await recipeTestApi.deleteFiles(eqpId.value, items, getActorName(), getActorTeam())
        void loadHistory()
        const deletedNames = (res.deleted ?? []).map(x => x.name)
        const deletedIds = jobsData.value
          .filter(job => deletedNames.includes(job.jobName))
          .map(job => job.id)

        for(const id of deletedIds){
          jobsData.value = jobsData.value.filter(j=>j.id!==id)
          delete jobParsedMap[id]
          delete jobBaseline[id]
          for(const casId of Object.keys(casTableMap)){
            for(const row of casTableMap[casId]){
              if(row.jobId===id){
                row.jobId=''
                row.jobName=NONE_LABEL
                row.recipeName=''
              }
            }
          }
          for (const casId of Object.keys(casToJobs.value)) {
            casToJobs.value[casId] = (casToJobs.value[casId] ?? []).filter(x => x !== id)
          }
        }
        sortJobsData()
        resetJobSelectionOnly()
        if (res.failed?.length) {
          window.alert(`JOB 삭제 부분 실패\n${res.failed.map(x => `- ${x.name}: ${x.reason}`).join('\n')}`)
        }
      } catch (err) {
        window.alert(`JOB 삭제 실패: ${getErrorMessage(err)}`)
      }
    },
    onNo:()=>{}
  })
}

async function jobContentSaveAs(){
  const job = selectedJobSingleReal.value
  if(!job) return

  const newNameRaw = await openAsciiNamePrompt('Save As - New JOB Name', `${displayJobName(job.jobName)}_COPY`, 'New JOB Name')
  const newName = newNameRaw?.trim()
  if(!newName) return

  const ext = job.jobName.toLowerCase().endsWith('.job') ? '.job' : ''
  const newJobName = `${newName}${ext}`
  const parsedClone = JSON.parse(JSON.stringify(jobParsedMap[job.id] ?? {}))
  const snapshot = captureReloadRestoreSpec({
    jobNames: [newJobName],
    previewJobName: newJobName,
  })

  try {
    await recipeTestApi.persistJob(eqpId.value, job.id, newJobName, parsedClone, getActorName(), getActorTeam())
    void loadHistory()
    await reloadAndRestoreSelections(snapshot)
    const restored = jobsData.value.find(j => j.jobName === newJobName)
    if (restored) {
      selectedJobs.clear()
      selectedJobs.add(restored.id)
      lastJob.value = restored.id
      setJobQueryProgram(displayJobName(restored.jobName))
      await fetchJobContent(restored.id)
      await scrollIntoView(jobRefs, restored.id)
    }
  } catch (err) {
    window.alert(`JOB Save As 실패: ${getErrorMessage(err)}`)
    return
  }
}

/** recipe list actions */
async function recipeListEditRename(){
  if(selectedRecipes.size!==1) return
  const oldRecipeId = Array.from(selectedRecipes)[0]
  if(oldRecipeId==='R_NONE') return

  const r = allRecipes.value.find(x=>x.id===oldRecipeId)
  if(!r) return

  const sourceKind = r.sourceKind ?? activeRecipeSourceKind.value
  const newNameRaw = await openAsciiNamePrompt('Rename RECIPE', displayRecipeName(r.name, sourceKind), 'New RECIPE name')
  const newName = newNameRaw?.trim()
  if(!newName || newName===displayRecipeName(r.name, sourceKind)) return

  try {
    const res = await recipeTestApi.renameFile({
      eqpId: eqpId.value,
      kind: 'recipe',
      sourceName: r.name,
      targetName: newName,
      sourceKind,
      actorName: getActorName(),
      actorTeam: getActorTeam(),
    })
    void loadHistory()
    const targetName = res.name
    const newRecipeId = makeRecipeIdByName(targetName, sourceKind)

    syncRecipeCacheAfterRename(sourceKind, oldRecipeId, newRecipeId, targetName)

    selectedRecipes.clear()
    selectedRecipes.add(newRecipeId)
    lastRecipe.value=newRecipeId
    setRecipeFindProgram(displayRecipeName(targetName, sourceKind))
    await scrollIntoView(recipeRefs, newRecipeId)
  } catch (err) {
    window.alert(`RECIPE Rename 실패: ${getErrorMessage(err)}`)
  }
}

async function recipeListSaveAs(){
  if(selectedRecipes.size!==1) return
  const rid = Array.from(selectedRecipes)[0]
  if(rid==='R_NONE') return

  const r = allRecipes.value.find(x=>x.id===rid)
  if(!r) return

  const sourceKind = r.sourceKind ?? activeRecipeSourceKind.value
  const newNameRaw = await openAsciiNamePrompt('Save As - New RECIPE Name', `${displayRecipeName(r.name, sourceKind)}_COPY`, 'New RECIPE Name')
  const newName = newNameRaw?.trim()
  if(!newName) return

  try {
    const res = await recipeTestApi.cloneRecipe(eqpId.value, r.name, newName, sourceKind, getActorName(), getActorTeam())
    void loadHistory()
    const actualName = res.savedAs || newName
    const newId = makeRecipeIdByName(actualName, sourceKind)
    const clone: RecipeDetail = JSON.parse(JSON.stringify(r))
    clone.id = newId
    clone.name = actualName
    clone.sourceKind = sourceKind
    recipesData.value = [...recipesData.value, clone]
    const cached = recipeSourceCache[sourceKind] ?? recipesData.value.filter(item => item.id !== 'R_NONE')
    recipeSourceCache[sourceKind] = [...cached.filter(item => item.id !== rid), r, clone]
    sortRecipesData()

    selectedRecipes.clear()
    selectedRecipes.add(newId)
    lastRecipe.value=newId
    setRecipeFindProgram(displayRecipeName(actualName, sourceKind))
    await scrollIntoView(recipeRefs, newId)
  } catch (err) {
    window.alert(`RECIPE Save As 실패: ${getErrorMessage(err)}`)
    return
  }
}

function recipeListDelete(){
  const ids = Array.from(selectedRecipes).filter(x=>x!=='R_NONE')
  if(ids.length===0) return

  openConfirm({
    title:'Confirm',
    tone:'default',
    message:'정말 삭제하시겠습니까?',
    onYes: async ()=>{
      try {
        const items = ids
          .map(id => allRecipes.value.find(r => r.id === id))
          .filter((r): r is RecipeDetail => !!r)
          .map(r => ({ kind: 'recipe' as const, name: r.name, sourceKind: r.sourceKind ?? activeRecipeSourceKind.value }))

        const sourceKindMap: Record<string, RecipeSourceKind> = {}
        for (const id of ids) {
          const r = allRecipes.value.find(x => x.id === id)
          if (r) sourceKindMap[id] = r.sourceKind ?? activeRecipeSourceKind.value
        }

        const res = await recipeTestApi.deleteFiles(eqpId.value, items, getActorName(), getActorTeam())
        void loadHistory()
        const deletedNames = new Set((res.deleted ?? []).map(x => x.name))
        const deletedIds = ids.filter(id => {
          const r = allRecipes.value.find(x => x.id === id)
          return !!r && deletedNames.has(r.name)
        })

        syncRecipeCacheAfterDelete(deletedIds, sourceKindMap)

        if(deletedIds.includes(lastRecipe.value)){
          selectedRecipes.clear()
          selectedRecipes.add('R_NONE')
          lastRecipe.value='R_NONE'
          setRecipeFindProgram('')
        }

        if (res.failed?.length) {
          window.alert(`RECIPE 삭제 부분 실패\n${res.failed.map(x => `- ${x.name}: ${x.reason}`).join('\n')}`)
        }
      } catch (err) {
        window.alert(`RECIPE 삭제 실패: ${getErrorMessage(err)}`)
      }
    },
    onNo:()=>{}
  })
}
/** reset helpers */
function resetCasSelectionOnly() {
  selectedCas.clear()
  lastCas.value=''
  setCasQueryProgram('')
  casCursorIdx.value = null
  casAnchorIdx.value = null
}
function resetJobSelectionOnly() {
  selectedJobs.clear()
  lastJob.value=''
  setJobQueryProgram('')
  jobCursorIdx.value = null
  jobAnchorIdx.value = null
}
function resetPageToBlank() {
  resetCasSelectionOnly()
  resetJobSelectionOnly()
  selectedRecipes.clear()
  selectedRecipes.add('R_NONE')
  lastRecipe.value='R_NONE'
  setRecipeFindProgram('')
  recipeCursorIdx.value = null
  recipeAnchorIdx.value = null

  casTab.value='standard'
  activePane.value='casList'
  keyboardControlMode.value='cas'
  casEditMode.value=false
  jobEditMode.value=false
  recipeEditMode.value=false
  clearCasCellSelection()
  recipePanelOpen.value=false
  ctxMenu.open=false
  jobListAttention.value=false
}
/** global click */
function onGlobalClickCapture(ev: MouseEvent){
  const target = ev.target as HTMLElement

  if(target.closest('.w97-menu') || target.closest('.w97-modal') || target.closest('.w97-modal-overlay')) return

  ctxMenu.open=false

  if(casEditMode.value){
    const insideCasContent = casContentEl.value?.contains(target)
    const insideCasList = casScrollEl.value?.closest('.cas-panel')?.contains(target)
    const insideJobList = jobScrollEl.value?.closest('.job-panel')?.contains(target)
    const insideJobContent = jobContentEl.value?.contains(target)
    if(!insideCasContent && !insideCasList && !insideJobList && !insideJobContent){
      casCancelRequested()
      return
    }
  }

  if(jobEditMode.value){
    const box = jobContentEl.value
    const insideJobList = jobScrollEl.value?.closest('.job-panel')?.contains(target)
    if(box && !box.contains(target) && !insideJobList){
      jobCancelRequested()
      return
    }
  }

  if(recipePanelOpen.value){
    if(Date.now() < suppressOutsideCloseUntil) return
    const panel = legacyPanelEl.value
    if(panel && panel.contains(target)) return
    closeRecipePanel()
  }
}

/** keyboard */
function isTypingTarget(ev: KeyboardEvent){
  const t = ev.target as HTMLElement | null
  if(!t) return false
  if (t.classList?.contains('w97-find')) return false
  const tag = (t.tagName||'').toLowerCase()
  return tag==='input'||tag==='textarea'||tag==='select'||(t as any).isContentEditable
}

function moveRecipePickerByArrow(ev: KeyboardEvent){
  const list = filteredRecipePickerList.value
  if(!list.length) return

  const vertical = (ev.key==='ArrowUp'||ev.key==='ArrowDown')
  const dir = (ev.key==='ArrowUp'||ev.key==='ArrowLeft') ? -1 : +1

  const currentIdx = Math.max(0, list.findIndex(r=>r.id===recipePicker.previewId))
  const step = vertical ? 1 : RECIPE_PER_COL
  const nextIdx = Math.min(list.length - 1, Math.max(0, currentIdx + dir * step))
  const id = list[nextIdx].id

  recipePicker.previewId = id
  recipePickerAnchorIdx.value = nextIdx
  scrollIntoView(recipePickerRefs, id)
  void ensureRecipeDetailById(id)
}

function onKeyDown(ev: KeyboardEvent){
  if(recipePicker.open){
    if(ev.key === 'Escape'){
      ev.preventDefault()
      closeRecipePicker()
      return
    }

    if(!isTypingTarget(ev) && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){
      ev.preventDefault()
      moveRecipePickerByArrow(ev)
      return
    }

    if(!isTypingTarget(ev) && ev.key === 'Enter'){
      ev.preventDefault()
      if(previewRecipe.value) pickRecipeForJob(previewRecipe.value)
      return
    }
  }

  if(isTypingTarget(ev)) return
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)) return
  ev.preventDefault()

  const vertical = (ev.key==='ArrowUp'||ev.key==='ArrowDown')
  const dir = (ev.key==='ArrowUp'||ev.key==='ArrowLeft') ? -1 : +1

  if(keyboardControlMode.value==='cas'){
    const list = casDisplayItems.value.map(x => x.name)
    if (!list.length) return
    const idx = getVisibleIndex(list, selectedCas as Set<string>, lastCas.value, casCursorIdx.value)
    const step = vertical ? 1 : CAS_PER_COL
    const nextIdx = Math.min(list.length-1, Math.max(0, idx + dir*step))
    const id = list[nextIdx]

    selectedCas.clear()
    selectedCas.add(id)
    lastCas.value=id
    casCursorIdx.value = nextIdx
    setCasQueryProgram(displayCasName(id))
    scrollIntoView(casRefs, id)
    applyCasToJobsFromSelection()
    activePane.value='casList'
    if (id !== CAS_NONE_ID) void fetchCasContent(id)

    keyboardControlMode.value='cas'
    return
  }

  if(keyboardControlMode.value==='job'){
    const list = jobDisplayItems.value
    if (!list.length) return
    const idx = getVisibleIndex(list.map(j => j.id), selectedJobs as Set<string>, lastJob.value, jobCursorIdx.value)
    const step = vertical ? 1 : JOB_PER_COL
    const nextIdx = Math.min(list.length-1, Math.max(0, idx + dir*step))
    const id = list[nextIdx].id

    selectedJobs.clear()
    selectedJobs.add(id)
    lastJob.value=id
    jobCursorIdx.value = nextIdx
    setJobQueryProgram(displayJobName(list[nextIdx].jobName))
    scrollIntoView(jobRefs, id)
    activePane.value='jobList'
    if (id !== JOB_NONE_ID) void fetchJobContent(id)

    keyboardControlMode.value='job'
    return
  }

  if(keyboardControlMode.value==='recipe'){
    if(!recipePanelOpen.value) return
    const list = allRecipes.value
    const idx = recipeCursorIdx.value !== null ? recipeCursorIdx.value : Math.max(0, list.findIndex(r=>r.id===lastRecipe.value))
    const step = vertical ? 1 : RECIPE_PER_COL
    const nextIdx = Math.min(list.length-1, Math.max(0, idx + dir*step))
    const id = list[nextIdx].id

    selectedRecipes.clear()
    selectedRecipes.add(id)
    lastRecipe.value=id
    recipeCursorIdx.value = nextIdx
    setRecipeFindProgram(displayRecipeName(list[nextIdx].name, list[nextIdx].sourceKind ?? activeRecipeSourceKind.value))
    scrollIntoView(recipeRefs, id)
    void ensureRecipeDetailById(id)

    keyboardControlMode.value='recipe'
    activePane.value='recipeArea'
  }
}

/** table resize */
type TableKey = 'cas'
const casTableHeaders = ['Slot #', 'Job Name']

const tableColWidths = reactive<Record<TableKey, number[]>>({
  cas: [70, 190],
})

const resizeState = reactive<{
  active: boolean
  tableKey: TableKey | null
  colIndex: number
  startX: number
  startLeft: number
  startRight: number
}>({
  active: false,
  tableKey: null,
  colIndex: -1,
  startX: 0,
  startLeft: 0,
  startRight: 0,
})

function startResize(tableKey: TableKey, colIndex: number, e: MouseEvent) {
  const widths = tableColWidths[tableKey]
  if (!widths[colIndex + 1]) return

  resizeState.active = true
  resizeState.tableKey = tableKey
  resizeState.colIndex = colIndex
  resizeState.startX = e.clientX
  resizeState.startLeft = widths[colIndex]
  resizeState.startRight = widths[colIndex + 1]

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', stopResize)
}
function onResizeMove(e: MouseEvent) {
  if (!resizeState.active || !resizeState.tableKey) return
  const widths = tableColWidths[resizeState.tableKey]
  const minW = 48
  const delta = e.clientX - resizeState.startX

  let left = resizeState.startLeft + delta
  let right = resizeState.startRight - delta

  if (left < minW) {
    right -= (minW - left)
    left = minW
  }
  if (right < minW) {
    left -= (minW - right)
    right = minW
  }

  widths[resizeState.colIndex] = left
  widths[resizeState.colIndex + 1] = right
}
function stopResize() {
  resizeState.active = false
  resizeState.tableKey = null
  resizeState.colIndex = -1
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', stopResize)
}

function clearLoadedDataState(){
  hasLoadedFiles.value = false
  casData.value = []
  jobsData.value = []
  recipesData.value = []
  casToJobs.value = {}
  clearObject(casTableMap)
  clearObject(casBaseline)
  clearObject(jobConfigMap)
  clearObject(jobBaseline)
  clearObject(jobParsedMap)
  clearObject(jobMissingRecipeMapById)
  clearObject(recipeSourceCache)
  clearObject(recipeSourceTitleMap)
  activeRecipeSourceKind.value = "recipe"
  resetPageToBlank()
  closeRecipePanel()
  resetCasScrollToLeftTop()
  inventorySnapshotHash.value = ''
  stopInventorySnapshotPolling()
}


function buildRecipeFromSnapshotItem(item: any, sourceKindOverride?: RecipeSourceKind) {
  const sourceKind = (sourceKindOverride || item.sourceKind || 'recipe') as RecipeSourceKind
  const id = String(item.id || `RCP_SRC::${sourceKind}::${item.name || ''}`)
  const name = String(item.name || '')
  const modifiedAt = String(item.modifiedAt || '')
  return NO_PREVIEW_SOURCE_KINDS.has(sourceKind)
    ? createNoPreviewRecipe(id, name, modifiedAt, sourceKind)
    : createPlaceholderRecipe(id, name, `${recipeSourceTitleMap[sourceKind] || 'Recipe'} preview placeholder`, modifiedAt, sourceKind)
}

const inventorySnapshotReloading = ref(false)

function applyInventoryRecipeSnapshot(snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return
  inventorySnapshotHash.value = String(snapshot.snapshotHash || '')
  const titles = (snapshot.sourceTitles || {}) as Record<string, string>
  Object.entries(titles).forEach(([k, v]) => { recipeSourceTitleMap[k] = String(v || '') })

  const nextSourceCache: Record<string, RecipeDetail[]> = {}
  const sourceLists = (snapshot.sourceLists || {}) as Record<string, any[]>
  Object.entries(sourceLists).forEach(([kind, items]) => {
    nextSourceCache[kind] = (Array.isArray(items) ? items : []).map((item: any) => buildRecipeFromSnapshotItem(item, kind as RecipeSourceKind))
  })

  const recipeUnion = (Array.isArray(snapshot.items) ? snapshot.items : []).map((item: any) => buildRecipeFromSnapshotItem(item, item.sourceKind || 'recipe'))
  nextSourceCache.recipe = recipeUnion

  Object.keys(recipeSourceCache).forEach((k) => {
    if (!(k in nextSourceCache)) delete recipeSourceCache[k]
  })
  Object.entries(nextSourceCache).forEach(([k, v]) => {
    if (v.length === 0 && (recipeSourceCache[k]?.length ?? 0) > 0) return
    recipeSourceCache[k] = v
    // Non-recipe kinds populated from snapshot (DB-only): mark for API refresh in primeRecipeSourceCache
    if (k !== 'recipe' && v.length > 0) snapshotCachedKinds.add(k)
  })

  if (activeRecipeSourceKind.value === 'recipe') {
    recipesData.value = [...recipeUnion]
    sortRecipesData()
  } else if (recipeSourceCache[activeRecipeSourceKind.value]?.length) {
    recipesData.value = [...recipeSourceCache[activeRecipeSourceKind.value]]
    sortRecipesData()
  }
}

async function pollInventoryRecipeSnapshot() {
  if (!eqpId.value || !hasLoadedFiles.value || inventorySnapshotReloading.value || recipePicker.open) return
  try {
    const snapshot = await recipeTestApi.getInventoryRecipeSnapshot(eqpId.value)
    const nextHash = String(snapshot.snapshotHash || '')
    if (!inventorySnapshotHash.value) {
      applyInventoryRecipeSnapshot(snapshot)
      return
    }
    if (nextHash !== inventorySnapshotHash.value) {
      inventorySnapshotReloading.value = true
      try {
        inventorySnapshotHash.value = nextHash
        const spec = captureReloadRestoreSpec({ keepRecipePanel: recipePanelOpen.value })
        try { await recipeTestApi.invalidateRuntimeCache(eqpId.value) } catch {}
        await reloadAndRestoreSelections(spec)
      } finally {
        inventorySnapshotReloading.value = false
      }
    }
  } catch (err) {
    console.warn('inventory snapshot poll failed', err)
  }
}

function startInventorySnapshotPolling() {
  stopInventorySnapshotPolling()
  inventorySnapshotTimer = window.setInterval(() => { void pollInventoryRecipeSnapshot() }, 3000)
}

function stopInventorySnapshotPolling() {
  if (inventorySnapshotTimer !== null) {
    window.clearInterval(inventorySnapshotTimer)
    inventorySnapshotTimer = null
  }
}

/** load */
async function load(keepRecipePanel:boolean){
  if (!eqpId.value) {
    window.alert('설비ID를 선택한 후 Load를 실행하세요.')
    return
  }

  isLoading.value = true
  loadingMessage.value = 'FTP 파일과 목록을 불러오는중...'

  try {
    const res = await recipeTestApi.load({
      line: line.value,
      team: team.value,
      eqpId: eqpId.value,
    })

    const baseRecipes = res.recipeList.map(r =>
      createPlaceholderRecipe(r.id, r.name, 'Recipe를 선택하면 preview를 불러옵니다.', r.modifiedAt ?? '', 'recipe')
    )
    recipeSourceCache.recipe = [...baseRecipes]
    recipeSourceTitleMap.recipe = 'Recipe'
    recipesData.value = [...baseRecipes]
    sortRecipesData()

    jobsData.value = res.jobList.map(j => ({
      id: j.id,
      jobName: j.jobName,
      modifiedAt: j.modifiedAt,
      recipe:
        recipesData.value.find(r => r.name === j.recipeName) ??
        createPlaceholderRecipe(`BASE_${j.id}`, j.recipeName ?? NONE_LABEL, 'Base recipe summary', '', 'recipe'),
    }))
    sortJobsData()

    casData.value = [...res.casList]
    sortCasData()

    casToJobs.value = res.casToJobs ?? {}
    hasLoadedFiles.value = true

    clearObject(casTableMap)
    clearObject(casBaseline)
    clearObject(jobConfigMap)
    clearObject(jobBaseline)
    clearObject(jobParsedMap)
    clearObject(recipeSourceCache)
    clearObject(recipeSourceTitleMap)
    snapshotCachedKinds.clear()
    recipeSourceCache.recipe = [...baseRecipes]
    recipeSourceTitleMap.recipe = 'Recipe'
    activeRecipeSourceKind.value = 'recipe'

    inventorySnapshotHash.value = ''
    startInventorySnapshotPolling()
    void pollInventoryRecipeSnapshot()

    resetPageToBlank()
    if(!keepRecipePanel) closeRecipePanel()
    resetCasScrollToLeftTop()
  } catch (err) {
    console.error('load failed:', err)
    clearLoadedDataState()
    window.alert(`Load 실패: ${getErrorMessage(err)}`)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

onMounted(async () => {
  try {
    const authRes = await fetch('/api/auth/me', { credentials: 'include' })
    if (authRes.ok) {
      const user = await authRes.json()
      actorName.value = String(user.Username || user.LoginId || '')
    }
  } catch {}
  if (!actorName.value) {
    try { actorName.value = window.localStorage.getItem('recipe_test_actor_name') || '' } catch {}
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('click', onGlobalClickCapture, true)
  window.addEventListener('resize', updateCartOverlayPos)
  window.addEventListener('scroll', updateCartOverlayPos, true)
  await loadEqpOptions()
  try {
    const res = await fetch('/api/user/preferences')
    if (res.ok) {
      const prefs = await res.json()
      if (prefs.line) line.value = prefs.line
      if (prefs.team) team.value = prefs.team
    }
  } catch {}
  if (!team.value) {
    try {
      const res = await fetch('/api/user/profile', { credentials: 'include' })
      if (res.ok) {
        const profile = await res.json()
        if (profile.part) team.value = profile.part
      }
    } catch {}
  }
  resetPageToBlank()
  updateCartOverlayPos()
})
onBeforeUnmount(() => {
  stopInventorySnapshotPolling()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('click', onGlobalClickCapture, true)
  window.removeEventListener('resize', updateCartOverlayPos)
  window.removeEventListener('scroll', updateCartOverlayPos, true)
  stopResize()
  stopListResize()
  stopRecipeResize()
  clearTimeout(scrollBottomTimer)
  clearTimeout(jobAttentionTimer)
})

watch(cartOpen, (open) => {
  if (open) nextTick(() => updateCartOverlayPos())
})

watch(activePane, () => {
  if (lastCas.value && activePane.value !== 'casList') {
    void scrollIntoView(casRefs, lastCas.value)
  }
  if (lastJob.value && activePane.value !== 'jobList') {
    void scrollIntoView(jobRefs, lastJob.value)
  }
})
</script>

<style scoped>
.page{
  display:grid;
  gap:14px;
  padding-bottom:12px;
  overflow-x:hidden;
  outline:none;
}
.grid{
  display:flex;
  gap:14px;
  align-items:stretch;
  min-width:0;
  overflow-x:hidden;
}
.cas-panel,
.job-panel,
.cas-content,
.content{
  transition:
    width .34s cubic-bezier(.22,.61,.36,1),
    flex-basis .34s cubic-bezier(.22,.61,.36,1),
    flex-grow .34s cubic-bezier(.22,.61,.36,1),
    box-shadow .24s ease,
    transform .24s ease,
    border-color .24s ease;
}
.cas-panel{
  min-width:0;
}
.job-panel{
  min-width:0;
}
.cas-content{
  min-width:0;
  overflow:hidden;
  box-sizing:border-box;
}
.cas-content:not(.open){
  width:0px;
}
.content{
  flex:1 1 0%;
  min-width:0;
}
.cart-dismiss-layer{
  position:fixed;
  inset:0;
  z-index:1090;
  background:transparent;
}
.cart-overlay{
  position:fixed;
  z-index:1100;
  width:max-content;
  max-width:calc(100vw - 24px);
}
.cartDock-enter-active,
.cartDock-leave-active{
  transition:opacity .18s ease;
}
.cartDock-enter-from,
.cartDock-leave-to{
  opacity:0;
}
.cartDock-enter-from .cart-overlay,
.cartDock-leave-to .cart-overlay{
  transform:translateY(-8px) scale(.92);
  transform-origin:top right;
  opacity:.2;
}
.cartDock-enter-to .cart-overlay,
.cartDock-leave-from .cart-overlay{
  transform:translateY(0) scale(1);
  opacity:1;
}
.cartDock-enter-active .cart-overlay,
.cartDock-leave-active .cart-overlay{
  transition:transform .18s ease, opacity .18s ease;
}
.cart-fly-layer{
  position:fixed;
  inset:0;
  pointer-events:none;
  z-index:12000;
}
.cart-fly-token{
  position:fixed;
  left:0;
  top:0;
  transform:translate(-9999px, -9999px);
  transition:transform .72s cubic-bezier(.2,.8,.2,1), opacity .72s ease;
  padding:4px 8px;
  border-radius:999px;
  background:#fff7ed;
  border:1px solid #fdba74;
  color:#9a3412;
  font-size:11px;
  font-weight:900;
  box-shadow:0 8px 18px rgba(154,52,18,.22);
}
.fadeIn-enter-active,
.fadeIn-leave-active{ transition: opacity .18s ease; }
.fadeIn-enter-from,
.fadeIn-leave-to{ opacity:0; }
.ascii-name-modal-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,.28); display:flex; align-items:center; justify-content:center; z-index:12000;
}
.ascii-name-modal{
  width:min(420px, 92vw); background:#c0c0c0; border-top:2px solid #fff; border-left:2px solid #fff; border-right:2px solid #404040; border-bottom:2px solid #404040;
}
.ascii-name-titlebar{
  background:#0a246a; color:#fff; padding:6px 8px; font-weight:900;
}
.ascii-name-body{ padding:12px; display:grid; gap:8px; }
.ascii-name-hint{ font-size:11px; line-height:1.35; color:#333; }
.ascii-name-input{ width:100%; box-sizing:border-box; }
.ascii-name-actions{ padding:0 12px 12px; display:flex; justify-content:flex-end; gap:8px; }


.top-tabs-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.top-tabs{
  display:flex;
  gap:8px;
}
.top-tab-btn{
  height:28px;
  padding:0 12px;
  background:#d4d0c8;
  border-top:2px solid #fff;
  border-left:2px solid #fff;
  border-right:2px solid #404040;
  border-bottom:2px solid #404040;
  font-weight:700;
  cursor:pointer;
}
.top-tab-btn.active{
  background:#0a246a;
  color:#fff;
}
.actor-box{
  display:flex;
  align-items:center;
  gap:8px;
}
.actor-label{
  font-size:12px;
  font-weight:700;
}
.actor-input{
  width:180px;
}
.recipe-test-shell{
  display:grid;
  gap:14px;
}
.history-shell{
  background:#c0c0c0;
  border:1px solid #8d8d8d;
  border-radius:6px;
  padding:12px;
  display:grid;
  gap:10px;
}
.history-toolbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.history-title{
  font-size:18px;
  font-weight:900;
}
.history-subtitle{
  font-size:12px;
  color:#444;
}
.history-table-wrap{
  background:#fff;
  border:1px solid #8d8d8d;
  overflow:auto;
  max-height:720px;
}
.history-table{
  width:100%;
  border-collapse:collapse;
  font-size:12px;
}
.history-table th,
.history-table td{
  border:1px solid #a9a9a9;
  padding:6px 8px;
  text-align:left;
}
.history-table th{
  background:#d4d0c8;
  font-weight:900;
}
.history-empty{
  text-align:center !important;
  color:#555;
}


</style>
