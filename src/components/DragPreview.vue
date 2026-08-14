<template>
  <Teleport to="body">
    <div v-if="state && state.active" class="drag-preview" :style="{ left: state.x + 'px', top: state.y + 'px', width: state.width + 'px' }" data-test="drag-preview">
      拖动中…
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { DragState } from '../composables/useDrag'
defineProps<{ state: DragState | null }>()
</script>

<style scoped>
.drag-preview { position: fixed; z-index: 200; opacity: .5; pointer-events: none; background: var(--color-surface); border: 1px dashed var(--color-muted); border-radius: 8px; padding: 8px 12px; transform: translate(-50%, -50%); }
</style>
