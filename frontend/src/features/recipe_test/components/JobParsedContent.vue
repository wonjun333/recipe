<template>
  <div class="job-parsed" v-if="parsed">
    <div class="bar">
      <div class="bar-left">
        <label class="checkline">
          <input
            :class="['job-checkbox', editable ? 'editable' : 'readonly']"
            type="checkbox"
            :checked="parsed.preMetrology.enabled"
            :disabled="!editable"
            @change="emit('toggle-flag', { section: 'preMetrology', key: 'enabled', checked: ($event.target as HTMLInputElement).checked })"
          />
          <span>Perform Dry Metrology Pre-Measurement</span>
        </label>
      </div>
      <div class="bar-right">
        <span class="bar-label">Pre-Metrology Recipe</span>
        <div
          class="recipe-box"
          :class="{ disabled: !parsed.preMetrology.enabled, clickable: editable || isSelectableRecipeValue(parsed.preMetrology.recipe), 'missing-ref': isMissingRecipe('preMetrology') }"
          @click="emitRecipeClick(parsed.preMetrology.recipe ?? noneLabel, { sourceKind: 'metrologyRecipe', titleBase: 'Pre-Metrology Recipe', emphasizeText: 'Pre-Metrology' })"
        >
          {{ parsed.preMetrology.recipe }}
        </div>
      </div>
    </div>

    <div class="group">
      <div class="group-head group-head-split">
        <label class="checkline">
          <input
            :class="['job-checkbox', editable ? 'editable' : 'readonly']"
            type="checkbox"
            :checked="parsed.polisher.route"
            :disabled="!editable"
            @change="emit('toggle-flag', { section: 'polisher', key: 'route', checked: ($event.target as HTMLInputElement).checked })"
          />
          <span>Route to Polisher</span>
        </label>

        <div class="use-heads">
          <span class="use-heads-label">Use Heads :</span>
          <span class="use-head-item"><span class="mark">{{ headMark(parsed.useHeads?.head1) }}</span> Head1</span>
          <span class="use-head-item"><span class="mark">{{ headMark(parsed.useHeads?.head2) }}</span> Head2</span>
          <span class="use-head-item"><span class="mark">{{ headMark(parsed.useHeads?.head3) }}</span> Head3</span>
          <span class="use-head-item"><span class="mark">{{ headMark(parsed.useHeads?.head4) }}</span> Head4</span>
        </div>
      </div>

      <div class="hclu-row hclu-row-top">
        <span class="hclu-label">HCLU Clean Recipe Post Load</span>
        <div
          class="recipe-box hclu-box"
          :class="{ clickable: (editable || isSelectableRecipeValue(parsed.hcluRecipes?.postLoad)) && !isMissingRecipe('hclu', 'postLoad'), 'missing-ref': isMissingRecipe('hclu', 'postLoad') }"
          @click="emitRecipeClick(parsed.hcluRecipes?.postLoad ?? noneLabel, { sourceKind: 'hcluPostLoad', titleBase: 'HCLU Clean Recipe Post Load' })"
        >
          {{ parsed.hcluRecipes?.postLoad || noneLabel }}
        </div>
      </div>

      <div class="tbl-wrap tight-tbl">
        <table class="tbl polished compact-polisher">
          <thead>
            <tr>
              <th></th>
              <th class="platen2-head">Platen 1</th>
              <th class="platen2-head">Platen 2</th>
              <th class="platen2-head">Platen 3</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in parsed.polisher.rows" :key="row.label">
              <td class="rowname">{{ row.label }}</td>
              <td
                class="cell job-value-cell"
                :class="jobValueCellClass(row.p1, 1, row.label, jobMissingKey('polisher', row.label, 'p1'))"
                @click="emitPolisherClick(row.label, row.p1, 1)"
              >{{ row.p1 }}</td>
              <td
                class="cell job-value-cell platen2-col"
                :class="jobValueCellClass(row.p2, 2, row.label, jobMissingKey('polisher', row.label, 'p2'))"
                @click="emitPolisherClick(row.label, row.p2, 2)"
              >{{ row.p2 }}</td>
              <td
                class="cell job-value-cell"
                :class="jobValueCellClass(row.p3, 3, row.label, jobMissingKey('polisher', row.label, 'p3'))"
                @click="emitPolisherClick(row.label, row.p3, 3)"
              >{{ row.p3 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hclu-row hclu-row-bottom">
        <span class="hclu-label">HCLU Clean Recipe Pre Unload</span>
        <div
          class="recipe-box hclu-box"
          :class="{ clickable: (editable || isSelectableRecipeValue(parsed.hcluRecipes?.preUnload)) && !isMissingRecipe('hclu', 'preUnload'), 'missing-ref': isMissingRecipe('hclu', 'preUnload') }"
          @click="emitRecipeClick(parsed.hcluRecipes?.preUnload ?? noneLabel, { sourceKind: 'hcluPreUnload', titleBase: 'HCLU Clean Recipe Pre Unload' })"
        >
          {{ parsed.hcluRecipes?.preUnload || noneLabel }}
        </div>
      </div>
    </div>

    <div class="group">
      <div class="group-head">
        <label class="checkline">
          <input
            :class="['job-checkbox', editable ? 'editable' : 'readonly']"
            type="checkbox"
            :checked="parsed.cleaner.route"
            :disabled="!editable"
            @change="emit('toggle-flag', { section: 'cleaner', key: 'route', checked: ($event.target as HTMLInputElement).checked })"
          />
          <span>Route to Cleaner</span>
        </label>
      </div>

      <div class="tbl-wrap tight-tbl cleaner-wrap">
        <table class="tbl small cleaner-table compact-cleaner">
          <colgroup>
            <col class="cleaner-module-col" />
            <col class="cleaner-recipe-col" />
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>Recipe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in parsed.cleaner.rows" :key="`${row.index}-${row.module}-${row.recipe}`">
              <td class="cell cleaner-module-cell">{{ cleanerModuleLabel(row, idx) }}</td>
              <td
                class="cell job-value-cell cleaner-recipe-cell"
                :class="jobValueCellClass(row.recipe, undefined, 'Cleaner', jobMissingKey('cleaner', idx))"
                @click="emitCleanerClick(row, idx)"
              >
                {{ row.recipe }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bar">
      <div class="bar-left">
        <label class="checkline">
          <input
            :class="['job-checkbox', editable ? 'editable' : 'readonly']"
            type="checkbox"
            :checked="parsed.postMetrology.enabled"
            :disabled="!editable"
            @change="emit('toggle-flag', { section: 'postMetrology', key: 'enabled', checked: ($event.target as HTMLInputElement).checked })"
          />
          <span>Perform Dry Metrology Post-Measurement</span>
        </label>
      </div>
      <div class="bar-right">
        <span class="bar-label">Post-Metrology Recipe</span>
        <div
          class="recipe-box"
          :class="{ disabled: !parsed.postMetrology.enabled, clickable: editable || isSelectableRecipeValue(parsed.postMetrology.recipe), 'missing-ref': isMissingRecipe('postMetrology') }"
          @click="emitRecipeClick(parsed.postMetrology.recipe ?? noneLabel, { sourceKind: 'metrologyRecipe', titleBase: 'Post-Metrology Recipe', emphasizeText: 'Post-Metrology' })"
        >
          {{ parsed.postMetrology.recipe }}
        </div>
      </div>
    </div>
  </div>

  <div v-else class="job-parsed-empty">
    Job를 선택하세요.
  </div>
</template>

<script setup lang="ts">
import type { CleanerParsedRow, JobParsed, JobRecipeClickPayload, RecipeSourceKind } from '../api/recipeTestApi'

const props = withDefaults(defineProps<{
  parsed: JobParsed | null
  editable?: boolean
  noneLabel?: string
  missingRecipeMap?: Record<string, boolean>
}>(), {
  editable: false,
  noneLabel: '(None)',
  missingRecipeMap: () => ({}),
})

const emit = defineEmits<{
  (e: 'toggle-flag', payload: { section: 'preMetrology' | 'postMetrology' | 'polisher' | 'cleaner'; key: string; checked: boolean }): void
  (e: 'value-click', payload: JobRecipeClickPayload): void
}>()

function isSelectableRecipeValue(value: string | undefined) {
  const v = String(value || '').trim()
  return v !== '' && v !== props.noneLabel
}

function headMark(flag: boolean | undefined) {
  return flag ? '✔' : '□'
}

function jobMissingKey(...parts: Array<string | number>) {
  return parts.map(x => String(x)).join('::')
}

function isMissingRecipe(...parts: Array<string | number>) {
  if (parts.length === 1 && String(parts[0]).includes('::')) return !!props.missingRecipeMap?.[String(parts[0])]
  return !!props.missingRecipeMap?.[jobMissingKey(...parts)]
}

function jobValueCellClass(value: string, platen?: number, rowLabel?: string, missingKey?: string) {
  return {
    clickable: !(missingKey && isMissingRecipe(missingKey)) && (props.editable || isSelectableRecipeValue(value)),
    'platen2-col': platen === 2,
    'non-polish-cell': rowLabel !== 'Polish Recipe',
    'missing-ref': !!(missingKey && isMissingRecipe(missingKey)),
  }
}

function normalizeModuleText(value: string | undefined) {
  return String(value || '').trim().toLowerCase().replace(/[_\-]+/g, ' ')
}

function cleanerModuleLabel(row: CleanerParsedRow, idx: number) {
  const displayText = normalizeModuleText(row.index)
  const moduleText = normalizeModuleText(row.module)
  const merged = `${displayText} ${moduleText}`.trim()

  if (merged.includes('cleaner input') || merged.includes('cin')) return 'Cleaner Input'
  if (merged.includes('mega')) return 'Megasonics'
  if (merged.includes('brush 1') || merged.includes('brush1') || merged.includes('br1')) return 'Brush 1'
  if (merged.includes('brush 2') || merged.includes('brush2') || merged.includes('br2')) return 'Brush 2'
  if (merged.includes('vapor') || merged.includes('dryer') || merged.includes('drpr')) return 'Vapor Dryer'
  if (merged.includes('cleaner output') || merged.includes('cout')) return 'Cleaner Output'

  const fallback = ['Cleaner Input', 'Megasonics', 'Brush 1', 'Brush 2', 'Vapor Dryer', 'Cleaner Output']
  return fallback[idx] ?? (row.index || row.module || 'Cleaner')
}

function polisherSourceKind(rowLabel: string): RecipeSourceKind {
  if (rowLabel === 'Polish Recipe') return 'polishRecipe'
  if (rowLabel === 'Condition Recipe') return 'conditionRecipe'
  if (rowLabel === 'Ex Situ Condition') return 'exSituCondition'
  if (rowLabel === 'Special Ex Situ') return 'specialExSitu'
  if (rowLabel === 'ISRM Algorithm') return 'isrmAlgorithm'
  if (rowLabel === 'RTPC Recipe') return 'rtpcRecipe'
  return 'recipe'
}

function cleanerSourceKind(label: string): RecipeSourceKind {
  if (label === 'Megasonics') return 'megasonics'
  if (label === 'Brush 1') return 'brush1'
  if (label === 'Brush 2') return 'brush2'
  if (label === 'Vapor Dryer') return 'vaporDryer'
  return 'recipe'
}

function polisherTitleBase(rowLabel: string) {
  if (rowLabel === 'Polish Recipe') return 'Polish Recipe'
  if (rowLabel === 'Condition Recipe') return 'Condition Recipe'
  if (rowLabel === 'Ex Situ Condition') return 'Ex Situ Condition'
  if (rowLabel === 'Special Ex Situ') return 'Special Ex Situ'
  if (rowLabel === 'ISRM Algorithm') return 'ISRM Algorithm'
  if (rowLabel === 'RTPC Recipe') return 'RTPC Recipe'
  return rowLabel || 'Recipe'
}

function cleanerTitleBase(moduleLabel: string) {
  if (moduleLabel === 'Brush 1' || moduleLabel === 'Brush 2') return 'Brush Recipe'
  if (moduleLabel === 'Megasonics') return 'Megasonics Recipe'
  if (moduleLabel === 'Vapor Dryer') return 'Vapor Dryer Recipe'
  return 'Cleaner Recipe'
}

function emitRecipeClick(value: string, payload: Omit<JobRecipeClickPayload, 'value'>) {
  if (!props.editable && !isSelectableRecipeValue(value)) return
  const nextValue = isSelectableRecipeValue(value) ? value : props.noneLabel
  emit('value-click', { value: nextValue, ...payload })
}

function emitPolisherClick(rowLabel: string, value: string, platen: 1 | 2 | 3) {
  emitRecipeClick(value, {
    sourceKind: polisherSourceKind(rowLabel),
    titleBase: polisherTitleBase(rowLabel),
    emphasizeText: `Platen ${platen}`,
    platen,
  })
}

function emitCleanerClick(row: CleanerParsedRow, idx: number) {
  const label = cleanerModuleLabel(row, idx)
  emitRecipeClick(row.recipe, {
    sourceKind: cleanerSourceKind(label),
    titleBase: cleanerTitleBase(label),
    emphasizeText: label,
    platen: null,
  })
}
</script>

<style scoped>
.job-parsed{
  background:#d4d0c8;
  border:1px solid #a7a7a7;
  border-radius:10px;
  padding:8px;
  display:grid;
  gap:8px;
  flex:1;
  overflow-y:auto;
  overflow-x:hidden;
  min-height:0;
  font-size:12px;
}
.job-parsed-empty{
  background:#fff;
  border:1px dashed #999;
  padding:12px;
  color:#6b7280;
  font-weight:900;
}
.bar{
  background:#d4d0c8;
  border:1px solid #8d8d8d;
  padding:2px 6px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}
.bar-left{
  font-weight:900;
  color:#111;
}
.bar-right{
  display:flex;
  align-items:center;
  gap:8px;
}
.bar-label{
  font-size:11px;
  font-weight:900;
}
.recipe-box{
  width:120px;
  min-width:120px;
  min-height:18px;
  padding:1px 5px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid #7f7f7f;
  background:#fff;
  font-size:11px;
  text-align:center;
}
.recipe-box.disabled{
  background:#ece9d8;
  color:#666;
}
.missing-ref{
  background:#ffb3b3 !important;
  color:#7f0000 !important;
  pointer-events:none;
  cursor:not-allowed !important;
  text-decoration:none !important;
}
.recipe-box.clickable:hover,
.job-value-cell.clickable:hover{
  font-weight:900;
  text-decoration:underline;
  cursor:pointer;
}
.job-checkbox{
  appearance:none;
  -webkit-appearance:none;
  width:16px;
  height:16px;
  border:1px solid #333;
  position:relative;
  margin:0;
  flex:0 0 auto;
}
.job-checkbox.readonly{
  background:#e3e3e3;
  cursor:default;
}
.job-checkbox.editable{
  background:#fff;
  cursor:pointer;
}
.job-checkbox:checked::after{
  content:'';
  position:absolute;
  left:4px;
  top:1px;
  width:5px;
  height:9px;
  border:solid #000;
  border-width:0 2px 2px 0;
  transform:rotate(45deg);
}
.checkline{
  display:flex;
  align-items:center;
  gap:8px;
}
.group{
  border:1px solid #8d8d8d;
  background:#e6e2da;
}
.group-head{
  background:#d4d0c8;
  border-bottom:1px solid #8d8d8d;
  padding:4px 6px;
  font-weight:900;
}
.group-head-split{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.use-heads{
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
  font-size:11px;
}
.use-heads-label,
.use-head-item{
  font-weight:900;
}
.use-head-item .mark{
  display:inline-block;
  min-width:12px;
  text-align:center;
}
.hclu-row{
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  gap:10px;
  padding:4px 6px;
  background:#e6e2da;
}
.hclu-row-top{
  border-bottom:1px solid #c0bab0;
}
.hclu-row-bottom{
  border-top:1px solid #c0bab0;
}
.hclu-label{
  justify-self:end;
  text-align:right;
  font-weight:900;
  color:#222;
  font-size:11px;
}
.hclu-box{
  justify-self:end;
  width:120px;
  min-width:120px;
  min-height:18px;
  padding:1px 5px;
}
.tbl-wrap{
  padding:4px;
  overflow:hidden;
  background:#e6e2da;
}
.tbl-wrap.tight-tbl{
  height:220px;
  box-sizing:border-box;
}
.tight-tbl .tbl th,
.tight-tbl .tbl td{
  padding:2px 4px;
}
.tbl{
  border-collapse:collapse;
  width:max-content;
  min-width:100%;
  table-layout:fixed;
  font-size:11px;
  background:#fff;
}
.tbl th,
.tbl td{
  border:1px solid #7f7f7f;
  padding:2px 4px;
  white-space:normal;
  word-break:break-word;
}
.tbl th{
  background:#d4d0c8;
  font-weight:900;
  position:relative;
}
.tbl.polished th,
.tbl.polished td,
.cleaner-table th,
.cleaner-table td{
  text-align:center;
}
.compact-polisher .rowname,
.cleaner-module-cell{
  background:#f3f3f3;
  font-weight:900;
}
.rowname{
  font-weight:900;
  background:#f3f3f3;
}
.cell{
  background:#fff;
}
.platen2-col{
  background:rgb(57, 230, 255) !important;
}
.tbl-wrap.tight-tbl.cleaner-wrap{
  display:flex;
  align-items:flex-start;
  justify-content:flex-start;
  height:165px !important;
  min-height:165px !important;
  max-height:165px !important;
}
.cleaner-wrap{
  display:flex;
  align-items:flex-start;
  justify-content:flex-start;
  height:165px;
  min-height:165px;
  max-height:165px;
}
.cleaner-table{
  width:495px;
  min-width:495px;
}
.cleaner-table .cleaner-module-col{
  width:145px;
}
.cleaner-table .cleaner-recipe-col{
  width:350px;
}
.cleaner-table th,
.cleaner-table td{
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.cleaner-module-cell,
.cleaner-recipe-cell{
  text-align:center;
}
</style>