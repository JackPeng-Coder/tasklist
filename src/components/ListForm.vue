<template>
  <div class="form">
    <label>{{ t('list.name') }} *<input v-model="name" data-test="name" @keydown.enter="trySubmit" /></label>
    <label>{{ t('list.description') }}<input v-model="description" /></label>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ name: string; description: string }>()
const emit = defineEmits<{ (e: 'update:name', v: string): void; (e: 'update:description', v: string): void; (e: 'submit'): void }>()
const name = ref(props.name)
const description = ref(props.description)
watch(name, (v) => emit('update:name', v))
watch(description, (v) => emit('update:description', v))
function trySubmit() { emit('submit') }
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 14px; }
.form > label { display: flex; flex-direction: column; gap: 6px; font-size: var(--font-sm); color: var(--color-muted); }
input { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: var(--font-md); outline: none; transition: border-color .15s, box-shadow .15s; }
input:focus { border-color: var(--color-pending); box-shadow: 0 0 0 3px rgba(58, 123, 213, .15); }
</style>
