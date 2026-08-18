export type NodeStatus = 'overdue' | 'pending' | 'done'
export type Theme = 'light' | 'dark'

export interface Item {
  id: string
  name: string
  description: string
  date?: string
  time?: string
  done: boolean
  createdAt: number
}

export interface Group {
  id: string
  name: string
  description: string
  date?: string
  time?: string
  expanded: boolean
  items: TreeNode[]
}

export type TreeNode = Item | Group

export interface List {
  id: string
  name: string
  description: string
  items: TreeNode[]
}

export interface Settings {
  theme: Theme
  fontSize: number
  lang: string
  showDescription: boolean
}

export interface UIState {
  sidebarCollapsed: boolean
  expandedGroupIds: string[]
}

export interface TaskData {
  version: 1
  lists: List[]
  settings: Settings
  ui: UIState
  /** 最近一次写入的时间戳，跨标签页同步时用于判定新旧，旧数据不覆盖本地 */
  savedAt?: number
}

export const STORE_KEY = 'tasklist:v1'
export const BACKUP_KEY = 'tasklist:backup'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createItem(name: string): Item {
  return { id: uid(), name, description: '', done: false, createdAt: Date.now() }
}

export function createGroup(name: string): Group {
  return { id: uid(), name, description: '', expanded: false, items: [] }
}

export function createList(name: string): List {
  return { id: uid(), name, description: '', items: [] }
}

export function makeDefaultTaskData(): TaskData {
  return {
    version: 1,
    lists: [],
    settings: { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true },
    ui: { sidebarCollapsed: false, expandedGroupIds: [] },
  }
}
