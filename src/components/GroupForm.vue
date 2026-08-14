<template>
  <div class="form">
    <label>{{ t('group.name') }} *<input v-model="name" data-test="name" @keydown.enter="trySubmit" /></label>
    <label>{{ t('group.description') }}<input v-model="description" /></label>
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
.form > label { display: flex; flex-direction: column; gap: 6px; font-size: var(--font-sm); color: var(--ink-2); }
input { padding: 8px 10px; border: 1px solid var(--input-line); border-radius: var(--radius-sm); background: var(--card); color: var(--ink); font-size: var(--font-md); outline: none; font-family: inherit; transition: border-color 150ms var(--ease), box-shadow 150ms var(--ease); }
input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-ring); }
</style>
