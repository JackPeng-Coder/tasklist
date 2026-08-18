<template>
  <nav class="right-rail">
    <button class="icon-btn" :title="t('rail.addItem')" @click="$emit('add-item')">{{ t('rail.addItem') }}</button>
    <button class="icon-btn" :title="t('rail.addGroup')" @click="$emit('add-group')">{{ t('rail.addGroup') }}</button>
    <button class="icon-btn" :class="{ active: ui.editMode }" @click="ui.toggleEditMode()">{{ t('rail.edit') }}</button>
    <button class="icon-btn" @click="$emit('open-settings')">{{ t('rail.settings') }}</button>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
const { t } = useI18n()
const ui = useUiStore()
defineEmits<{ (e: 'add-item'): void; (e: 'add-group'): void; (e: 'open-settings'): void }>()
</script>

<style scoped>
.right-rail { width: var(--right-rail-width); flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; padding: 12px 8px; background: var(--card); border-left: 1px solid var(--line); }
@media (max-width: 720px) { .right-rail { flex-direction: row; position: fixed; bottom: 0; left: 0; right: 0; height: 56px; border-left: none; border-top: 1px solid var(--line); padding: 8px; gap: 8px; } }
.icon-btn { background: none; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 10px 4px; cursor: pointer; color: var(--ink-2); font-size: var(--font-xs); line-height: 1.35; white-space: nowrap; transition: color 150ms var(--ease), background-color 150ms var(--ease), border-color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); }
.icon-btn:active { scale: 0.9; transition: scale 60ms var(--ease); }
.icon-btn:hover { background: var(--ink-tint); border-color: var(--line); color: var(--ink); }
.icon-btn.active { border-color: var(--blue-line); color: var(--blue-ink); background: var(--blue-soft); }
</style>
