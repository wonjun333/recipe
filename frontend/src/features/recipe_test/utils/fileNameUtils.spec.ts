import { describe, it, expect } from 'vitest'
import { stripFileExt, naturalCompare } from './fileNameUtils'

describe('stripFileExt', () => {
  it('removes matching extension', () => {
    expect(stripFileExt('myfile.cas', ['.cas'])).toBe('myfile')
  })
  it('is case-insensitive for extension', () => {
    expect(stripFileExt('myfile.CAS', ['.cas'])).toBe('myfile')
  })
  it('returns original if no match', () => {
    expect(stripFileExt('myfile.job', ['.cas'])).toBe('myfile.job')
  })
  it('returns empty string for empty input', () => {
    expect(stripFileExt('')).toBe('')
  })
  it('handles null and undefined', () => {
    expect(stripFileExt(null)).toBe('')
    expect(stripFileExt(undefined)).toBe('')
  })
  it('removes .job extension', () => {
    expect(stripFileExt('recipe_A.job', ['.job'])).toBe('recipe_A')
  })
  it('tries exts in order, uses first match', () => {
    expect(stripFileExt('file.pol', ['.cas', '.pol'])).toBe('file')
  })
})

describe('naturalCompare', () => {
  it('sorts numerically', () => {
    const arr = ['item10', 'item2', 'item1']
    const sorted = [...arr].sort(naturalCompare)
    expect(sorted).toEqual(['item1', 'item2', 'item10'])
  })
  it('returns 0 for equal strings', () => {
    expect(naturalCompare('abc', 'abc')).toBe(0)
  })
  it('sorts alphabetically when no numeric difference', () => {
    const arr = ['banana', 'apple', 'cherry']
    const sorted = [...arr].sort(naturalCompare)
    expect(sorted).toEqual(['apple', 'banana', 'cherry'])
  })
})
