import type { TaskData, TreeNode } from '../types'
import { mergeTaskData, validateTaskData } from './merge'

const base: TaskData = {
  version: 1,
  lists: [
    { id: 'l1', name: '本地列表', description: '', items: [] },
    { id: 'l2', name: '仅本地', description: '', items: [] },
  ],
  settings: { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true },
  ui: { sidebarCollapsed: false, expandedGroupIds: [] },
}

const incoming = (): TaskData => ({
  version: 1,
  lists: [
    { id: 'l1', name: '导入同名', description: '', items: [] },
    { id: 'l3', name: '仅导入', description: '', items: [] },
  ],
  settings: { theme: 'dark', fontSize: 18, lang: 'en', showDescription: false },
  ui: { sidebarCollapsed: true, expandedGroupIds: ['g1'] },
})

describe('validateTaskData', () => {
  it('合法数据通过', () => {
    expect(validateTaskData(base).ok).toBe(true)
  })
  it('version 错误拒绝', () => {
    expect(validateTaskData({ ...base, version: 2 }).ok).toBe(false)
  })
  it('缺字段拒绝', () => {
    const bad = JSON.parse(JSON.stringify(base)) as TaskData
    delete (bad.lists[0] as any).name
    expect(validateTaskData(bad).ok).toBe(false)
  })
  it('非法嵌套类型拒绝', () => {
    const bad = JSON.parse(JSON.stringify(base)) as TaskData
    bad.lists[0].items = [{ id: 'x', name: 'y', description: '' } as TreeNode]
    expect(validateTaskData(bad).ok).toBe(false)
  })
})

describe('mergeTaskData', () => {
  it('同 ID 覆盖，其余保留', () => {
    const merged = mergeTaskData(base, incoming())
    expect(merged.lists.map((l) => l.id)).toEqual(['l1', 'l2', 'l3'])
    expect(merged.lists.find((l) => l.id === 'l1')!.name).toBe('导入同名')
  })
  it('设置与 ui 以导入方为准', () => {
    const merged = mergeTaskData(base, incoming())
    expect(merged.settings.theme).toBe('dark')
    expect(merged.ui.sidebarCollapsed).toBe(true)
  })
})
