<template>
  <div v-if="!ui.sidebarCollapsed" class="sidebar-mask" data-test="sidebar-mask" @click="ui.toggleSidebar()" />
  <aside class="sidebar" :class="{ collapsed: ui.sidebarCollapsed }">
    <div class="sidebar-head">
      <span class="title">{{ t('sidebar.lists') }}</span>
      <button class="icon-btn edit" :class="{ active: ui.editMode }" @click="ui.toggleEditMode()">{{ t('sidebar.edit') }}</button>
    </div>
    <div class="sidebar-body">
      <div
        v-for="l in data.lists"
        :key="l.id"
        class="list-item"
        :class="[{ active: l.id === data.currentListId }, listStatus(l, ui.now)]"
        @click="onSelectList(l.id)"
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

// 选择列表；窄屏（≤720px 覆盖态）下自动收起侧栏
const NARROW = '(max-width: 720px)'
function onSelectList(id: string) {
  data.selectList(id)
  if (window.matchMedia && window.matchMedia(NARROW).matches) {
    ui.sidebarCollapsed = true
  }
}
</script>

<style scoped>
.sidebar { width: var(--sidebar-width); flex-shrink: 0; background: var(--card); border-right: 1px solid var(--line); display: flex; flex-direction: column; transition: width 220ms var(--ease), transform 220ms var(--ease); overflow: hidden; }
.sidebar.collapsed { width: 0; border-right: none; }
/* 窄屏覆盖态遮罩：点击收起侧栏（仅 ≤720px 显示；弹窗 z-index 100 高于其上方） */
.sidebar-mask { position: fixed; inset: 0; z-index: 40; background: var(--mask); display: none; }
@media (max-width: 720px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; width: var(--sidebar-width); transform: translateX(0); transition: transform 220ms var(--ease); }
  .sidebar.collapsed { width: var(--sidebar-width); transform: translateX(-100%); }
  .sidebar-mask { display: block; }
}
.sidebar-head { padding: 48px 8px 8px; display: flex; gap: 4px; align-items: center; min-width: var(--sidebar-width); }
.sidebar-head .title { flex: 1; font-weight: 600; color: var(--ink); }
.icon-btn { background: none; border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 18px; cursor: pointer; color: var(--ink-3); display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: color 150ms var(--ease), background-color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); }
.icon-btn:active { scale: 0.9; transition: scale 60ms var(--ease); }
.icon-btn:hover { background: var(--ink-tint); color: var(--ink); }
.sidebar-head .icon-btn.edit { width: auto; padding: 0 10px; font-size: 13px; }
.sidebar-head .icon-btn.edit.active { background: var(--blue); color: #fff; }
.sidebar-body { flex: 1; overflow-y: auto; padding: 0 8px; }
.list-item { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: var(--radius-sm); cursor: pointer; margin-bottom: 2px; color: var(--ink-2); transition: background-color 150ms var(--ease), color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); min-width: calc(var(--sidebar-width) - 16px); }
.list-item:active { scale: 0.94; transition: scale 60ms var(--ease); }
.list-item:hover { background: var(--ink-tint); color: var(--ink); }
.list-item.new-list { width: calc(100% - 16px); font: inherit; background: none; border: none; text-align: left; color: var(--ink-3); }
.list-item.new-list:hover { color: var(--ink); background: var(--ink-tint); }
.list-item.active { background: var(--blue-soft); color: var(--blue-ink); font-weight: 600; }
.list-item.overdue.active { background: var(--red-soft); color: var(--red-ink); }
.list-item.done.active { background: var(--green-soft); color: var(--green-ink); }
.overdue { color: var(--red-ink); }
.pending { color: var(--blue-ink); }
.done { color: var(--green-ink); }
.list-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-btn { background: none; border: none; border-radius: var(--radius-sm); padding: 2px 5px; color: var(--ink-3); cursor: pointer; font-size: var(--font-xs); line-height: 1.2; transition: color 150ms var(--ease), background-color 150ms var(--ease), scale 200ms var(--spring); }
.mini-btn:active { scale: 0.9; transition: scale 60ms var(--ease); }
.mini-btn:hover { background: var(--ink-tint); color: var(--ink); }
.mini-btn.danger:hover { color: var(--red); background: var(--red-soft); }
</style>
