import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import SettingsPanel from '../SettingsPanel.vue'
import { useUiStore } from '../../stores/ui'
import { useI18n } from 'vue-i18n'
import i18n from '../../i18n'

describe('SettingsPanel', () => {
  let pinia: Pinia
  beforeEach(() => { localStorage.clear(); pinia = createPinia(); setActivePinia(pinia) })

  it('切换主题与字号写回 store', async () => {
    const s = useUiStore()
    const w = mount(SettingsPanel, { global: { plugins: [pinia, i18n] } })
    await w.find('[data-test="theme-dark"]').setValue(true)
    expect(s.settings.theme).toBe('dark')
    await w.find('[data-test="font-size"]').setValue(20)
    expect(s.settings.fontSize).toBe(20)
  })

  it('语言切换', async () => {
    const s = useUiStore()
    const w = mount(SettingsPanel, { global: { plugins: [pinia, i18n] } })
    await w.find('[data-test="lang"]').setValue('en')
    expect(s.settings.lang).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
  })
})
