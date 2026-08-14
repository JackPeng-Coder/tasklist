<template>
  <main class="main-area" :class="{ 'has-collapsed-sidebar': ui.sidebarCollapsed }" data-test="main-area">
    <button v-if="ui.sidebarCollapsed" class="sidebar-toggle" :title="t('sidebar.expand')" @click="ui.toggleSidebar()">☰</button>
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
import { useUiStore } from '../stores/ui'
import { dragState, resetDrag, setDropHandler } from '../composables/useDrag'
import TaskList from './TaskList.vue'
import DragPreview from './DragPreview.vue'

const { t } = useI18n()
const data = useDataStore()
const ui = useUiStore()
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
  const toKind = target?.kind === 'group' ? 'group' : target?.kind === 'item' && d.ctrl ? 'item' : 'list'
  data.moveNode({
    fromListId: d.listId,
    nodeId: d.nodeId,
    toKind,
    toId: toKind === 'list' ? d.listId : target!.id,
  })
})
onBeforeUnmount(() => resetDrag())
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 20px 28px 24px; position: relative; }
.main-area.has-collapsed-sidebar { padding-top: 56px; }
.sidebar-toggle { position: absolute; left: 14px; top: 14px; width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: 14px; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), box-shadow 150ms var(--ease), transform 140ms var(--spring); z-index: 10; }
.sidebar-toggle:hover { color: var(--ink); box-shadow: var(--shadow-lift); }
.list-title { margin: 0 0 6px; font-size: var(--font-lg); font-weight: 700; }
.list-desc { margin: 0 0 18px; color: var(--ink-2); font-size: var(--font-sm); }
.empty-tip { color: var(--ink-3); font-size: var(--font-md); text-align: center; padding: 60px 20px; }
</style>
