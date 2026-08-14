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
.btn { padding: 8px 18px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; font-size: 14px; transition: background .15s, border-color .15s; }
.btn.primary { background: var(--color-pending); color: #fff; border-color: var(--color-pending); }
.btn.primary:hover { background: var(--color-pending-deep); }
</style>