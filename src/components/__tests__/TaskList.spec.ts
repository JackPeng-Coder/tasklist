import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import TaskList from '../TaskList.vue'
import { useDataStore } from '../../stores/data'
import { useUiStore } from '../../stores/ui'
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

  it('组合行显示递归计算的时间 chip（最早未完成事项的时间）', () => {
    const ui = useUiStore()
    ui.now = new Date(2026, 7, 14, 12, 0).getTime()
    const s = useDataStore()
    s.init()
    const group = {
      id: 'g', name: '组合', description: '', expanded: true,
      items: [
        { id: 'x', name: '最早未完成', description: '', date: '2026-08-20', time: '09:00', done: false, createdAt: 1 },
        { id: 'y', name: '已完成', description: '', date: '2026-08-25', done: true, createdAt: 2 },
      ],
    }
    s.lists = [{ id: 'l', name: 'L', description: '', items: [group] }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    const groupChip = w.find('.row[data-drop-kind="group"] .time-chip')
    expect(groupChip.exists()).toBe(true)
    expect(groupChip.text()).toBe('8月20日 09:00')
  })
})
