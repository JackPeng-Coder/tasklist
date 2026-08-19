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
    i18n.global.locale.value = 'zh'
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

  it('组合行显示递归计算的时间 chip（最早未完成事项的时间，仅时间不带日期）', () => {
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
    expect(groupChip.text()).toBe('09:00')
  })

  it('事项仅指定日期（无时间）时右侧不显示时间 chip', () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [{ id: 'a', name: '仅日期', description: '', date: '2026-08-20', done: false, createdAt: 1 }],
    }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    expect(w.find('.row[data-drop-kind="item"][data-drop-id="a"] .time-chip').exists()).toBe(false)
  })

  it('事项有日期和时间时右侧只显示时间（不带日期）', () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [{ id: 'a', name: '有时间', description: '', date: '2026-08-20', time: '14:30', done: false, createdAt: 1 }],
    }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    const chip = w.find('.row[data-drop-kind="item"][data-drop-id="a"] .time-chip')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toBe('14:30')
  })

  it('组合仅含只有日期无时间的事项时右侧不显示时间 chip', () => {
    const ui = useUiStore()
    ui.now = new Date(2026, 7, 14, 12, 0).getTime()
    const s = useDataStore()
    s.init()
    const group = {
      id: 'g', name: '组合', description: '', expanded: true,
      items: [
        { id: 'x', name: '仅日期', description: '', date: '2026-08-20', done: false, createdAt: 1 },
      ],
    }
    s.lists = [{ id: 'l', name: 'L', description: '', items: [group] }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    expect(w.find('.row[data-drop-kind="group"] .time-chip').exists()).toBe(false)
  })

  it('组合的时间 chip 位于已完成计数（group-meta）右侧', () => {
    const ui = useUiStore()
    ui.now = new Date(2026, 7, 14, 12, 0).getTime()
    const s = useDataStore()
    s.init()
    const group = {
      id: 'g', name: '组合', description: '', expanded: true,
      items: [
        { id: 'x', name: '子事项', description: '', date: '2026-08-20', time: '09:00', done: false, createdAt: 1 },
      ],
    }
    s.lists = [{ id: 'l', name: 'L', description: '', items: [group] }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    const rowHtml = w.find('.row[data-drop-kind="group"]').html()
    expect(rowHtml.indexOf('time-chip')).toBeGreaterThan(rowHtml.indexOf('group-meta'))
  })

  it('组合按递归时间显示日期分隔（有时间的组合不归入无时间）', () => {
    const ui = useUiStore()
    ui.now = new Date(2026, 7, 14, 12, 0).getTime()
    const s = useDataStore()
    s.init()
    const group = {
      id: 'g', name: '组合', description: '', expanded: true,
      items: [
        { id: 'x', name: '子事项', description: '', date: '2026-08-15', time: '09:00', done: false, createdAt: 1 },
      ],
    }
    s.lists = [{ id: 'l', name: 'L', description: '', items: [group] }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    // 组合的时间是明天 → 分隔符应为「明天」而非「无时间」
    expect(w.text()).toContain('明天')
    expect(w.text()).not.toContain('无时间')
  })

  it('已完成事项仍是有效的合并目标（data-drop-kind="item"）', () => {
    const s = useDataStore()
    s.init()
    s.lists = [{
      id: 'l', name: 'L', description: '',
      items: [{ id: 'd', name: '已完成', description: '', date: '2026-01-01', done: true, createdAt: 1 }],
    }]
    const w = mount(TaskList, { props: { nodes: s.lists[0].items as any, depth: 0, parentId: null }, global: { plugins: [pinia, i18n] } })
    const row = w.find('.row[data-drop-id="d"]')
    expect(row.attributes('data-drop-kind')).toBe('item')
  })
})
