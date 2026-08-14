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
.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, .45); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: var(--color-surface); border-radius: var(--radius-lg); padding: 20px 24px; min-width: 360px; max-width: min(560px, 92vw); box-shadow: var(--shadow-lg); border: 1px solid var(--color-border); }
.dialog h3 { margin: 0 0 4px; font-size: var(--font-lg); }
.body { margin: 16px 0; }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
</style>
