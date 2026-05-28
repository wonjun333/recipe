export interface RecipeRow  { item: string; unit: string; data: string }
export interface RecipeFile { name: string; modifiedAt: string; size: string }
export interface EqpItem    { line: string; team: string; eqpId: string }
export interface EqpOptions { items: EqpItem[]; lineOptions: string[]; teamOptions: string[]; eqpOptions: string[] }
export interface RecipeContent { name: string; rows: RecipeRow[] }

const BASE = '/api/ebara'

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export const ebaraApi = {
  getEqpOptions: () =>
    http<EqpOptions>(`${BASE}/eqp-options`),

  getFiles: (eqpId: string) =>
    http<RecipeFile[]>(`${BASE}/files?eqpId=${encodeURIComponent(eqpId)}`),

  getRecipe: (eqpId: string, name: string) =>
    http<RecipeContent>(`${BASE}/recipe?eqpId=${encodeURIComponent(eqpId)}&name=${encodeURIComponent(name)}`),

  saveRecipe: (eqpId: string, name: string, rows: RecipeRow[]) =>
    http<{ ok: boolean }>(`${BASE}/recipe/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eqpId, name, rows }),
    }),

  renameRecipe: (eqpId: string, oldName: string, newName: string) =>
    http<{ ok: boolean; newName: string }>(`${BASE}/recipe/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eqpId, oldName, newName }),
    }),
}
