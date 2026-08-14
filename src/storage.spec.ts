import { STORE_KEY, BACKUP_KEY, type TaskData } from './types'
import { loadTaskData, saveTaskData, replaceAllTaskData } from './storage'

const data: TaskData = {
  version: 1,
  lists: [{ id: 'l1', name: 'A', description: '', items: [] }],
  settings: { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true },
  ui: { sidebarCollapsed: false, expandedGroupIds: [] },
}

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('保存后可读回', () => {
    saveTaskData(data)
    const { data: loaded, recovered } = loadTaskData()
    expect(loaded.lists[0].name).toBe('A')
    expect(recovered).toBe(false)
  })

  it('数据损坏时备份并返回默认数据', () => {
    localStorage.setItem(STORE_KEY, '{broken json')
    const { data: loaded, recovered } = loadTaskData()
    expect(recovered).toBe(true)
    expect(loaded.lists).toEqual([])
    expect(localStorage.getItem(BACKUP_KEY)).toContain('broken')
  })

  it('版本不符时视为损坏', () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 999, lists: [] }))
    const { recovered } = loadTaskData()
    expect(recovered).toBe(true)
  })

  it('replaceAllTaskData 整体覆盖', () => {
    saveTaskData(data)
    const other = { ...data, lists: [{ id: 'l2', name: 'B', description: '', items: [] }] }
    replaceAllTaskData(other)
    expect(loadTaskData().data.lists[0].name).toBe('B')
  })
})
