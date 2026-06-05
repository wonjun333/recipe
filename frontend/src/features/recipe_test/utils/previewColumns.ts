import type { RecipeDetail } from '../api/recipeTestApi'

const POL_ZONE_STATE_COLUMNS = new Set([
  'RR State',
  ...Array.from({ length: 11 }, (_, idx) => `Z${idx + 1} State`),
])

function isNoneValue(value: unknown): boolean {
  return String(value ?? '').trim().toLowerCase() === '(none)'
}

function shouldHideAllNonePolZoneColumn(recipe: RecipeDetail, column: string): boolean {
  if (!POL_ZONE_STATE_COLUMNS.has(column)) return false
  if (!recipe.rows.length) return false
  return recipe.rows.every(row => isNoneValue(row[column]))
}

export function visiblePreviewColumns(recipe: RecipeDetail | null | undefined): string[] {
  if (!recipe) return []
  return (recipe.columns ?? []).filter(column => {
    if (column === '#' || column === '__ui__') return false
    if (shouldHideAllNonePolZoneColumn(recipe, column)) return false
    return true
  })
}
