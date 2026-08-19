import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import SettingsPanel from '../SettingsPanel.vue'
import { useUiStore } from '../../stores/ui'
import i18n from '../../i18n'

describe('SettingsPanel', () => {
  let pinia: Pinia
  beforeEach(() => {
    localStorage.clear()
    i18n.global.locale.value = 'zh'
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountPanel() {
    useUiStore()
    return mount(SettingsPanel, { global: { plugins: [pinia, i18n] } })
  }

  it('渲染主要设置项', () => {
    const w = mountPanel()
    expect(w.text()).toContain('显示描述')
    expect(w.text()).toContain('外观')
    expect(w.text()).toContain('字号大小')
    expect(w.text()).toContain('语言')
    expect(w.text()).toContain('导入数据')
    expect(w.text()).toContain('导出数据')
    expect(w.text()).toContain('关于')
  })

  it('窄屏下释放 .panel min-width，避免与 ModalDialog 在 320/336 视口下叠加溢出弹窗', () => {
    // ModalDialog 在窄屏已解除 360px min-width，但 SettingsPanel 自己又加了 min-width: 300px。
    // 两者叠加：弹窗只剩 ~294px（320vp）/~309px（336vp）内容区，面板仍按 300px 渲染，
    // 导致开关/选择器/滑尺伸出弹窗右边缘、被裁切。
    // 因此窄屏媒体查询内必须覆盖 .panel min-width。
    const src = readFileSync(join(__dirname, '..', 'SettingsPanel.vue'), 'utf8')
    const narrowBlocks = src.split(/@media\s*\(max-width:\s*720px\)/).slice(1)
    expect(narrowBlocks.length).toBeGreaterThan(0)
    const allNarrow = narrowBlocks.join('\n')
    expect(allNarrow).toMatch(/\.panel[\s\S]*?min-width:\s*(0|auto)/)
  })
})