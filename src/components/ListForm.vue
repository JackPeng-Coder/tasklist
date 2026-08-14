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
.form { display: flex; flex-direction: column; gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-muted); }
input { padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); color: var(--color-text); font-size: 14px; }
</style>
