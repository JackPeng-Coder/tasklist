import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createList, STORE_KEY, type Item, type List, type TaskData, type TreeNode } from '../types'
import { loadTaskData } from '../storage'
import { applyMove, type MoveSpec } from '../logic/move'
import { resolveDateField } from '../logic/dates'
import welcomeJson from '../data/welcome.json'

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

function resolveRelativeDates(nodes: TreeNode[], now: Date): TreeNode[] {
  return nodes.map((n) => {
    const copy = { ...n }
    if (copy.date) copy.date = resolveDateField(copy.date, now)
    if (Array.isArray((copy as any).items)) (copy as any).items = resolveRelativeDates((copy as any).items, now)
    return copy
  })
}

export const useDataStore = defineStore('data', () => {
  const lists = ref<List[]>([])
  const currentListId = ref('')
  const recovered = ref(false)
  const undoStack = ref<List[][]>([])
  const redoStack = ref<List[][]>([])
  /** 本页最近一次实际写回 localStorage 的时间戳；跨标签页同步据此拒绝更旧的外部写入 */
  const lastSavedAt = ref(0)

  function ensureWelcomeList() {
    if (lists.value.length > 0) return
    const now = new Date()
    lists.value = [{ ...welcomeJson, items: resolveRelativeDates(welcomeJson.items as unknown as TreeNode[], now) }]
  }

  function init() {
    const { data, recovered: rec } = loadTaskData()
    recovered.value = rec
    lists.value = data.lists
    ensureWelcomeList()
    undoStack.value = []
    redoStack.value = []
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

  /** 深拷贝当前 lists（快照） */
  function snapshot(): List[] {
    return JSON.parse(JSON.stringify(lists.value))
  }

  /**
   * 统一历史记录的写入口：先记录变更前的快照，再执行 fn，最后清空 redo 栈。
   * 无实际变化的操作（move 到自身等 no-op）不入历史。
   */
  function commit(fn: () => void): void {
    const before = JSON.stringify(lists.value)
    fn()
    if (JSON.stringify(lists.value) !== before) {
      undoStack.value.push(JSON.parse(before))
      redoStack.value = []
    }
  }

  function addList(name: string, description: string) {
    commit(() => {
      const l = createList(name)
      l.description = description
      lists.value = [...lists.value, l]
      currentListId.value = l.id
    })
  }

  function renameList(id: string, name: string) {
    commit(() => {
      lists.value = lists.value.map((l) => (l.id === id ? { ...l, name } : l))
    })
  }

  function deleteList(id: string) {
    commit(() => {
      lists.value = lists.value.filter((l) => l.id !== id)
      if (currentListId.value === id) currentListId.value = lists.value[0]?.id ?? ''
    })
  }

  function addNode(parentId: string | null, node: TreeNode) {
    commit(() => {
      const list = currentList.value
      if (!list) return
      if (parentId === null) {
        lists.value = lists.value.map((l) => (l.id === list.id ? { ...l, items: [...l.items, node] } : l))
      } else {
        lists.value = lists.value.map((l) =>
          l.id === list.id ? { ...l, items: mapNodes(l.items, parentId, (n) => ({ ...(n as any), items: [...(n as any).items, node] })) } : l,
        )
      }
    })
  }

  function updateNode(nodeId: string, patch: Partial<Item>) {
    commit(() => {
      const list = currentList.value
      if (!list) return
      lists.value = lists.value.map((l) =>
        l.id === list.id ? { ...l, items: mapNodes(l.items, nodeId, (n) => ({ ...n, ...patch })) } : l,
      )
    })
  }

  function toggleDone(nodeId: string) {
    updateNode(nodeId, { done: !((findNode(currentList.value!.items, nodeId) as Item)?.done) })
  }

  function toggleGroupExpanded(nodeId: string) {
    updateNode(nodeId, { expanded: !(findNode(currentList.value!.items, nodeId) as any)?.expanded } as any)
  }

  function deleteNode(nodeId: string) {
    commit(() => {
      const list = currentList.value
      if (!list) return
      lists.value = lists.value.map((l) => (l.id === list.id ? { ...l, items: filterNodes(l.items, nodeId) } : l))
    })
  }

  function moveNode(spec: MoveSpec) {
    commit(() => {
      const { lists: out } = applyMove(lists.value, spec, Date.now())
      if (out !== lists.value) {
        lists.value = out
      }
    })
  }

  function undo() {
    const prev = undoStack.value.pop()
    if (!prev) return
    redoStack.value.push(snapshot())
    lists.value = prev
  }

  function redo() {
    const next = redoStack.value.pop()
    if (!next) return
    undoStack.value.push(snapshot())
    lists.value = next
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  /**
   * 记录本页最近一次写回的时间戳。由 App.vue 在 saveTaskData 成功后调用。
   */
  function markSaved(at: number) {
    if (at > lastSavedAt.value) lastSavedAt.value = at
  }

  /**
   * 应用另一标签页写入的整库数据（跨标签页同步）。
   * 与 init 不同：不重建欢迎列表、不清空撤销/重做栈——同步不应摧毁本页历史。
   */
  function applyExternal(incoming: List[]) {
    lists.value = incoming
    if (!lists.value.some((l) => l.id === currentListId.value)) {
      currentListId.value = lists.value[0]?.id ?? ''
    }
  }

  function refreshNow() {
    /* 状态由 computed 依赖 now()，见 Task 15 */
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== STORE_KEY) return
      const raw = e.newValue
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as TaskData
        if (parsed.version !== 1 || !Array.isArray(parsed.lists)) return
        // 旧于本页最后写回的外部数据不采纳，避免另一标签页的迟到写入把本页整体回退
        if (lastSavedAt.value > 0 && typeof parsed.savedAt === 'number' && parsed.savedAt <= lastSavedAt.value) return
        applyExternal(parsed.lists)
      } catch {
        /* 忽略非法外部写入 */
      }
    })
  }

  return { lists, currentListId, recovered, currentList, nodeCount, init, selectList, addList, renameList, deleteList, addNode, updateNode, toggleDone, toggleGroupExpanded, deleteNode, moveNode, undo, redo, canUndo, canRedo, markSaved, applyExternal, refreshNow }
})