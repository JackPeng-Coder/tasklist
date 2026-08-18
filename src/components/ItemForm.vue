<template>
  <div class="form">
    <label class="field">{{ t('item.name') }} *
      <input v-model="name" data-test="name" @keydown.enter="trySubmit" />
    </label>
    <label class="field">{{ t('item.description') }}
      <input v-model="description" />
    </label>
    <div class="switch-row">
      <span>{{ t('item.date') }}</span>
      <label class="switch"><input type="checkbox" v-model="hasDate" /><span class="slider" /></label>
    </div>
    <input v-if="hasDate" class="picker" type="date" v-model="date" />
    <div class="switch-row">
      <span>{{ t('item.time') }}</span>
      <label class="switch"><input type="checkbox" v-model="hasTime" /><span class="slider" /></label>
    </div>
    <input v-if="hasTime" class="picker" type="time" v-model="time" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ name: string; description: string; date?: string; time?: string }>()
const emit = defineEmits<{
  (e: 'update:name', v: string): void
  (e: 'update:description', v: string): void
  (e: 'update:date', v?: string): void
  (e: 'update:time', v?: string): void
  (e: 'update:invalid', v: boolean): void
  (e: 'submit'): void
}>()

const name = ref(props.name)
const description = ref(props.description)
const hasDate = ref(!!props.date)
const hasTime = ref(!!props.time)
const date = ref(props.date ?? '')
const time = ref(props.time ?? '')

// 勾选即必填：勾了日期必须有日期值；勾了时间必须有时间值且必须有日期（时间不脱离日期单独成立）
const invalid = computed(
  () => (hasDate.value && !date.value) || (hasTime.value && (!time.value || !date.value)),
)
watch(invalid, (v) => emit('update:invalid', v), { immediate: true })

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

// 未填完整的勾选项视为无效，阻止 enter 提交
function trySubmit() { if (!invalid.value) emit('submit') }
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; font-size: var(--font-sm); color: var(--ink-2); }
.field input, .picker { padding: 8px 10px; border: 1px solid var(--input-line); border-radius: var(--radius-sm); background: var(--card); color: var(--ink); font-size: var(--font-md); outline: none; font-family: inherit; transition: border-color 150ms var(--ease), box-shadow 150ms var(--ease); }
.field input:focus, .picker:focus { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-ring); }
.picker { width: 100%; }
.switch-row { display: flex; align-items: center; gap: 10px; font-size: var(--font-sm); color: var(--ink); }
.switch-row > span { flex: 1; }
</style>
