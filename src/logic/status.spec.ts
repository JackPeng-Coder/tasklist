import { createGroup, createItem, type Group, type Item } from '../types'
import { groupStatus, groupTimestamp, isGroup, itemTimestamp, listStatus, nodeStatus, nodeTimestamp } from './status'

const NOW = new Date('2026-08-14T12:00:00').getTime()

const it1: Item = { id: '1', name: 'a', description: '', done: false, createdAt: 1 }
const doneItem: Item = { id: '2', name: 'b', description: '', done: true, createdAt: 2 }
const dated: Item = { id: '3', name: 'c', description: '', date: '2026-08-20', done: false, createdAt: 3 }
const timed: Item = { id: '4', name: 'd', description: '', date: '2026-08-20', time: '18:00', done: false, createdAt: 4 }

describe('itemTimestamp', () => {
  it('无日期为正无穷', () => { expect(itemTimestamp(it1)).toBe(Infinity) })
  it('有日期无时间为当日零点', () => {
    expect(itemTimestamp(dated)).toBe(new Date('2026-08-20T00:00').getTime())
  })
  it('有日期有时间按实际时间', () => {
    expect(itemTimestamp(timed)).toBe(new Date('2026-08-20T18:00').getTime())
  })
})

describe('group 状态', () => {
  it('空组合默认为已完成', () => {
    const g = createGroup('g'); g.items = []
    expect(groupStatus(g, NOW)).toBe('done')
  })
  it('含逾期子孙为已逾期', () => {
    const g = createGroup('g')
    const past: Item = { ...dated, date: '2026-08-01', id: 'x' }
    g.items = [it1, past]
    expect(groupStatus(g, NOW)).toBe('overdue')
  })
  it('全部完成则为已完成（含嵌套）', () => {
    const inner = createGroup('inner'); inner.items = [doneItem, { ...doneItem, id: 'y' }]
    const outer = createGroup('outer'); outer.items = [inner, { ...doneItem, id: 'z' }]
    expect(groupStatus(outer, NOW)).toBe('done')
  })
  it('部分完成未逾期为未完成', () => {
    const g = createGroup('g'); g.items = [doneItem, it1]
    expect(groupStatus(g, NOW)).toBe('pending')
  })
})

describe('group 时间戳', () => {
  it('未完成子孙取最小时间戳', () => {
    const g = createGroup('g'); g.items = [timed, dated]
    expect(groupTimestamp(g, NOW)).toBe(itemTimestamp(dated))
  })
  it('全部完成取已完成中最大时间戳', () => {
    const g = createGroup('g')
    g.items = [{ ...doneItem, id: 'a', date: '2026-08-10' }, { ...doneItem, id: 'b', date: '2026-08-15' }]
    expect(groupTimestamp(g, NOW)).toBe(itemTimestamp({ ...doneItem, date: '2026-08-15' }))
  })
  it('已完成但全部无时间则正无穷', () => {
    const g = createGroup('g'); g.items = [doneItem, { ...doneItem, id: 'y' }]
    expect(groupTimestamp(g, NOW)).toBe(Infinity)
  })
  it('空组合为正无穷', () => {
    const g = createGroup('g')
    expect(groupTimestamp(g, NOW)).toBe(Infinity)
  })
})

describe('nodeStatus / nodeTimestamp / isGroup', () => {
  it('isGroup 区分类型', () => {
    expect(isGroup(createGroup('g'))).toBe(true)
    expect(isGroup(createItem('i'))).toBe(false)
  })
  it('nodeStatus 委托正确', () => {
    expect(nodeStatus(dated, NOW)).toBe('pending')
    expect(nodeStatus({ ...dated, date: '2026-08-01' }, NOW)).toBe('overdue')
    expect(nodeStatus(doneItem, NOW)).toBe('done')
  })
  it('nodeTimestamp 对事项等于 itemTimestamp', () => {
    expect(nodeTimestamp(dated, NOW)).toBe(itemTimestamp(dated))
  })
})

describe('listStatus', () => {
  it('listStatus 由列表状态推断', () => {
    expect(listStatus({ id: 'l', name: '', description: '', items: [dated] }, NOW)).toBe('pending')
    expect(listStatus({ id: 'l', name: '', description: '', items: [{ ...dated, date: '2026-08-01' }] }, NOW)).toBe('overdue')
    expect(listStatus({ id: 'l', name: '', description: '', items: [doneItem] }, NOW)).toBe('done')
    expect(listStatus({ id: 'l', name: '', description: '', items: [] }, NOW)).toBe('done')
  })
})
