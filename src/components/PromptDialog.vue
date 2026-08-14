<template>
  <ModalDialog :open="open" @close="onCancel">
    <template #title><h3>{{ title }}</h3></template>
    <label class="field">
      <input ref="input" v-model="value" data-test="prompt-input" @keydown.enter="onConfirm" />
    </label>
    <template #actions>
      <button class="btn" data-test="prompt-cancel" @click="onCancel">{{ t('common.cancel') }}</button>
      <button class="btn primary" data-test="prompt-confirm" :disabled="!value.trim()" @click="onConfirm">{{ t('common.confirm') }}</button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import ModalDialog from './ModalDialog.vue'
const { t } = useI18n()
const props = defineProps<{ open: boolean; title: string; defaultValue?: string }>()
const emit = defineEmits<{ (e: 'confirm', value: string | null): void; (e: 'cancel'): void }>()
const value = ref(props.defaultValue ?? '')
const input = ref<HTMLInputElement | null>(null)

watch(() => props.open, (open) => {
  if (open) {
    value.value = props.defaultValue ?? ''
    nextTick(() => input.value?.focus())
  }
})

function onConfirm() {
  emit('confirm', value.value.trim() || null)
}
function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.field { display: flex; flex-direction: column; gap: 6px; }
input { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); color: var(--color-text); font-size: 15px; outline: none; transition: border-color .15s, box-shadow .15s; }
input:focus { border-color: var(--color-pending); box-shadow: 0 0 0 3px rgba(58, 123, 213, .15); }
.btn { padding: 8px 18px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; font-size: 14px; transition: background .15s, border-color .15s; }
.btn:hover { background: var(--color-bg); }
.btn.primary { background: var(--color-pending); color: #fff; border-color: var(--color-pending); }
.btn.primary:hover { background: var(--color-pending-deep); }
.btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
