type SaveAsRequest = {
  sourceEqpId: string
  sourceDir: string
  sourceName: string
  targetEqpId: string
  targetDir: string
  targetName: string
}

type RenameRequest = {
  eqpId: string
  remoteDir: string
  sourceName: string
  targetName: string
}

type DeleteRequest = {
  eqpId: string
  remoteDir: string
  filenames: string[]
}

type TransferItem = {
  sourceEqpId: string
  remoteDir: string
  filename: string
}

type TransferRequest = {
  items: TransferItem[]
  targetEqpIds: string[]
  targetDir: string
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export const recipeFileOpsApi = {
  saveAs(body: SaveAsRequest) {
    return http('/api/recipe-file-ops/save-as', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  rename(body: RenameRequest) {
    return http('/api/recipe-file-ops/rename', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  remove(body: DeleteRequest) {
    return http('/api/recipe-file-ops/delete', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  transfer(body: TransferRequest) {
    return http('/api/recipe-file-ops/transfer', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}