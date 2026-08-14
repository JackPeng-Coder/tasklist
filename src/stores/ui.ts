import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings, Theme } from '../types'

export const useUiStore = defineStore('ui', () => {
  const settings = ref<Settings>({ theme: 'light', fontSize: 14, lang: 'zh', showDescription: true })
  const sidebarCollapsed = ref(false)
  const expandedGroupIds = ref<string[]>([])
  const editMode = ref(false)
  const now = ref(Date.now())

  function applyToDOM() {
    document.body.dataset.theme = settings.value.theme
    const ratio = settings.value.fontSize / 14
    document.documentElement.style.setProperty('--font-base', `${settings.value.fontSize}px`)
    document.documentElement.style.setProperty('--font-xs', `${12 * ratio}px`)
    document.documentElement.style.setProperty('--font-sm', `${13 * ratio}px`)
    document.documentElement.style.setProperty('--font-md', `${14 * ratio}px`)
    document.documentElement.style.setProperty('--font-lg', `${16 * ratio}px`)
  }

  function setTheme(theme: Theme) {
    settings.value.theme = theme
    applyToDOM()
  }

  function setFontSize(size: number) {
    settings.value.fontSize = size
    applyToDOM()
  }

  function setLang(lang: string) {
    settings.value.lang = lang
  }

  function setShowDescription(v: boolean) {
    settings.value.showDescription = v
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setGroupExpanded(id: string, expanded: boolean) {
    const set = new Set(expandedGroupIds.value)
    if (expanded) set.add(id)
    else set.delete(id)
    expandedGroupIds.value = [...set]
  }

  function toggleEditMode() {
    editMode.value = !editMode.value
  }

  function touchNow() {
    now.value = Date.now()
  }

  applyToDOM()

  return { settings, sidebarCollapsed, expandedGroupIds, editMode, now, applyToDOM, setTheme, setFontSize, setLang, setShowDescription, toggleSidebar, setGroupExpanded, toggleEditMode, touchNow }
})
