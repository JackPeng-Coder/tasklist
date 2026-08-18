import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import Sidebar from '../Sidebar.vue'
import { useDataStore } from '../../stores/data'
import { useUiStore } from '../../stores/ui'
import i18n from '../../i18n'

describe('Sidebar 窄屏自动收起', () => {
  let pinia: Pinia
  beforeEach(() => {
    localStorage.clear()
    i18n.global.locale.value = 'zh'
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function stubMatchMedia(matches: boolean) {
    window.matchMedia = (() => ({ matches, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  }

  function mountSidebar() {
    const s = useDataStore()
    s.init()
    s.lists = [
      { id: 'a', name: '列表A', description: '', items: [] },
      { id: 'b', name: '列表B', description: '', items: [] },
    ]
    s.currentListId = 'a'
    const ui = useUiStore()
    ui.sidebarCollapsed = false
    const w = mount(Sidebar, { global: { plugins: [pinia, i18n] } })
    return { w, ui, s }
  }

  it('窄屏点击列表项收起侧栏并切换列表', async () => {
    stubMatchMedia(true)
    const { w, ui, s } = mountSidebar()
    await w.findAll('.list-item')[1].trigger('click') // 列表B
    expect(s.currentListId).toBe('b')
    expect(ui.sidebarCollapsed).toBe(true)
  })

  it('宽屏点击列表项只切换列表、不收起', async () => {
    stubMatchMedia(false)
    const { w, ui, s } = mountSidebar()
    await w.findAll('.list-item')[1].trigger('click')
    expect(s.currentListId).toBe('b')
    expect(ui.sidebarCollapsed).toBe(false)
  })

  it('点击遮罩收起侧栏', async () => {
    stubMatchMedia(false)
    const { w, ui } = mountSidebar()
    expect(w.find('[data-test="sidebar-mask"]').exists()).toBe(true)
    await w.find('[data-test="sidebar-mask"]').trigger('click')
    expect(ui.sidebarCollapsed).toBe(true)
  })

  it('收起状态下遮罩不渲染', async () => {
    stubMatchMedia(true)
    const { w, ui } = mountSidebar()
    ui.sidebarCollapsed = true
    await w.vm.$nextTick()
    expect(w.find('[data-test="sidebar-mask"]').exists()).toBe(false)
  })
})
