import { describe, expect, it } from 'vitest'
import type { RecipeDetail } from '../api/recipeTestApi'
import { visiblePreviewColumns } from './previewColumns'

function recipe(columns: string[], rows: Array<Record<string, string>>): RecipeDetail {
  return {
    id: 'r1',
    name: 'test.pol',
    sourceKind: 'polishRecipe',
    columns,
    rows,
  }
}

describe('visiblePreviewColumns', () => {
  it('hides POL zone columns when every row is (None)', () => {
    const columns = visiblePreviewColumns(recipe(
      ['Description', 'RR State', 'Z1 State', 'Z2 State', 'Head Sweep'],
      [
        { Description: 'Step 1', 'RR State': '(None)', 'Z1 State': '(None)', 'Z2 State': '1.0 psi', 'Head Sweep': '(None)' },
        { Description: 'Step 2', 'RR State': ' (none) ', 'Z1 State': '(None)', 'Z2 State': '(None)', 'Head Sweep': '(None)' },
      ],
    ))

    expect(columns).toEqual(['Description', 'Z2 State', 'Head Sweep'])
  })

  it('keeps non-display and data columns according to their own rules', () => {
    const columns = visiblePreviewColumns(recipe(
      ['#', '__ui__', 'Description', 'Z11 State'],
      [
        { Description: 'Step 1', 'Z11 State': '(None)' },
      ],
    ))

    expect(columns).toEqual(['Description'])
  })
})
