import { setActivePinia, createPinia } from 'pinia'
import { watch } from 'vue'
import { useDataStore } from './data'
import { saveTaskData } from '../storage'
import { STORE_KEY, type List, type Settings, type UIState } from '../types'

describe('data store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('init 空数据创建欢迎列表并选中', () => {
    const s = useDataStore()
    s.init()
    expect(s.lists.length).toBe(1)
    expect(s.currentListId).toBe(s.lists[0].id)
  })

  it('addNode 加入当前列表根层', () => {
    const s = useDataStore()
    s.init()
    const before = s.lists[0].items.length
    s.addNode(null, { id: 'n1', name: 'x', description: '', done: false, createdAt: 1 })
    expect(s.lists[0].items.length).toBe(before + 1)
  })

  it('toggleDone 递归查找并翻转', () => {
    const s = useDataStore()
    s.init()
    s.addNode(null, { id: 'g', name: 'g', description: '', expanded: true, items: [{ id: 'c', name: 'c', description: '', done: false, createdAt: 1 }] })
    s.toggleDone('c')
    // 欢迎列表（welcome.json）已有真实内容，items[0] 不再是新加节点，按 id 查找
    const g = s.lists[0].items.find((n) => n.id === 'g') as any
    expect(g.items[0].done).toBe(true)
  })

  it('deleteNode 递归删除', () => {
    const s = useDataStore()
    s.init()
    s.addNode(null, { id: 'g', name: 'g', description: '', expanded: true, items: [{ id: 'c', name: 'c', description: '', done: false, createdAt: 1 }] })
    s.deleteNode('c')
    const g = s.lists[0].items.find((n) => n.id === 'g') as any
    expect(g.items.length).toBe(0)
  })

  it('写入持久化并可从存储读回', async () => {
    const s = useDataStore()
    s.init()
    // Task 18：持久化唯一入口是 App.vue 的统一 watch（store 内已无 scheduleSave）；
    // 此处按 App.vue 的形态模拟该路径：深度 watch 变更 → 防抖 300ms 后 saveTaskData。
    const settings: Settings = { theme: 'light', fontSize: 16, lang: 'zh', showDescription: true }
    const ui: UIState = { sidebarCollapsed: false, expandedGroupIds: [] }
    let timer: number | undefined
    const stop = watch(
      () => [s.lists, s.currentListId],
      () => {
        clearTimeout(timer)
        timer = window.setTimeout(() => saveTaskData({ version: 1, lists: s.lists, settings, ui }), 300)
      },
      { deep: true },
    )
    s.addNode(null, { id: 'n1', name: 'x', description: '', done: false, createdAt: 1 })
    await new Promise((r) => setTimeout(r, 400))
    expect(localStorage.getItem(STORE_KEY)).toContain('"n1"')
    stop()
  })

  it('删除当前列表后切换到其他列表', () => {
    const s = useDataStore()
    s.init()
    const l1 = s.lists[0]
    const l2: List = { id: 'l2', name: 'two', description: '', items: [] }
    s.lists.push(l2)
    s.selectList(l2.id)
    s.deleteList(l1.id)
    expect(s.currentListId).toBe('l2')
  })
})
