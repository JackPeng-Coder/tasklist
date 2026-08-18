<template>
  <main class="main-area" data-test="main-area">
    <button
      class="sidebar-toggle"
      :title="ui.sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')"
      data-test="sidebar-toggle"
      @click="ui.toggleSidebar()"
    >{{ ui.sidebarCollapsed ? '☰' : '✕' }}</button>
    <div class="content">
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
    </div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { dragState, resetDrag, setDropHandler } from '../composables/useDrag'
import TaskList from './TaskList.vue'

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
  const kind = target ? target.kind : 'list'
  data.moveNode({
    fromListId: d.listId,
    nodeId: d.nodeId,
    toKind: kind,
    toId: kind === 'list' ? d.listId : target!.id,
  })
})
onBeforeUnmount(() => resetDrag())
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; position: relative; }
.content { max-width: 760px; margin: 0 auto; padding: 56px 28px 48px; }
.sidebar-toggle { position: fixed; top: 10px; left: 10px; width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: 14px; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), box-shadow 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); z-index: 60; }
.sidebar-toggle:active { scale: 0.9; transition: scale 60ms var(--ease); }
.sidebar-toggle:hover { color: var(--ink); box-shadow: var(--shadow-lift); }
.list-title { margin: 0 0 6px; font-size: var(--font-lg); font-weight: 700; }
.list-desc { margin: 0 0 18px; color: var(--ink-2); font-size: var(--font-sm); }
.empty-tip { color: var(--ink-3); font-size: var(--font-md); text-align: center; padding: 60px 20px; }
</style>
