import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ItemForm from '../ItemForm.vue'

const i18n = createI18n({ legacy: false, locale: 'zh', messages: { zh: { item: { name: '事项名称', description: '事项描述', new: '新建事项', edit: '编辑事项', date: '日期', time: '时间', dateFormat: 'yyyy/mm/dd' } }, en: { item: { dateFormat: 'yyyy/mm/dd' } } } })

function mountForm(date?: string) {
  return mount(ItemForm, {
    props: { name: '', description: '', date, time: undefined },
    global: { plugins: [i18n] },
  })
}

describe('ItemForm 日期输入', () => {
  it('打开日期开关但未选日期时显示 yyyy/mm/dd 占位叠加文案', async () => {
    const w = mountForm()
    await w.find('input[type="checkbox"]').setValue(true)
    const ph = w.find('[data-test="date-ph"]')
    expect(ph.exists()).toBe(true)
    expect(ph.text()).toBe('yyyy/mm/dd')
  })
  it('有日期时不显示占位叠加文案', () => {
    const w = mountForm('2026-08-14')
    expect(w.find('[data-test="date-ph"]').exists()).toBe(false)
    expect((w.find('[data-test="date-picker"]').element as HTMLInputElement).value).toBe('2026-08-14')
  })
})
