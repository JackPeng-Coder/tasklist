import { mount } from '@vue/test-utils'
import ItemForm from '../ItemForm.vue'
import i18n from '../../i18n'

describe('ItemForm', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.global.locale.value = 'zh'
  })

  function mountForm(overrides: Record<string, unknown> = {}) {
    const listeners: Record<string, any[]> = {}
    const w = mount(ItemForm, {
      props: { name: '', description: '', date: undefined, time: undefined, ...overrides },
      global: { plugins: [i18n] },
      attrs: {
        'onUpdate:invalid': (v: boolean) => (listeners.invalid ??= []).push(v),
        'onSubmit': () => (listeners.submit ??= []).push(true),
      },
    })
    return { w, listeners }
  }

  it('勾选日期但未填 → 无效且 enter 不提交', async () => {
    const { w, listeners } = mountForm()
    await w.find('.switch-row input[type="checkbox"]').setValue(true)
    expect(w.find('input[type="date"]').exists()).toBe(true)
    await w.find('[data-test="name"]').setValue('任务')
    await w.find('[data-test="name"]').trigger('keydown', { key: 'Enter' })
    expect(listeners.submit ?? []).toHaveLength(0)
    expect(listeners.invalid?.at(-1)).toBe(true)
  })

  it('勾选时间（自动勾选日期）但只填时间 → 仍无效', async () => {
    const { w, listeners } = mountForm()
    const timeSwitch = w.findAll('.switch-row input[type="checkbox"]')[1]
    await timeSwitch.setValue(true)
    expect((w.find('.switch-row input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
    await w.find('input[type="time"]').setValue('14:30')
    await w.find('[data-test="name"]').setValue('任务')
    expect(listeners.invalid?.at(-1)).toBe(true)
    await w.find('[data-test="name"]').trigger('keydown', { key: 'Enter' })
    expect(listeners.submit ?? []).toHaveLength(0)
  })

  it('勾选时间未填时间 → 无效', async () => {
    const { w, listeners } = mountForm()
    const timeSwitch = w.findAll('.switch-row input[type="checkbox"]')[1]
    await timeSwitch.setValue(true)
    await w.find('[data-test="name"]').setValue('任务')
    expect(listeners.invalid?.at(-1)).toBe(true)
    await w.find('[data-test="name"]').trigger('keydown', { key: 'Enter' })
    expect(listeners.submit ?? []).toHaveLength(0)
  })

  it('勾选且填好日期与时间 → 有效且 enter 提交', async () => {
    const { w, listeners } = mountForm()
    await w.find('.switch-row input[type="checkbox"]').setValue(true)
    await w.find('input[type="date"]').setValue('2026-08-18')
    const timeSwitch = w.findAll('.switch-row input[type="checkbox"]')[1]
    await timeSwitch.setValue(true)
    await w.find('input[type="time"]').setValue('14:30')
    await w.find('[data-test="name"]').setValue('任务')
    expect(listeners.invalid?.at(-1)).toBe(false)
    await w.find('[data-test="name"]').trigger('keydown', { key: 'Enter' })
    expect(listeners.submit ?? []).toHaveLength(1)
  })

  it('编辑既有脏数据（有 time 无 date）→ 无效（要求补日期）', async () => {
    const { w, listeners } = mountForm({ date: undefined, time: '14:30', name: '旧任务' })
    expect((w.findAll('.switch-row input[type="checkbox"]')[1].element as HTMLInputElement).checked).toBe(true)
    expect(listeners.invalid?.at(-1)).toBe(true)
    await w.find('[data-test="name"]').trigger('keydown', { key: 'Enter' })
    expect(listeners.submit ?? []).toHaveLength(0)
  })
})
