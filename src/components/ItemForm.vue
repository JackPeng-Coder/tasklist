<template>
  <div class="form">
    <label>{{ t('item.name') }} *<input v-model="name" data-test="name" @keydown.enter="trySubmit" /></label>
    <label>{{ t('item.description') }}<input v-model="description" /></label>
    <label class="switch-row"><span>{{ t('item.date') }}</span><input type="checkbox" v-model="hasDate" /></label>
    <div v-if="hasDate" class="nested">
      <label><input type="date" v-model="date" /></label>
    </div>
    <label class="switch-row"><span>{{ t('item.time') }}</span><input type="checkbox" v-model="hasTime" /></label>
    <div v-if="hasTime" class="nested">
      <label><input type="time" v-model="time" /></label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ name: string; description: string; date?: string; time?: string }>()
const emit = defineEmits<{
  (e: 'update:name', v: string): void
  (e: 'update:description', v: string): void
  (e: 'update:date', v?: string): void
  (e: 'update:time', v?: string): void
  (e: 'submit'): void
}>()

const name = ref(props.name)
const description = ref(props.description)
const hasDate = ref(!!props.date)
const hasTime = ref(!!props.time)
const date = ref(props.date ?? '')
const time = ref(props.time ?? '')

watch(name, (v) => emit('update:name', v))
watch(description, (v) => emit('update:description', v))
watch(hasDate, (v) => {
  emit('update:date', v ? (date.value || undefined) : undefined)
  if (!v) { hasTime.value = false; emit('update:time', undefined) }
})
watch(date, (v) => { if (hasDate.value) emit('update:date', v || undefined) })
watch(hasTime, (v) => {
  if (v && !hasDate.value) { hasDate.value = true }
  emit('update:time', v ? (time.value || undefined) : undefined)
})
watch(time, (v) => { if (hasTime.value) emit('update:time', v || undefined) })

function trySubmit() { emit('submit') }
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 14px; }
.form > label { display: flex; flex-direction: column; gap: 6px; font-size: var(--font-sm); color: var(--color-muted); }
input[type='text'], input[type='date'], input[type='time'] { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: var(--font-md); outline: none; transition: border-color .15s, box-shadow .15s; }
input[type='text']:focus, input[type='date']:focus, input[type='time']:focus { border-color: var(--color-pending); box-shadow: 0 0 0 3px rgba(58, 123, 213, .15); }
.switch-row { flex-direction: row; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-bg); }
.switch-row span { flex: 1; }
.switch-row input[type='checkbox'] { width: 18px; height: 18px; accent-color: var(--color-pending); cursor: pointer; }
.nested { padding-left: 24px; }
</style>
