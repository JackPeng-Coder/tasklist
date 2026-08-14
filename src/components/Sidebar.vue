<template>
  <aside class="sidebar" :class="{ collapsed: ui.sidebarCollapsed }">
    <div class="sidebar-head">
      <button class="icon-btn toggle" :title="ui.sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')" @click="ui.toggleSidebar()">{{ ui.sidebarCollapsed ? '☰' : '✕' }}</button>
      <span class="title">{{ t('sidebar.lists') }}</span>
      <button class="icon-btn edit" :class="{ active: ui.editMode }" @click="ui.toggleEditMode()">{{ t('sidebar.edit') }}</button>
    </div>
    <div class="sidebar-body">
      <div
        v-for="l in data.lists"
        :key="l.id"
        class="list-item"
        :class="[{ active: l.id === data.currentListId }, listStatus(l, ui.now)]"
        @click="data.selectList(l.id)"
      >
        <span class="list-name" @dblclick="startRename(l)">{{ l.name }}</span>
        <span v-if="ui.editMode" class="mini-btn danger" @click.stop="$emit('delete-list', l.id)">{{ t('common.delete') }}</span>
      </div>
      <button class="list-item new-list" @click="$emit('new-list')">{{ t('sidebar.newList') }}</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { listStatus } from '../logic/status'
import type { List } from '../types'

const { t } = useI18n()
const data = useDataStore()
const ui = useUiStore()
const emit = defineEmits<{ (e: 'new-list'): void; (e: 'delete-list', id: string): void; (e: 'rename-list', list: List): void }>()

function startRename(l: List) {
  emit('rename-list', l)
}
</script>

<style scoped>
.sidebar { width: var(--sidebar-width); flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; transition: width .2s, transform .2s; overflow: hidden; }
.sidebar.collapsed { width: 0; border-right: none; }
@media (max-width: 720px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; width: var(--sidebar-width); transform: translateX(0); transition: transform .2s; }
  .sidebar.collapsed { width: var(--sidebar-width); transform: translateX(-100%); }
}
.sidebar-head { padding: 8px; display: flex; gap: 4px; align-items: center; min-width: var(--sidebar-width); }
.sidebar-head .title { flex: 1; font-weight: 600; }
.icon-btn { background: none; border: 1px solid transparent; border-radius: 8px; font-size: 18px; cursor: pointer; color: var(--color-text); display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: background .15s, border-color .15s; }
.icon-btn:hover { background: var(--color-bg); border-color: var(--color-border); }
.sidebar-head .icon-btn.edit { width: auto; padding: 0 10px; font-size: 13px; }
.sidebar-head .icon-btn.edit.active { background: var(--color-pending); color: #fff; border-color: var(--color-pending); }
.sidebar-body { flex: 1; overflow-y: auto; padding: 0 8px; }
.list-item { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; color: var(--color-text); transition: background .15s; min-width: calc(var(--sidebar-width) - 16px); }
.list-item:hover { background: var(--color-bg); }
.list-item.new-list { width: calc(100% - 16px); font: inherit; background: none; border: none; text-align: left; color: var(--color-muted); }
.list-item.new-list:hover { color: var(--color-text); background: var(--color-bg); }
.list-item.active { background: var(--color-bg); outline: 1px solid var(--color-border); }
.overdue { color: var(--color-overdue); }
.pending { color: var(--color-pending); }
.done { color: var(--color-done); }
.list-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-btn { background: none; border: 1px solid transparent; border-radius: 6px; padding: 4px 6px; color: var(--color-muted); cursor: pointer; transition: color .15s, background .15s; }
.mini-btn:hover { background: var(--color-surface); color: var(--color-text); }
.mini-btn.danger:hover { color: var(--color-overdue); background: rgba(224, 62, 62, .08); }
</style>
