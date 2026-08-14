import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

const browserLang = navigator.language?.startsWith('zh') ? 'zh' : 'en'

export default createI18n({
  legacy: false,
  locale: localStorage.getItem('tasklist:lang') ?? browserLang,
  fallbackLocale: 'zh',
  messages: { zh, en },
})
