import { createGroup, type List, type TreeNode } from '../types'

export interface MoveSpec {
  fromListId: string
  nodeId: string
  toKind: 'list' | 'group' | 'item'
  toId: string
}

export interface MoveResult {
  lists: List[]
  createdGroupId?: string
}

function removeNode(nodes: TreeNode[], nodeId: string): { removed: TreeNode | null; rest: TreeNode[] } {
  const idx = nodes.findIndex((n) => n.id === nodeId)
  if (idx >= 0) return { removed: nodes[idx], rest: nodes.filter((_, i) => i !== idx) }
  let removed: TreeNode | null = null
  let rest = nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (Array.isArray((n as any).items)) {
      const r = removeNode((n as any).items, nodeId)
      if (r.removed) {
        removed = r.removed
        rest = nodes.map((x, j) => (j === i ? { ...(x as any), items: r.rest } : x))
        break
      }
    }
  }
  return { removed, rest }
}

function isDescendant(list: List, ancestorId: string, nodeId: string): boolean {
  const contains = (nodes: TreeNode[]): boolean => {
    for (const n of nodes) {
      if (n.id === nodeId) return true
      if (Array.isArray((n as any).items) && contains((n as any).items)) return true
    }
    return false
  }
  const walk = (nodes: TreeNode[]): boolean => {
    for (const n of nodes) {
      if (n.id === ancestorId) return Array.isArray((n as any).items) && contains((n as any).items)
      if (Array.isArray((n as any).items) && walk((n as any).items)) return true
    }
    return false
  }
  return walk(list.items)
}

function insertAt(nodes: TreeNode[], targetId: string, item: TreeNode, mode: 'after' | 'root'): TreeNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx >= 0) {
    const out = [...nodes]
    out.splice(idx + (mode === 'after' ? 1 : 0), 0, item)
    return out
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (Array.isArray((n as any).items)) {
      const r = insertAt((n as any).items, targetId, item, mode)
      if (r !== (n as any).items) return nodes.map((x, j) => (j === i ? { ...(x as any), items: r } : x))
    }
  }
  return nodes
}

export function applyMove(lists: List[], spec: MoveSpec, now: number): MoveResult {
  const srcList = lists.find((l) => l.id === spec.fromListId)
  if (!srcList) return { lists }
  if (spec.toKind === 'item' && spec.nodeId === spec.toId) return { lists }
  if (spec.toKind === 'group' && spec.nodeId === spec.toId) return { lists }
  if (isDescendant(srcList, spec.nodeId, spec.toId)) return { lists }

  const { removed, rest } = removeNode(srcList.items, spec.nodeId)
  if (!removed) return { lists }

  const tmp = lists.map((l) => (l.id === srcList.id ? { ...l, items: rest } : l))

  if (spec.toKind === 'item') {
    const listOfTarget = tmp.find((l) => containsId(l, spec.toId))!
    const group = createGroup(`${(findNodeText(listOfTarget, spec.toId) ?? '')} · ${removed.name}`)
    group.items = [removed, findNodeRef(listOfTarget, spec.toId)!]
    return {
      lists: tmp.map((l) =>
        l.id === listOfTarget.id ? { ...l, items: replaceNode(l.items, spec.toId, group) } : l,
      ),
      createdGroupId: group.id,
    }
  }

  if (spec.toKind === 'group') {
    const targetList = tmp.find((l) => containsId(l, spec.toId))!
    return {
      lists: tmp.map((l) =>
        l.id === targetList.id ? { ...l, items: appendIntoGroup(l.items, spec.toId, removed) } : l,
      ),
    }
  }

  const destList = tmp.find((l) => l.id === spec.toId)
  if (!destList) return { lists: tmp }
  return { lists: tmp.map((l) => (l.id === destList.id ? { ...l, items: [...l.items, removed] } : l)) }
}

function findNodeText(list: List, id: string): string | null {
  const r = findRef(list.items, id)
  return r ? r.name : null
}

function findNodeRef(list: List, id: string): TreeNode | null {
  return findRef(list.items, id)
}

function findRef(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray((n as any).items)) {
      const r = findRef((n as any).items, id)
      if (r) return r
    }
  }
  return null
}

function containsId(list: List, id: string): boolean {
  return findRef(list.items, id) !== null
}

function replaceNode(nodes: TreeNode[], targetId: string, item: TreeNode): TreeNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx >= 0) return nodes.map((n, i) => (i === idx ? item : n))
  return nodes.map((n) =>
    Array.isArray((n as any).items) ? { ...(n as any), items: replaceNode((n as any).items, targetId, item) } : n,
  )
}

function appendIntoGroup(nodes: TreeNode[], targetId: string, item: TreeNode): TreeNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx >= 0) return nodes.map((n, i) => (i === idx ? { ...(n as any), items: [...(n as any).items, item] } : n))
  return nodes.map((n) =>
    Array.isArray((n as any).items) ? { ...(n as any), items: appendIntoGroup((n as any).items, targetId, item) } : n,
  )
}
