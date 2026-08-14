import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from './ui'

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    document.body.dataset.theme = ''
  })

  it('默认浅色与中文字号 16', () => {
    const s = useUiStore()
    expect(s.settings.theme).toBe('light')
    expect(s.settings.fontSize).toBe(16)
  })

  it('切换主题写入 DOM', () => {
    const s = useUiStore()
    s.setTheme('dark')
    expect(document.body.dataset.theme).toBe('dark')
  })

  it('字号写入 CSS 变量', () => {
    const s = useUiStore()
    s.setFontSize(20)
    expect(document.documentElement.style.getPropertyValue('--font-base')).toBe('20px')
    expect(document.documentElement.style.getPropertyValue('--font-md')).toBe(`${15 * (20 / 15)}px`)
  })

  it('展开状态与编辑模式', () => {
    const s = useUiStore()
    s.setGroupExpanded('g1', true)
    expect(s.expandedGroupIds).toContain('g1')
    s.toggleEditMode()
    expect(s.editMode).toBe(true)
    s.toggleSidebar()
    expect(s.sidebarCollapsed).toBe(true)
  })
})
