import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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
})
