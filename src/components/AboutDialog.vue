<template>
  <ModalDialog :open="open" @close="$emit('close')">
    <template #title><h3>{{ t('settings.about') }}</h3></template>
    <div class="about">
      <div class="head" data-test="about-version">
        <span class="name">Tasklist</span>
        <span class="ver">v{{ pkg.version }}</span>
      </div>
      <p class="text" data-test="about-tagline">{{ t('about.tagline') }}</p>
      <p class="note" data-test="about-privacy">{{ t('about.privacy') }}</p>
      <div class="stack" data-test="about-stack">{{ t('about.stack') }}</div>
      <ul class="features" data-test="about-features">
        <li v-for="f in features" :key="f" data-test="about-feature">{{ f }}</li>
      </ul>
      <div class="foot">
        <span data-test="about-author">{{ t('about.author') }} · Jack Peng (彭俊杰)</span>
        <span data-test="about-license">{{ t('about.license') }} · MIT License</span>
        <a data-test="about-repo" :href="repoUrl" target="_blank" rel="noopener noreferrer">{{ repoUrl }}</a>
      </div>
    </div>
    <template #actions>
      <button class="btn primary" data-test="about-close" @click="$emit('close')">{{ t('common.confirm') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ModalDialog from './ModalDialog.vue'
import pkg from '../../package.json'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const { t, tm } = useI18n()
const features = (tm('about.features') as unknown as string[]) ?? []
const repoUrl = 'https://github.com/JackPeng-Coder/tasklist'
</script>

<style scoped>
.about { display: flex; flex-direction: column; gap: 10px; min-width: 300px; max-width: 460px; }
/* 窄屏释放 .about min-width：与 ModalDialog / SettingsPanel 同步，避免 320/336 视口下顶开已被压窄的弹窗 */
@media (max-width: 720px) {
  .about { min-width: 0; }
}
.head { display: flex; align-items: center; gap: 10px; }
.name { font-size: var(--font-lg); font-weight: 700; color: var(--ink); }
.ver { font-size: var(--font-xs); color: var(--blue-ink); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--blue-line); background: var(--blue-soft); }
.text { margin: 0; color: var(--ink-2); font-size: var(--font-sm); }
.note { margin: 0; padding: 10px 12px; color: var(--ink-2); font-size: var(--font-sm); line-height: 1.6; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--card); box-shadow: var(--shadow-card); }
.stack { font-size: var(--font-xs); color: var(--ink-3); }
.features { margin: 0; padding-left: 18px; color: var(--ink-2); font-size: var(--font-sm); display: grid; grid-template-columns: repeat(2, minmax(0, auto)); column-gap: 20px; row-gap: 6px; justify-content: start; }
.foot { border-top: 1px solid var(--line); padding-top: 10px; display: flex; flex-direction: column; gap: 6px; font-size: var(--font-sm); color: var(--ink-2); }
.foot a { color: var(--blue-ink); text-decoration: none; word-break: break-all; }
.btn { padding: 5px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: var(--font-sm); font-weight: 500; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), border-color 150ms var(--ease), background-color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); }
.btn:not(:disabled):active { scale: 0.94; transition: scale 60ms var(--ease); }
.btn.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
.btn.primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); color: #fff; }
</style>
