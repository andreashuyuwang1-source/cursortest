import type { PersistedAppDataV1 } from './types'

const STORAGE_KEY = 'officeChoreApp:v1'

export function loadAppData(): PersistedAppDataV1 | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as PersistedAppDataV1
    if (!parsed || parsed.version !== 1) return undefined
    if (!Array.isArray(parsed.people) || !Array.isArray(parsed.chores)) return undefined
    return parsed
  } catch {
    return undefined
  }
}

export function saveAppData(data: PersistedAppDataV1): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportAppData(data: PersistedAppDataV1): string {
  return JSON.stringify(data, null, 2)
}

export function importAppData(rawJson: string): PersistedAppDataV1 {
  const parsed = JSON.parse(rawJson) as PersistedAppDataV1
  if (!parsed || parsed.version !== 1) throw new Error('Unsupported data version')
  if (!Array.isArray(parsed.people) || !Array.isArray(parsed.chores)) throw new Error('Invalid data shape')
  return parsed
}

