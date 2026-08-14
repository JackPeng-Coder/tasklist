import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createList, STORE_KEY, type Item, type List, type Settings, type TaskData, type TreeNode, type UIState } from '../types'
import { loadTaskData, saveTaskData } from '../storage'
import { applyMove, type MoveSpec } from '../logic/move'

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray((n as any).items)) {
      const r = findNode((n as any).items, id)
      if (r) return r
    }
  }
  return null
}

function mapNodes(nodes: TreeNode[], id: string, fn: (n: TreeNode) => TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) return fn(n)
    if (Array.isArray((n as any).items)) return { ...(n as any), items: mapNodes((n as any).items, id, fn) }
    return n
  })
}

function filterNodes(nodes: TreeNode[], id: string): TreeNode[] {
  const out: TreeNode[] = []
  for (const n of nodes) {
    if (n.id === id) continue
    out.push(Array.isArray((n as any).items) ? { ...(n as any), items: filterNodes((n as any).items, id) } : n)
  }
  return out
}

function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + (Array.isArray((n as any).items) ? countNodes((n as any).items) : 0), 0)
}

function makeWelcomeList(): List {
  // 占位欢迎列表：本任务的测试依赖空 items 结构；Task 18 将替换为读取 src/data/welcome.json
  return { id: 'welcome', name: '欢迎使用任务清单', description: '示例列表', items: [] }
}

export const useDataStore = defineStore('data', () => {
  const lists = ref<List[]>([])
  const currentListId = ref('')
  const recovered = ref(false)

  // 本任务暂无 src/stores/ui.ts（Task 9 新增），持久化先写入默认 settings/ui 形状；
  // Task 9/10 将把 useUiStore() 的 settings / sidebarCollapsed / expandedGroupIds 接入这里。
  const DEFAULT_SETTINGS: Settings = { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true }
  const DEFAULT_UI: UIState = { sidebarCollapsed: false, expandedGroupIds: [] }

  function persist() {
    const data: TaskData = {
      version: 1,
      lists: lists.value,
      settings: DEFAULT_SETTINGS,
      ui: DEFAULT_UI,
    }
    saveTaskData(data)
  }

  let saveTimer: number | undefined
  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = window.setTimeout(persist, 300)
  }

  function init() {
    const { data, recovered: rec } = loadTaskData()
    recovered.value = rec
    lists.value = data.lists
    if (lists.value.length === 0) {
      lists.value = [makeWelcomeList()]
      persist()
    }
    if (!lists.value.some((l) => l.id === currentListId.value)) {
      currentListId.value = lists.value[0].id
    }
  }

  function selectList(id: string) {
    if (lists.value.some((l) => l.id === id)) currentListId.value = id
  }

  const currentList = computed(() => lists.value.find((l) => l.id === currentListId.value))

  function nodeCount(listId: string): number {
    const l = lists.value.find((x) => x.id === listId)
    return l ? countNodes(l.items) : 0
  }

  function addList(name: string, description: string) {
    const l = createList(name)
    l.description = description
    lists.value.push(l)
    currentListId.value = l.id
    scheduleSave()
  }

  function renameList(id: string, name: string) {
    lists.value = lists.value.map((l) => (l.id === id ? { ...l, name } : l))
    scheduleSave()
  }

  function deleteList(id: string) {
    lists.value = lists.value.filter((l) => l.id !== id)
    if (currentListId.value === id) currentListId.value = lists.value[0]?.id ?? ''
    scheduleSave()
  }

  function addNode(parentId: string | null, node: TreeNode) {
    const list = currentList.value
    if (!list) return
    if (parentId === null) {
      lists.value = lists.value.map((l) => (l.id === list.id ? { ...l, items: [...l.items, node] } : l))
    } else {
      lists.value = lists.value.map((l) =>
        l.id === list.id ? { ...l, items: mapNodes(l.items, parentId, (n) => ({ ...(n as any), items: [...(n as any).items, node] })) } : l,
      )
    }
    scheduleSave()
  }

  function updateNode(nodeId: string, patch: Partial<Item>) {
    const list = currentList.value
    if (!list) return
    lists.value = lists.value.map((l) =>
      l.id === list.id ? { ...l, items: mapNodes(l.items, nodeId, (n) => ({ ...n, ...patch })) } : l,
    )
    scheduleSave()
  }

  function toggleDone(nodeId: string) {
    updateNode(nodeId, { done: !((findNode(currentList.value!.items, nodeId) as Item)?.done) })
  }

  function toggleGroupExpanded(nodeId: string) {
    updateNode(nodeId, { expanded: !(findNode(currentList.value!.items, nodeId) as any)?.expanded } as any)
  }

  function deleteNode(nodeId: string) {
    const list = currentList.value
    if (!list) return
    lists.value = lists.value.map((l) => (l.id === list.id ? { ...l, items: filterNodes(l.items, nodeId) } : l))
    scheduleSave()
  }

  function moveNode(spec: MoveSpec) {
    const { lists: out } = applyMove(lists.value, spec, Date.now())
    if (out !== lists.value) {
      lists.value = out
      scheduleSave()
    }
  }

  function refreshNow() {
    /* 状态由 computed 依赖 now()，见 Task 15 */
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORE_KEY) init()
    })
  }

  return { lists, currentListId, recovered, currentList, nodeCount, init, selectList, addList, renameList, deleteList, addNode, updateNode, toggleDone, toggleGroupExpanded, deleteNode, moveNode, refreshNow }
})
