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
input { padding: 8px 10px; border: 1px solid var(--input-line); border-radius: var(--radius-sm); background: var(--card); color: var(--ink); font-size: var(--font-md); outline: none; font-family: inherit; transition: border-color 150ms var(--ease), box-shadow 150ms var(--ease); }
input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-ring); }
.btn { padding: 5px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: var(--font-sm); font-weight: 500; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), border-color 150ms var(--ease), background-color 150ms var(--ease), transform 140ms var(--spring); }
.btn:hover { color: var(--blue-ink); border-color: var(--blue); box-shadow: var(--shadow-lift); }
.btn.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
.btn.primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); color: #fff; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
