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
.btn { padding: 5px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: var(--font-sm); font-weight: 500; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), border-color 150ms var(--ease), background-color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); }
.btn:not(:disabled):active { scale: 0.94; transition: scale 60ms var(--ease); }
.btn:hover { color: var(--blue-ink); border-color: var(--blue); box-shadow: var(--shadow-lift); }
.btn.danger { background: var(--red); color: #fff; border-color: var(--red); }
.btn.danger:hover { background: var(--red-ink); border-color: var(--red-ink); color: #fff; }
</style>
