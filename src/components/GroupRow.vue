<template>
  <div class="group-wrap">
    <div class="row" :class="statusClass" data-test="row" :data-drop-id="group.id" data-drop-kind="group">
      <div class="row-main" @pointerdown="onPointerDown" @click="onRowClick">
        <span class="expand-btn" :class="{ open: group.expanded }" data-test="arrow">▸</span>
        <span class="title">
          <span class="name">{{ group.name }}</span>
          <span v-if="showDesc && group.description" class="desc"> · {{ group.description }}</span>
        </span>
        <span class="spacer" />
        <span class="group-meta">{{ t('status.doneCount', { done: count.done, total: count.total }) }}</span>
        <span v-if="groupTimeLabel" class="time-chip" :class="statusClass">{{ groupTimeLabel }}</span>
      </div>
      <div v-if="ui.editMode" class="row-actions">
        <button class="mini-btn" @click.stop="$emit('edit', group.id)">{{ t('common.edit') }}</button>
        <button class="mini-btn" @click.stop="$emit('add-item', group.id)">{{ t('rail.addItem') }}</button>
        <button class="mini-btn" @click.stop="$emit('add-group', group.id)">{{ t('rail.addGroup') }}</button>
        <button class="mini-btn danger" @click.stop="$emit('remove', group.id)">{{ t('common.delete') }}</button>
      </div>
    </div>
    <div v-if="group.expanded" class="children" :data-drop-id="group.id" data-drop-kind="group">
      <div class="indent-line" />
      <TaskList :nodes="group.items" :depth="depth + 1" :parent-id="group.id" @edit="$emit('edit', $event)" @remove="$emit('remove', $event)" @add-item="$emit('add-item', $event)" @add-group="$emit('add-group', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { groupStatus, groupTimestamp } from '../logic/status'
import { formatTimestampLabel } from '../logic/dates'
import { beginDrag, dragState } from '../composables/useDrag'
import type { Group } from '../types'
import TaskList from './TaskList.vue'

const props = defineProps<{ group: Group; depth: number; parentId: string | null }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void; (e: 'add-item', parentId: string): void; (e: 'add-group', parentId: string): void }>()
const { t } = useI18n()
const data = useDataStore()
const ui = useUiStore()

const statusClass = computed(() => {
  const s = groupStatus(props.group, ui.now)
  return s === 'overdue' ? 'overdue' : s === 'done' ? 'done' : 'pending'
})
const showDesc = computed(() => ui.settings.showDescription && !!props.group.description)
const groupTimeLabel = computed(() => formatTimestampLabel(groupTimestamp(props.group, ui.now), new Date(ui.now)))

function countRecursive(nodes: any[]): { done: number; total: number } {
  let done = 0, total = 0
  for (const n of nodes) {
    if (Array.isArray(n.items)) { const r = countRecursive(n.items); done += r.done; total += r.total }
    else { total += 1; if (n.done) done += 1 }
  }
  return { done, total }
}
const count = computed(() => countRecursive(props.group.items))

function toggle() {
  data.updateNode(props.group.id, { expanded: !props.group.expanded } as any)
  ui.setGroupExpanded(props.group.id, !props.group.expanded)
}

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  beginDrag(props.group.id, data.currentListId, props.parentId, e)
}
function onRowClick() {
  if (dragState.value?.active) return // 拖拽结束吞掉本次 click
  toggle()
}
</script>

<style scoped>
.row { display: flex; flex-direction: column; gap: 6px; padding: 9px 12px; border-radius: var(--radius); background: var(--card); margin-bottom: 8px; cursor: pointer; border: 1px solid var(--line); box-shadow: var(--shadow-card); transition: transform 160ms var(--spring), box-shadow 160ms var(--ease), background-color 200ms var(--ease), border-color 200ms var(--ease); }
.row-main { display: flex; align-items: center; gap: 10px; }
.row-actions { display: flex; justify-content: flex-end; gap: 6px; padding-top: 6px; border-top: 1px solid var(--line); margin-top: 2px; }
.row:hover { transform: translateY(-1px); box-shadow: var(--shadow-lift); }
.row.overdue { background: var(--red-soft); border-color: var(--red-line); box-shadow: inset 3px 0 0 var(--red), var(--shadow-card); }
.row.pending { background: var(--blue-soft); border-color: var(--blue-line); box-shadow: inset 3px 0 0 var(--blue), var(--shadow-card); }
.row.done { background: var(--green-soft); border-color: var(--green-line); box-shadow: inset 3px 0 0 var(--green), var(--shadow-card); }
.row.overdue:hover { box-shadow: inset 3px 0 0 var(--red), var(--shadow-lift); }
.row.pending:hover { box-shadow: inset 3px 0 0 var(--blue), var(--shadow-lift); }
.row.done:hover { box-shadow: inset 3px 0 0 var(--green), var(--shadow-lift); }
.title { flex: 1 1 auto; min-width: 120px; }
.expand-btn { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; transition: transform 150ms var(--ease); color: var(--ink-3); font-size: var(--font-sm); cursor: pointer; border-radius: var(--radius-sm); }
.expand-btn:hover { color: var(--ink); background: var(--ink-tint); }
.expand-btn.open { transform: rotate(90deg); }
.name { font-weight: 600; font-size: var(--font-lg); }
.desc { color: var(--ink-2); font-size: var(--font-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.group-meta { font-size: var(--font-xs); font-variant-numeric: tabular-nums; color: var(--ink-3); white-space: nowrap; }
.time-chip { font-size: var(--font-xs); font-variant-numeric: tabular-nums; color: var(--ink-2); background: var(--ink-tint); padding: 2px 8px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
.time-chip.overdue { color: var(--red-ink); background: rgba(224, 82, 82, 0.12); }
.time-chip.pending { color: var(--blue-ink); background: rgba(75, 111, 217, 0.11); }
.time-chip.done { color: var(--green-ink); background: rgba(53, 160, 111, 0.12); }
.mini-btn { background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; color: var(--ink-3); cursor: pointer; font-size: var(--font-xs); transition: color 150ms var(--ease), background-color 150ms var(--ease); }
.mini-btn:hover { background: var(--ink-tint); color: var(--ink); }
.mini-btn.danger:hover { color: var(--red); background: var(--red-soft); }
.group-wrap { position: relative; }
.children { position: relative; margin-left: 18px; padding: 8px 0 8px 14px; }
.indent-line { position: absolute; left: 0; top: 8px; bottom: 8px; width: 2px; background: var(--color-border); border-radius: 1px; }
</style>
