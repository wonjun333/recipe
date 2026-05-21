export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, ['ko-KR', 'en-US'], {
    numeric: true,
    sensitivity: 'base',
    ignorePunctuation: true,
  })
}

export function stripFileExt(name: unknown, exts: string[] = []): string {
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
