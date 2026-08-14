<template>
  <div class="panel">
    <label class="row"><span>{{ t('settings.showDescription') }}</span><input type="checkbox" :checked="ui.settings.showDescription" @change="ui.setShowDescription(($event.target as HTMLInputElement).checked)" /></label>
    <label class="row"><span>{{ t('settings.theme') }}</span>
      <select data-test="theme" @change="ui.setTheme(($event.target as HTMLSelectElement).value as any)">
        <option value="light" :selected="ui.settings.theme === 'light'">{{ t('settings.light') }}</option>
        <option value="dark" :selected="ui.settings.theme === 'dark'" data-test="theme-dark">{{ t('settings.dark') }}</option>
      </select>
    </label>
    <label class="row"><span>{{ t('settings.fontSize') }} ({{ ui.settings.fontSize }})</span>
      <input data-test="font-size" type="range" min="12" max="24" step="1" :value="ui.settings.fontSize" @input="ui.setFontSize(Number(($event.target as HTMLInputElement).value))" />
    </label>
    <label class="row"><span>{{ t('settings.language') }}</span>
      <select data-test="lang" :value="ui.settings.lang" @change="onLang($event)">
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
    </label>
    <div class="row"><button data-test="import" @click="$emit('import')">{{ t('settings.import') }}</button></div>
    <div class="row"><button data-test="export" @click="$emit('export')">{{ t('settings.export') }}</button></div>
    <div class="row"><button @click="$emit('about')">{{ t('settings.about') }}</button></div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import i18n from '../i18n'

const ui = useUiStore()
const { t } = useI18n()
defineEmits<{ (e: 'import'): void; (e: 'export'): void; (e: 'about'): void }>()

function onLang(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  ui.setLang(v)
  i18n.global.locale.value = v as 'zh' | 'en'
  localStorage.setItem('tasklist:lang', v)
}
</script>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 16px; min-width: 300px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 14px; font-size: var(--font-sm); }
.row span { color: var(--ink); }
.row input[type='checkbox'] { width: 16px; height: 16px; accent-color: var(--blue); cursor: pointer; }
.row input[type='range'] { flex: 1; accent-color: var(--blue); cursor: pointer; }
.row select { padding: 5px 10px; border-radius: var(--radius-sm); border: 1px solid var(--input-line); background: var(--card); color: var(--ink); font-size: var(--font-sm); cursor: pointer; font-family: inherit; }
.row button { padding: 5px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: var(--font-sm); font-weight: 500; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), border-color 150ms var(--ease), box-shadow 150ms var(--ease), transform 140ms var(--spring); }
.row button:hover { color: var(--blue-ink); border-color: var(--blue); box-shadow: var(--shadow-lift); }
</style>
