export type GridCell = string | number | null
export type GridRow = Record<string, GridCell>

export type RecipeSourceKind =
  | 'recipe'
  | 'polishRecipe'
  | 'conditionRecipe'
  | 'exSituCondition'
  | 'specialExSitu'
  | 'isrmAlgorithm'
  | 'rtpcRecipe'
  | 'hcluPostLoad'
  | 'hcluPreUnload'
  | 'megasonics'
  | 'brush1'
  | 'brush2'
  | 'vaporDryer'
  | 'metrologyRecipe'

export type RecipeDetail = { id: string; name: string; columns: string[]; rows: GridRow[]; modifiedAt?: string; sourceKind?: RecipeSourceKind }
export type FileEntry = { name: string; modifiedAt: string; size?: string; rawLine?: string }
export type JobConfigPayload = { p1: string; p2: string; p3: string; piPre: 'NONE' | 'DATA'; piPost: 'NONE' | 'DATA'; unloadModule: 'NONE' | 'DATA' }
export type JobParsedRow = { label: string; p1: string; p2: string; p3: string }
export type CleanerParsedRow = { index: string; module: string; recipe: string }
export type JobUseHeads = { head1: boolean; head2: boolean; head3: boolean; head4: boolean }
export type JobHcluRecipes = { postLoad: string; preUnload: string }
export type JobParsed = {
  preMetrology: { enabled: boolean; recipe: string }
  polisher: { route: boolean; rows: JobParsedRow[] }
  cleaner: { route: boolean; numberOfSteps: number; rows: CleanerParsedRow[] }
  postMetrology: { enabled: boolean; recipe: string }
  useHeads?: JobUseHeads
  hcluRecipes?: JobHcluRecipes
}
export type JobRecipeClickPayload = { value: string; sourceKind: RecipeSourceKind; titleBase: string; emphasizeText?: string; platen?: 1 | 2 | 3 | null }
export type RecipeSourceListItem = { id: string; name: string; modifiedAt: string; sourceKind: RecipeSourceKind; ext?: string }
export type RecipeSourceListResponse = { sourceKind: RecipeSourceKind; titleBase: string; path: string; exts: string[]; readError?: string; items: RecipeSourceListItem[] }
export type InventoryFailure = { failureId: number; eqpId: string; sourcePath: string; stage: string; reason: string; createdAt: string; resolved: boolean }
export type InventoryFailuresResponse = { items: InventoryFailure[] }
export type InventoryRecipeSnapshotItem = { id: string; name: string; modifiedAt: string; sourceKind: RecipeSourceKind; ext?: string; livePresent?: boolean; cached?: boolean }
export type InventoryRecipeSnapshotResponse = { eqpId: string; snapshotHash: string; fileCount: number; items: InventoryRecipeSnapshotItem[]; sourceLists: Record<string, InventoryRecipeSnapshotItem[]>; sourceTitles?: Record<string, string> }
export type LoadRequest = { line: string; team: string; eqpId: string }
export type EqpOptionItem = { line: string; team: string; eqpId: string; model?: string; maker?: string; modelGroup?: string }
export type EqpOptionsResponse = { items: EqpOptionItem[]; lineOptions: string[]; teamOptions: string[]; eqpOptions: string[] }
export type LoadResponse = { eqpId: string; meta?: any; casList: FileEntry[]; jobList: Array<{ id: string; jobName: string; recipeName: string; modifiedAt: string }>; recipeList: Array<{ id: string; name: string; modifiedAt?: string }>; casToJobs?: Record<string, string[]> }
export type CasContentResponse = { casId: string; slots: Array<{ slot: number; jobId: string; jobName: string; recipeName: string }>; jobIds?: string[]; raw?: string }
export type JobContentResponse = { jobId: string; jobName: string; baseRecipeName: string; parsed: JobParsed; raw?: string }
export type RecipeContentResponse = { recipe: RecipeDetail }
export type PersistCasResponse = { status: string; savedAs: string; targetPath: string }
export type PersistJobResponse = { status: string; savedAs: string; targetPath: string; patternSummary?: Record<string, number> }
export type CloneRecipeResponse = { status: string; savedAs: string; targetPath: string; overwrote?: boolean }
export type RenameFileRequest = { eqpId: string; kind: 'cas' | 'job' | 'recipe'; sourceName: string; targetName: string; sourceKind?: RecipeSourceKind; actorName?: string; actorTeam?: string }
export type RenameFileResponse = { status: string; name: string; path: string; overwrote?: boolean }
export type DeleteFileItem = { kind: 'cas' | 'job' | 'recipe'; name: string; sourceKind?: RecipeSourceKind }
export type DeleteFilesResponse = { status: string; deleted: Array<{ status: string; kind: 'cas' | 'job' | 'recipe'; name: string; path: string }>; failed: Array<{ kind: 'cas' | 'job' | 'recipe'; name: string; reason: string }> }
export type TransferCartItem = { kind: 'cas' | 'job' | 'recipe'; name: string; sourceEqpId: string; sourceKind?: RecipeSourceKind }
export type TransferRequest = { items: TransferCartItem[]; targetEqpIds: string[]; actorName?: string; actorTeam?: string }
export type TransferResultItem = { targetEqpId: string; name: string; kind: 'cas' | 'job' | 'recipe'; path: string; status: string }
export type TransferResponse = { status: string; moved: TransferResultItem[]; failed?: Array<{ targetEqpId: string; name: string; kind: 'cas' | 'job' | 'recipe'; sourceEqpId: string; reason: string }> }
export type HistoryEntry = { actorName: string; actorTeam: string; fromEqpId: string; action: string; toEqpId: string; createdAt: string; itemKind?: string; sourceName?: string; targetName?: string; recipeName?: string; requestId?: string; status?: string; reason?: string; detail?: string }
export type HistoryResponse = { items: HistoryEntry[] }

import { mockCasContent, mockEqpOptions, mockHistoryItems, mockJobContent, mockLoadResponse } from './mockData'

const API_BASE = ''

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init, signal: controller.signal })
    if (!res.ok) { const text = await res.text(); throw new Error(text || 'API request failed') }
    return res.json() as Promise<T>
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('응답 대기시간이 초과되었습니다.')
    throw err
  } finally { clearTimeout(timer) }
}

export const recipeTestApi = {
  async getEqpOptions() {
    try {
      return await http<EqpOptionsResponse>('/api/recipe-test/eqp-options')
    } catch {
      return mockEqpOptions
    }
  },
  async load(body: LoadRequest) {
    try {
      return await http<LoadResponse>('/api/recipe-test/load', { method: 'POST', body: JSON.stringify(body) })
    } catch {
      return {
        ...mockLoadResponse,
        eqpId: body.eqpId,
        meta: { ...mockLoadResponse.meta, line: body.line, team: body.team },
      }
    }
  },
  async getCasContent(eqpId: string, casId: string) {
    const qs = new URLSearchParams({ eqpId, casId }).toString()
    try {
      return await http<CasContentResponse>(`/api/recipe-test/cas-content?${qs}`)
    } catch {
      const jobIds = mockLoadResponse.casToJobs?.[casId] ?? mockCasContent.jobIds ?? []
      const jobMap = new Map(mockLoadResponse.jobList.map((job) => [job.id, job]))
      return {
        casId,
        slots: Array.from({ length: 25 }, (_, index) => {
          const jobId = jobIds[index] ?? ''
          const job = jobMap.get(jobId)
          return {
            slot: index + 1,
            jobId,
            jobName: job?.jobName ?? '(None)',
            recipeName: job?.recipeName ?? '(None)',
          }
        }),
        jobIds,
      }
    }
  },
  async getJobContent(eqpId: string, jobId: string) {
    const qs = new URLSearchParams({ eqpId, jobId }).toString()
    try {
      return await http<JobContentResponse>(`/api/recipe-test/job-content?${qs}`)
    } catch {
      const job = mockLoadResponse.jobList.find((item) => item.id === jobId)
      return {
        ...mockJobContent,
        jobId,
        jobName: job?.jobName ?? mockJobContent.jobName,
        baseRecipeName: job?.recipeName ?? mockJobContent.baseRecipeName,
      }
    }
  },
  async getRecipeContent(eqpId: string, recipeId: string) {
    const qs = new URLSearchParams({ eqpId, recipeId }).toString()
    try {
      return await http<RecipeContentResponse>(`/api/recipe-test/recipe-content?${qs}`)
    } catch {
      const recipe = mockLoadResponse.recipeList.find((item) => item.id === recipeId || item.name === recipeId)
      const name = recipe?.name ?? recipeId
      return {
        recipe: {
          id: recipe?.id ?? recipeId,
          name,
          modifiedAt: recipe?.modifiedAt,
          columns: ['Field', 'Value'],
          rows: [
            { Field: 'Equipment', Value: eqpId },
            { Field: 'Recipe Name', Value: name },
            { Field: 'Recipe ID', Value: recipe?.id ?? recipeId },
            { Field: 'Source', Value: 'mock-fallback' },
          ],
        },
      }
    }
  },
  getRecipeSourceList(eqpId: string, sourceKind: RecipeSourceKind) { const qs = new URLSearchParams({ eqpId, sourceKind }).toString(); return http<RecipeSourceListResponse>(`/api/recipe-test/recipe-source-list?${qs}`) },
  saveCas(eqpId: string, casId: string, slots: Array<{ slot: number; jobId: string; jobName: string; recipeName: string }>) { return http<{ status: string }>('/api/recipe-test/cas/save', { method: 'POST', body: JSON.stringify({ eqpId, casId, slots }) }) },
  persistCas(eqpId: string, sourceCasId: string, targetCasId: string, slots: Array<{ slot: number; jobId: string; jobName: string; recipeName: string }>, actorName = '', actorTeam = '') { return http<PersistCasResponse>('/api/recipe-test/cas/persist', { method: 'POST', body: JSON.stringify({ eqpId, sourceCasId, targetCasId, slots, actorName, actorTeam }) }) },
  saveJob(eqpId: string, jobId: string, config: JobConfigPayload) { return http<{ status: string }>('/api/recipe-test/job/save', { method: 'POST', body: JSON.stringify({ eqpId, jobId, config }) }) },
  persistJob(eqpId: string, sourceJobId: string, targetJobName: string, parsed: JobParsed, actorName = '', actorTeam = '') { return http<PersistJobResponse>('/api/recipe-test/job/persist', { method: 'POST', body: JSON.stringify({ eqpId, sourceJobId, targetJobName, parsed, actorName, actorTeam }) }) },
  renameFile(body: RenameFileRequest) { return http<RenameFileResponse>('/api/recipe-test/file/rename', { method: 'POST', body: JSON.stringify(body) }) },
  deleteFiles(eqpId: string, items: DeleteFileItem[], actorName = '', actorTeam = '') { return http<DeleteFilesResponse>('/api/recipe-test/file/delete', { method: 'POST', body: JSON.stringify({ eqpId, items, actorName, actorTeam }) }) },
  transferFiles(body: TransferRequest) { return http<TransferResponse>('/api/recipe-test/transfer', { method: 'POST', body: JSON.stringify(body) }) },
  getInventoryRecipeSnapshot(eqpId: string) { const qs = new URLSearchParams({ eqpId }).toString(); return http<InventoryRecipeSnapshotResponse>(`/api/recipe-inventory/snapshot?${qs}`) },
  invalidateRuntimeCache(eqpId: string) { return http<{ status: string; eqpId: string }>(`/api/recipe-test/invalidate-runtime-cache`, { method: 'POST', body: JSON.stringify({ eqpId }) }) },
  async getHistory(limit = 500) {
    const qs = new URLSearchParams({ limit: String(limit) }).toString()
    try {
      return await http<HistoryResponse>(`/api/recipe-test/history?${qs}`)
    } catch {
      return { items: mockHistoryItems.slice(0, limit) }
    }
  },
  cloneRecipe(eqpId: string, sourceRecipeName: string, targetRecipeName: string, sourceKind: RecipeSourceKind, actorName = '', actorTeam = '') { return http<CloneRecipeResponse>('/api/recipe-test/recipe/clone', { method: 'POST', body: JSON.stringify({ eqpId, sourceRecipeName, targetRecipeName, sourceKind, actorName, actorTeam }) }) },
}
