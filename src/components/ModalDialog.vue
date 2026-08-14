<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" data-test="modal" @click.self="$emit('close')">
      <div class="dialog" data-test="dialog" role="dialog">
        <slot name="title"><h3 /></slot>
        <div class="body"><slot /></div>
        <div class="actions"><slot name="actions" /></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

watch(
  () => props.open,
  (open) => {
    if (open) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
  { immediate: true },
)
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: var(--mask); display: flex; align-items: center; justify-content: center; z-index: 100; animation: dialog-in 140ms var(--ease); }
@keyframes dialog-in { from { opacity: 0; } to { opacity: 1; } }
.dialog { background: var(--card); color: var(--ink); border-radius: var(--radius); padding: 20px; min-width: 360px; max-width: min(560px, 92vw); box-shadow: var(--shadow-lift); border: 1px solid var(--line); }
.dialog h3 { margin: 0 0 4px; font-size: var(--font-lg); }
.body { margin: 16px 0; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
</style>
