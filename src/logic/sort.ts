import type { NodeStatus, TreeNode } from '../types'
import { nodeStatus, nodeTimestamp } from './status'

const STATUS_ORDER: Record<NodeStatus, number> = { overdue: 0, pending: 1, done: 2 }

function compare(a: TreeNode, b: TreeNode, now: number): number {
  const sa = STATUS_ORDER[nodeStatus(a, now)]
  const sb = STATUS_ORDER[nodeStatus(b, now)]
  if (sa !== sb) return sa - sb
  const ta = nodeTimestamp(a, now)
  const tb = nodeTimestamp(b, now)
  if (ta !== tb) return ta - tb
  return a.name.localeCompare(b.name, 'zh-Hans-CN')
}

export function sortNodes(nodes: TreeNode[], now: number): TreeNode[] {
  return [...nodes].sort((a, b) => compare(a, b, now))
}

export function groupedNodes(nodes: TreeNode[], now: number): { overdue: TreeNode[]; pending: TreeNode[]; done: TreeNode[] } {
  const sorted = sortNodes(nodes, now)
  return {
    overdue: sorted.filter((n) => nodeStatus(n, now) === 'overdue'),
    pending: sorted.filter((n) => nodeStatus(n, now) === 'pending'),
    done: sorted.filter((n) => nodeStatus(n, now) === 'done'),
  }
}
