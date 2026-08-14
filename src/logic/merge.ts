import type { Group, Item, List, Settings, TaskData, TreeNode } from '../types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isValidItem(v: unknown): v is Item {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    typeof v.done === 'boolean' &&
    typeof v.createdAt === 'number' &&
    (v.date === undefined || typeof v.date === 'string') &&
    (v.time === undefined || typeof v.time === 'string')
  )
}

function isValidGroup(v: unknown): v is Group {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    typeof v.expanded === 'boolean' &&
    Array.isArray(v.items) &&
    v.items.every(isValidNode)
  )
}

function isValidNode(v: unknown): v is TreeNode {
  return isValidItem(v) || isValidGroup(v)
}

function isValidList(v: unknown): v is List {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    Array.isArray(v.items) &&
    v.items.every(isValidNode)
  )
}

function isValidSettings(v: unknown): v is Settings {
  return (
    isRecord(v) &&
    (v.theme === 'light' || v.theme === 'dark') &&
    typeof v.fontSize === 'number' &&
    typeof v.lang === 'string' &&
    typeof v.showDescription === 'boolean'
  )
}

export function validateTaskData(input: unknown): { ok: true; data: TaskData } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: 'not an object' }
  if (input.version !== 1) return { ok: false, error: 'unsupported version' }
  if (!Array.isArray(input.lists) || !input.lists.every(isValidList)) return { ok: false, error: 'invalid lists' }
  if (!isValidSettings(input.settings)) return { ok: false, error: 'invalid settings' }
  if (!isRecord(input.ui) || typeof (input.ui as any).sidebarCollapsed !== 'boolean' || !Array.isArray((input.ui as any).expandedGroupIds)) {
    return { ok: false, error: 'invalid ui' }
  }
  return { ok: true, data: input as unknown as TaskData }
}

export function mergeTaskData(local: TaskData, incoming: TaskData): TaskData {
  const map = new Map(local.lists.map((l) => [l.id, l]))
  for (const list of incoming.lists) map.set(list.id, list)
  return { version: 1, lists: [...map.values()], settings: incoming.settings, ui: incoming.ui }
}
