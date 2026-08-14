import type { TaskData } from '../types'
import { validateTaskData } from './merge'

export function buildExportBlob(data: TaskData): Blob {
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

export function parseImportText(text: string): { ok: true; data: TaskData } | { ok: false; error: string } {
  try {
    return validateTaskData(JSON.parse(text))
  } catch {
    return { ok: false, error: 'invalid json' }
  }
}
