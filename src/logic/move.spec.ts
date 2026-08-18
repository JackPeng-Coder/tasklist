import { createGroup, createItem, type List } from '../types'
import { applyMove } from './move'

const NOW = Date.now()

function findNode(items: List['items'], id: string): { parent: List['items'] | null; node: any; index: number } {
  for (let i = 0; i < items.length; i++) {
    const n = items[i]
    if (n.id === id) return { parent: items, node: n, index: i }
    if ((n as any).items) {
      const r = findNode((n as any).items, id)
      if (r.node) return r
    }
  }
  return { parent: null, node: null, index: -1 }
}

function makeLists(): List[] {
  const l1: List = { id: 'l1', name: '一', description: '', items: [createItem('a'), createItem('b')] }
  const l2: List = { id: 'l2', name: '二', description: '', items: [] }
  return [l1, l2]
}

describe('applyMove', () => {
  it('移动到另一列表根层', () => {
    const src = makeLists()
    const idA = src[0].items[0].id
    const { lists } = applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'list', toId: 'l2' }, NOW)
    const l2 = lists.find((l) => l.id === 'l2')!
    expect(l2.items.map((n) => n.id)).toContain(idA)
    expect(findNode(lists[0].items, idA).node).toBeNull()
  })

  it('移入组合子层', () => {
    const src = makeLists()
    const g = createGroup('g')
    src[0].items.push(g)
    const idA = src[0].items[0].id
    const { lists: out } = applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'group', toId: g.id }, NOW)
    const g2 = findNode(out[0].items, g.id).node
    expect(g2.items.map((n: any) => n.id)).toContain(idA)
  })

  it('移到事项上自动建组合并包裹两者', () => {
    const src = makeLists()
    const idA = src[0].items[0].id
    const idB = src[0].items[1].id
    const { lists, createdGroupId } = applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'item', toId: idB }, NOW)
    const g = findNode(lists[0].items, createdGroupId!).node
    expect(g).not.toBeNull()
    expect(g.name).toBe('b · a')
    expect(g.items.map((n: any) => n.id).sort()).toEqual([idA, idB].sort())
    // 融合两个事项时新建组合默认展开
    expect(g.expanded).toBe(true)
  })

  it('移动到自身无效', () => {
    const src = makeLists()
    const idA = src[0].items[0].id
    const { lists } = applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'item', toId: idA }, NOW)
    expect(lists).toBe(src)
  })

  it('移入自己的后代无效', () => {
    const src = makeLists()
    const g = createGroup('g')
    const child = createItem('child')
    g.items = [child]
    src[0].items.push(g)
    const { lists: out } = applyMove(src, { fromListId: 'l1', nodeId: g.id, toKind: 'item', toId: child.id }, NOW)
    expect(out).toBe(src)
  })

  it('未知 toId 无操作', () => {
    const src = makeLists()
    const idA = src[0].items[0].id
    expect(() => applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'item', toId: 'nonexistent' }, NOW)).not.toThrow()
    const { lists: out } = applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'item', toId: 'nonexistent' }, NOW)
    expect(findNode(out[0].items, idA).node).not.toBeNull()
  })

  it('未知 toId 组合目标无操作', () => {
    const src = makeLists()
    const idA = src[0].items[0].id
    const { lists: out } = applyMove(src, { fromListId: 'l1', nodeId: idA, toKind: 'group', toId: 'nonexistent' }, NOW)
    expect(findNode(out[0].items, idA).node).not.toBeNull()
  })

  it('拖回自己所在父组合为无操作（不改顺序）', () => {
    const src = makeLists()
    const g = createGroup('g')
    const a = createItem('a')
    const b = createItem('b')
    g.items = [a, b]
    src[0].items.push(g)
    const { lists } = applyMove(src, { fromListId: 'l1', nodeId: a.id, toKind: 'group', toId: g.id }, NOW)
    expect(lists).toBe(src)
    expect(findNode(src[0].items, a.id).index).toBe(0)
    expect(findNode(src[0].items, b.id).index).toBe(1)
  })

  it('拖回祖父组合仍生效（非原父，属真实移动）', () => {
    const src = makeLists()
    const g1 = createGroup('g1')
    const g2 = createGroup('g2')
    const a = createItem('a')
    g2.items = [a]
    g1.items = [g2]
    src[0].items.push(g1)
    const { lists: out } = applyMove(src, { fromListId: 'l1', nodeId: a.id, toKind: 'group', toId: g1.id }, NOW)
    const g1b = findNode(out[0].items, g1.id).node
    expect(g1b.items.some((n: any) => n.id === a.id)).toBe(true)
    expect(findNode(out[0].items, g2.id).node.items.length).toBe(0)
  })
})
