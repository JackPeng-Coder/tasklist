import type { Group, Item, List, NodeStatus, TreeNode } from '../types'

export function isGroup(node: TreeNode): node is Group {
  return Array.isArray((node as Group).items)
}

export function itemTimestamp(item: Item): number {
  if (!item.date) return Infinity
  const t = item.time ? `${item.date}T${item.time}` : `${item.date}T00:00`
  const ms = new Date(t).getTime()
  return Number.isNaN(ms) ? Infinity : ms
}

function collectItems(nodes: TreeNode[]): Item[] {
  const out: Item[] = []
  for (const n of nodes) {
    if (isGroup(n)) out.push(...collectItems(n.items))
    else out.push(n)
  }
  return out
}

export function groupStatus(group: Group, now: number): NodeStatus {
  const items = collectItems(group.items)
  if (items.length === 0) return 'done'
  const hasOverdue = items.some((i) => !i.done && itemTimestamp(i) < now)
  if (hasOverdue) return 'overdue'
  if (items.every((i) => i.done)) return 'done'
  return 'pending'
}

export function groupTimestamp(group: Group, now: number): number {
  const items = collectItems(group.items)
  if (items.length === 0) return Infinity
  const status = groupStatus(group, now)
  if (status === 'overdue' || status === 'pending') {
    return Math.min(...items.filter((i) => !i.done).map(itemTimestamp))
  }
  const ts = items.map(itemTimestamp).filter((t) => t !== Infinity)
  return ts.length > 0 ? Math.max(...ts) : Infinity
}

export function nodeStatus(node: TreeNode, now: number): NodeStatus {
  return isGroup(node) ? groupStatus(node, now) : node.done ? 'done' : itemTimestamp(node) < now ? 'overdue' : 'pending'
}

export function nodeTimestamp(node: TreeNode, now: number): number {
  return isGroup(node) ? groupTimestamp(node, now) : itemTimestamp(node)
}

export function listStatus(list: List, now: number): NodeStatus {
  if (list.items.length === 0) return 'done'
  if (list.items.some((n) => nodeStatus(n, now) === 'overdue')) return 'overdue'
  if (list.items.every((n) => nodeStatus(n, now) === 'done')) return 'done'
  return 'pending'
}
