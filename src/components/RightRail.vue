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
.right-rail { width: 64px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; padding: 8px; background: var(--color-surface); border-left: 1px solid var(--color-border); }
@media (max-width: 720px) { .right-rail { flex-direction: row; position: fixed; bottom: 0; left: 0; right: 0; height: 48px; border-left: none; border-top: 1px solid var(--color-border); } }
.icon-btn { background: none; border: 1px solid transparent; border-radius: 8px; padding: 10px 4px; cursor: pointer; color: var(--color-text); font-size: 13px; }
.icon-btn.active { border-color: var(--color-pending); color: var(--color-pending); }
</style>
