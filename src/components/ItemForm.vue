<template>
  <div class="form">
    <label>名称 *<input v-model="name" data-test="name" @keydown.enter="trySubmit" /></label>
    <label>描述<input v-model="description" /></label>
    <label class="switch-row"><span>日期</span><input type="checkbox" v-model="hasDate" /></label>
    <div v-if="hasDate" class="nested">
      <label><input type="date" v-model="date" /></label>
    </div>
    <label class="switch-row"><span>时间</span><input type="checkbox" v-model="hasTime" :disabled="!hasDate" /></label>
    <div v-if="hasTime" class="nested">
      <label><input type="time" v-model="time" /></label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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
watch(hasTime, (v) => emit('update:time', v ? (time.value || undefined) : undefined))
watch(time, (v) => { if (hasTime.value) emit('update:time', v || undefined) })

function trySubmit() { emit('submit') }
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--color-muted); }
input[type='text'], input[type='date'], input[type='time'] { padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); color: var(--color-text); font-size: 14px; }
.switch-row { flex-direction: row; align-items: center; gap: 8px; }
.switch-row span { flex: 1; }
.nested { padding-left: 20px; }
</style>
