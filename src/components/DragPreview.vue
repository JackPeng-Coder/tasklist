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
.drag-preview { position: fixed; z-index: 200; opacity: .5; pointer-events: none; background: var(--color-surface); border: 1px dashed var(--color-muted); border-radius: 8px; padding: 8px 12px; transform: translate(-50%, -50%); }
</style>
