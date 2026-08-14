import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import TaskList from '../TaskList.vue'
import { useDataStore } from '../../stores/data'
import i18n from '../../i18n'

describe('TaskList', () => {
  let pinia: Pinia
  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('渲染三类分组标题与行', () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [
        { id: 'a', name: '逾期项', description: '', date: '2026-01-01', done: false, createdAt: 1 },
        { id: 'b', name: '待办', description: '', done: false, createdAt: 2 },
        { id: 'c', name: '完成项', description: '', done: true, createdAt: 3 },
      ],
    }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    expect(w.text()).toContain('逾期项')
    expect(w.text()).toContain('待办')
    expect(w.text()).toContain('完成项')
  })

  it('点击行切换完成状态', async () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [{ id: 'a', name: '任务', description: '', done: false, createdAt: 1 }],
    }]
    s.currentListId = 'l'
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    await w.find('[data-test="row"]').trigger('click')
    expect((s.lists[0].items[0] as any).done).toBe(true)
  })
})
