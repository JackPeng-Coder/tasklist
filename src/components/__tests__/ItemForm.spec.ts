import { mount } from '@vue/test-utils'
import ItemForm from '../ItemForm.vue'
import i18n from '../../i18n'

describe('ItemForm', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.global.locale.value = 'zh'
  })

  it('勾选日期开关后显示自定义占位符「选择日期」', async () => {
    const w = mount(ItemForm, { props: { name: '', description: '' }, global: { plugins: [i18n] } })
    await w.find('.switch-row input[type=checkbox]').setValue(true)
    expect(w.find('.picker-ph').exists()).toBe(true)
    expect(w.find('.picker-ph').text()).toBe('选择日期')
  })

  it('填入日期后占位符消失', async () => {
    const w = mount(ItemForm, { props: { name: '', description: '' }, global: { plugins: [i18n] } })
    await w.find('.switch-row input[type=checkbox]').setValue(true)
    await w.find('input[type=date]').setValue('2026-08-20')
    expect(w.find('.picker-ph').exists()).toBe(false)
  })

  it('勾选时间开关后时间框显示自定义占位符「选择时间」', async () => {
    const w = mount(ItemForm, { props: { name: '', description: '' }, global: { plugins: [i18n] } })
    const boxes = w.findAll('.switch-row input[type=checkbox]')
    await boxes[1].setValue(true)
    const phs = w.findAll('.picker-ph')
    // 勾选时间会自动勾选日期 → 日期、时间两个占位符
    expect(phs.length).toBe(2)
    expect(phs[1].text()).toBe('选择时间')
  })
})
