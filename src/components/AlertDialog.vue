<template>
  <ModalDialog :open="open" @close="$emit('close')">
    <template #title><h3>{{ title }}</h3></template>
    <p class="message">{{ message }}</p>
    <template #actions>
      <button class="btn primary" data-test="alert-ok" @click="$emit('close')">{{ t('common.confirm') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ModalDialog from './ModalDialog.vue'
const { t } = useI18n()
defineProps<{ open: boolean; title: string; message: string }>()
defineEmits<{ (e: 'close'): void }>()
</script>

<style scoped>
.message { margin: 0; line-height: 1.6; color: var(--color-text); }
.btn { padding: 5px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: var(--font-sm); font-weight: 500; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), border-color 150ms var(--ease), background-color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); }
.btn:not(:disabled):active { scale: 0.94; transition: scale 60ms var(--ease); }
.btn.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
.btn.primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); color: #fff; }
</style>