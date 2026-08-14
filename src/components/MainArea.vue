<template>
  <main class="main-area" data-test="main-area">
    <template v-if="data.currentList">
      <h2 class="list-title">{{ data.currentList.name }}</h2>
      <p v-if="data.currentList.description" class="list-desc">{{ data.currentList.description }}</p>
      <TaskList
        :nodes="data.currentList.items"
        :depth="0"
        :parent-id="null"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @add-item="emit('add-item', $event)"
        @add-group="emit('add-group', $event)"
      />
    </template>
    <div v-else class="empty-tip">{{ t('empty.noList') }}</div>
    <DragPreview :state="dragState" />
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { dragState, resetDrag, setDropHandler } from '../composables/useDrag'
import TaskList from './TaskList.vue'
import DragPreview from './DragPreview.vue'

const { t } = useI18n()
const data = useDataStore()
const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'remove', id: string): void
  (e: 'add-item', parentId: string | null): void
  (e: 'add-group', parentId: string | null): void
}>()

setDropHandler((target) => {
  const d = dragState.value
  if (!d || !d.active) return
  if (target && target.id === d.nodeId) return // 无效目标
  data.moveNode({
    fromListId: d.listId,
    nodeId: d.nodeId,
    toKind: target?.kind === 'group' ? 'group' : target?.kind === 'item' ? 'item' : 'list',
    toId: target?.id ?? d.listId,
  })
})
onBeforeUnmount(() => resetDrag())
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 16px 20px; }
.list-title { margin: 0 0 4px; }
.list-desc { margin: 0 0 12px; color: var(--color-muted); font-size: 13px; }
</style>
