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
.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, .4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: var(--color-surface); border-radius: 12px; padding: 16px 20px; min-width: 320px; max-width: 90vw; box-shadow: 0 8px 30px rgba(0, 0, 0, .25); }
.body { margin: 12px 0; }
.actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
