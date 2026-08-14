import { BACKUP_KEY, STORE_KEY, makeDefaultTaskData, type TaskData } from './types'

export function loadTaskData(): { data: TaskData; recovered: boolean } {
  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) return { data: makeDefaultTaskData(), recovered: false }
  try {
    const parsed = JSON.parse(raw) as TaskData
    if (parsed.version !== 1 || !Array.isArray(parsed.lists)) throw new Error('bad version')
    return { data: parsed, recovered: false }
  } catch {
    try {
      localStorage.setItem(BACKUP_KEY, raw)
    } catch {
      /* backup 空间不足时忽略 */
    }
    return { data: makeDefaultTaskData(), recovered: true }
  }
}

export function saveTaskData(data: TaskData): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(data))
}

export function replaceAllTaskData(data: TaskData): void {
  saveTaskData(data)
}
