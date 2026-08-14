<template>
  <aside class="sidebar" :class="{ open: !ui.sidebarCollapsed }">
    <div class="sidebar-head">
      <button class="icon-btn" data-test="toggle-sidebar" @click="ui.toggleSidebar()">{{ ui.sidebarCollapsed ? '☰' : '✕' }}</button>
      <button class="icon-btn" @click="$emit('new-list')">+ 新建列表</button>
    </div>
    <div class="sidebar-body">
      <div
        v-for="l in data.lists"
        :key="l.id"
        class="list-item"
        :class="[{ active: l.id === data.currentListId }, statusOf(l)]"
        @click="data.selectList(l.id)"
      >
        <span class="list-name" @dblclick="startRename(l)">{{ l.name }}</span>
        <span v-if="ui.editMode" class="mini-btn danger" @click.stop="$emit('delete-list', l.id)">删除</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { nodeStatus } from '../logic/status'
import type { List } from '../types'

const data = useDataStore()
const ui = useUiStore()
const emit = defineEmits<{ (e: 'new-list'): void; (e: 'delete-list', id: string): void }>()

function statusOf(l: List) {
  const nodes = l.items
  if (nodes.some((n) => nodeStatus(n, ui.now) === 'overdue')) return 'overdue'
  if (nodes.every((n) => nodeStatus(n, ui.now) === 'done') && nodes.length > 0) return 'done'
  return 'pending'
}
function startRename(l: List) {
  const name = prompt('重命名列表', l.name)
  if (name?.trim()) data.renameList(l.id, name.trim())
}
</script>

<style scoped>
.sidebar { width: 240px; flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; }
@media (max-width: 720px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; transform: translateX(-100%); transition: transform .2s; }
  .sidebar.open { transform: translateX(0); }
}
.sidebar-head { padding: 8px; display: flex; gap: 4px; }
.icon-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text); }
.sidebar-head .icon-btn:last-child { font-size: 13px; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 8px; }
.sidebar-body { flex: 1; overflow-y: auto; padding: 0 8px; }
.list-item { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; color: var(--color-text); }
.list-item.active { outline: 1px solid var(--color-border); background: var(--color-bg); }
.overdue { color: var(--color-overdue); }
.pending { color: var(--color-pending); }
.done { color: var(--color-done); }
.list-name { flex: 1; }
.mini-btn { background: none; border: none; color: var(--color-muted); cursor: pointer; }
.mini-btn.danger:hover { color: var(--color-overdue); }
</style>
