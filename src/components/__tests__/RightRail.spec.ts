import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import RightRail from '../RightRail.vue'
import { useDataStore } from '../../stores/data'
import { useUiStore } from '../../stores/ui'
import i18n from '../../i18n'

describe('RightRail', () => {
  let pinia: Pinia
  beforeEach(() => {
    localStorage.clear()
    i18n.global.locale.value = 'zh'
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountRail() {
    const w = mount(RightRail, { global: { plugins: [pinia, i18n] } })
    return w
  }

  it('渲染六个功能按钮，文字含中文', () => {
    const w = mountRail()
    const btns = w.findAll('.icon-btn')
    expect(btns).toHaveLength(6)
    // 顺序：+事项 / +组合 / 撤销 / 重做 / 编辑 / 设置
    expect(btns[0].text()).toContain('事项')
    expect(btns[1].text()).toContain('组合')
    expect(btns[2].text()).toContain('撤销')
    expect(btns[3].text()).toContain('重做')
    expect(btns[4].text()).toContain('编辑')
    expect(btns[5].text()).toContain('设置')
  })

  it('窄屏下按钮含 .btn-label 元素（窄屏媒体查询负责视觉隐藏）', () => {
    // 真实渲染（CSS 媒体查询）由浏览器处理，jsdom 不解析 media query
    // 此处断言 DOM 结构：每个按钮仍含 .btn-label（窄屏下由 clip 隐藏、不撑宽）
    const w = mountRail()
    const btns = w.findAll('.icon-btn')
    for (const b of btns) {
      expect(b.find('.btn-label').exists()).toBe(true)
    }
  })

  it('窄屏 .icon-btn 使用 flex: 1 1 0 + min-width 让按钮平分布局宽度，仅在不够时换行', () => {
    // jsdom 不解析 @media 媒体查询，故直接检查 .vue 源码中的窄屏 CSS 规则。
    // 设计目标：窄屏（≤720px）下工具栏按钮平分容器宽度，两端不留白；
    // 仅当视口实在不够（按按钮最小可点宽度排列后仍溢出）时才允许换行。
    // 旧实现 .icon-btn { flex: 0 0 auto } 会让按钮按内容尺寸聚集，再被 justify-content: center 推到中间，
    // 导致两侧长期留出 30~60+ px 的空白，不符合「不够位置才换行」的语义。
    const src = readFileSync(join(__dirname, '..', 'RightRail.vue'), 'utf8')
    const narrowBlocks = src.split(/@media\s*\(max-width:\s*720px\)/).slice(1)
    expect(narrowBlocks.length).toBeGreaterThan(0)
    const iconBtnRuleBodies = narrowBlocks
      .map((b) => b.match(/\.icon-btn\s*\{([\s\S]*?)\}/))
      .filter((m): m is RegExpExecArray => !!m)
      .map((m) => m[1])
    expect(iconBtnRuleBodies.length).toBeGreaterThan(0)
    const all = iconBtnRuleBodies.join('\n')
    // 必须采用 fill 策略
    expect(all).toMatch(/flex:\s*1 1 0/)
    // 必须设最小宽度防止按钮被压到不可见/不可点
    expect(all).toMatch(/min-width:\s*36px/)
    // 必须不再使用 0 0 auto 旧策略
    expect(all).not.toMatch(/flex:\s*0 0 auto/)
  })

  it('窄屏 .right-rail 不再用 justify-content: center 把按钮推到中间造成两端空白', () => {
    // 设计：按钮采用 flex: 1 1 0 时会自动平分整行宽度；只有换行后剩下零星的"孤儿按钮"
    // 才会看到 justify-content 的影响。默认 flex-start 比 center 更符合"逐批换行、靠左起步"的视觉，
    // 避免按整行居中再次让窄屏出现两侧对称空白。
    const src = readFileSync(join(__dirname, '..', 'RightRail.vue'), 'utf8')
    const narrowRailRule = src.match(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.right-rail\s*\{([\s\S]*?)\}/
    )
    expect(narrowRailRule).toBeTruthy()
    const body = narrowRailRule![1]
    // 不允许在窄屏 rail 上继续使用 justify-content: center
    expect(body).not.toMatch(/justify-content:\s*center/)
  })

  it('主动作按钮不再以文字「+」开头（图标已替代「+」语义）', () => {
    const w = mountRail()
    const btns = w.findAll('.icon-btn')
    expect(btns[0].text()).not.toMatch(/^\+/)
    expect(btns[1].text()).not.toMatch(/^\+/)
    expect(btns[0].text()).toContain('事项')
    expect(btns[1].text()).toContain('组合')
  })

  it('每个按钮内含图标（SVG 或带图标的元素）', () => {
    const w = mountRail()
    const btns = w.findAll('.icon-btn')
    for (const b of btns) {
      // 至少有一个 .btn-icon 子元素
      expect(b.find('.btn-icon').exists()).toBe(true)
    }
  })

  it('主要动作（+事项 / +组合）带 primary 修饰类，呈现实色填充', () => {
    const w = mountRail()
    const btns = w.findAll('.icon-btn')
    expect(btns[0].classes()).toContain('primary')
    expect(btns[1].classes()).toContain('primary')
  })

  it('编辑按钮未激活时无 active 类，激活后加 active 类', async () => {
    const ui = useUiStore()
    const w = mountRail()
    const editBtn = w.findAll('.icon-btn')[4]
    expect(editBtn.classes()).not.toContain('active')
    ui.editMode = true
    await w.vm.$nextTick()
    expect(editBtn.classes()).toContain('active')
  })

  it('撤销 / 重做 在无历史时禁用且明显弱化（透明度 ≤ 0.5）', async () => {
    const s = useDataStore()
    s.init()
    // 初始无任何变更 → canUndo=false / canRedo=false
    expect(s.canUndo).toBe(false)
    expect(s.canRedo).toBe(false)
    const w = mountRail()
    const undo = w.find('[data-test="undo"]')
    const redo = w.find('[data-test="redo"]')
    expect((undo.element as HTMLButtonElement).disabled).toBe(true)
    expect((redo.element as HTMLButtonElement).disabled).toBe(true)
    // 用元素直接拿 computed style 验证（jsdom 不渲染 CSS，因此校验 class 而不是像素值）
    expect(undo.classes()).toContain('dimmed')
    expect(redo.classes()).toContain('dimmed')
  })

  it('撤销 / 重做 在有历史时不再 dimmed，撤销后再次禁用', async () => {
    const s = useDataStore()
    s.init()
    s.lists = [{ id: 'L', name: 'L', description: '', items: [] }]
    s.selectList('L')
    s.addNode(null, { id: 'i1', name: '事项', description: '', done: false, createdAt: Date.now() } as any)
    expect(s.canUndo).toBe(true)
    const w = mountRail()
    const undo = w.find('[data-test="undo"]')
    expect(undo.classes()).not.toContain('dimmed')
    expect((undo.element as HTMLButtonElement).disabled).toBe(false)
    // 撤销后回到无历史
    await undo.trigger('click')
    expect(s.canUndo).toBe(false)
    expect((undo.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('点击 +事项 / +组合 / 设置 抛出事件', async () => {
    const w = mountRail()
    const btns = w.findAll('.icon-btn')
    await btns[0].trigger('click')
    await btns[1].trigger('click')
    await btns[5].trigger('click')
    expect(w.emitted('add-item')).toBeTruthy()
    expect(w.emitted('add-group')).toBeTruthy()
    expect(w.emitted('open-settings')).toBeTruthy()
  })

  it('点击编辑按钮切换 ui.editMode', async () => {
    const ui = useUiStore()
    const w = mountRail()
    const editBtn = w.findAll('.icon-btn')[4]
    expect(ui.editMode).toBe(false)
    await editBtn.trigger('click')
    expect(ui.editMode).toBe(true)
    await editBtn.trigger('click')
    expect(ui.editMode).toBe(false)
  })
})