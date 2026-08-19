import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ModalDialog from '../ModalDialog.vue'

function mountModal(open: boolean) {
  return mount(ModalDialog, { props: { open }, global: { stubs: { teleport: true } } })
}

describe('ModalDialog', () => {
  it('关闭状态不渲染', () => {
    const w = mountModal(false)
    expect(w.find('[data-test="modal"]').exists()).toBe(false)
  })

  it('Esc 触发关闭', async () => {
    const w = mountModal(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  it('点击遮罩触发关闭，点击内容不触发', async () => {
    const w = mountModal(true)
    await w.find('[data-test="modal"]').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('[data-test="dialog"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('窄屏（≤720px）下解除 .dialog 的 min-width 约束，避免 320/336 等窄屏视口下弹窗向左溢出视口', () => {
    // 设计：基础 .dialog 设了 min-width: 360px，是给宽屏桌面舒适阅读区间的；
    // 但窄屏视口（320/336 等小于 360 的常见手机尺寸）下 max-width: min(560px, 92vw)
    // 已被压到 294/309 px，反而被 min-width 顶开、向左溢出视口 12~20 px。
    // 因此窄屏媒体查询中应把 min-width 设为 0，让 max-width 真正生效。
    const src = readFileSync(join(__dirname, '..', 'ModalDialog.vue'), 'utf8')
    const narrowBlocks = src.split(/@media\s*\(max-width:\s*720px\)/).slice(1)
    expect(narrowBlocks.length).toBeGreaterThan(0)
    const allNarrow = narrowBlocks.join('\n')
    // 窄屏媒体查询内必须覆盖 .dialog 的 min-width（设为 0 或 auto）
    expect(allNarrow).toMatch(/\.dialog[\s\S]*?min-width:\s*(0|auto)/)
    // 不允许在窄屏下保留过大的 min-width（<= 200 才能给窄屏留足）
    const minWidthMatch = allNarrow.match(/\.dialog[\s\S]*?min-width:\s*(\d+)px/)
    if (minWidthMatch) {
      const px = parseInt(minWidthMatch[1], 10)
      expect(px).toBeLessThanOrEqual(200)
    }
  })
})
