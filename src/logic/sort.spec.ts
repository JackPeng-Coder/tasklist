import { createGroup, createItem, type TreeNode } from '../types'
import { groupedNodes, sortNodes } from './sort'

const NOW = new Date('2026-08-14T12:00:00').getTime()

const mk = (name: string, date?: string, time?: string, done = false): TreeNode =>
  ({ ...createItem(name), date, time, done })

describe('sortNodes', () => {
  it('按状态分组排序：逾期→未完成→已完成', () => {
    const nodes = [
      mk('已完成', undefined, undefined, true),
      mk('待办A', '2026-08-20'),
      mk('逾期', '2026-08-01'),
    ]
    const sorted = sortNodes(nodes, NOW).map((n) => n.name)
    expect(sorted).toEqual(['逾期', '待办A', '已完成'])
  })

  it('组内时间戳升序，早的在前', () => {
    const nodes = [mk('晚', '2026-08-30'), mk('早', '2026-08-10')]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['早', '晚'])
  })

  it('同时间戳按名称排序', () => {
    const nodes = [mk('b', '2026-08-20'), mk('a', '2026-08-20')]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['a', 'b'])
  })

  it('无时间的排组内最后', () => {
    const nodes = [mk('无时间'), mk('有时间', '2026-08-20')]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['有时间', '无时间'])
  })

  it('组合与事项并列参与排序', () => {
    const g = createGroup('组早'); g.items = [mk('组内早', '2026-08-05')]
    const nodes = [mk('事项晚', '2026-08-30'), g]
    expect(sortNodes(nodes, NOW).map((n) => n.name)).toEqual(['组早', '事项晚'])
  })
})

describe('groupedNodes', () => {
  it('三组分离', () => {
    const nodes = [mk('逾期', '2026-08-01'), mk('待办', '2026-08-20'), mk('完成', undefined, undefined, true)]
    const { overdue, pending, done } = groupedNodes(nodes, NOW)
    expect(overdue.map((n) => n.name)).toEqual(['逾期'])
    expect(pending.map((n) => n.name)).toEqual(['待办'])
    expect(done.map((n) => n.name)).toEqual(['完成'])
  })
})
