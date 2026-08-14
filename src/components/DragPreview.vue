<template>
  <Teleport to="body">
    <div v-if="state && state.active" class="drag-preview" :style="{ left: state.x + 'px', top: state.y + 'px', width: state.width + 'px' }" data-test="drag-preview">
      {{ t('drag.preview') }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DragState } from '../composables/useDrag'
const { t } = useI18n()
defineProps<{ state: DragState | null }>()
</script>

<style scoped>
.drag-preview { position: fixed; z-index: 200; opacity: .7; pointer-events: none; background: var(--card); border: 1px dashed var(--ink-3); border-radius: var(--radius); padding: 9px 12px; transform: translate(-50%, -50%); box-shadow: var(--shadow-lift); font-size: var(--font-sm); color: var(--ink); white-space: nowrap; }
</style>
