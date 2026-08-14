<template>
  <ModalDialog :open="open" @close="$emit('cancel')">
    <template #title><h3>{{ title }}</h3></template>
    <p class="message">{{ message }}</p>
    <template #actions>
      <button class="btn" @click="$emit('cancel')">{{ t('common.cancel') }}</button>
      <button class="btn danger" data-test="confirm" @click="$emit('confirm')">{{ confirmLabel }}</button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import ModalDialog from './ModalDialog.vue'
const { t } = useI18n()
const props = withDefaults(defineProps<{ open: boolean; title: string; message: string; confirmText?: string }>(), {})
const confirmLabel = computed(() => props.confirmText ?? t('common.delete'))
defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
</script>

<style scoped>
.message { margin: 0; line-height: 1.6; color: var(--color-text); }
.btn { padding: 8px 18px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; font-size: 14px; transition: background .15s, border-color .15s; }
.btn:hover { background: var(--color-bg); }
.btn.danger { background: transparent; color: var(--color-overdue); border-color: var(--color-overdue); }
.btn.danger:hover { background: rgba(224, 62, 62, .08); }
</style>
