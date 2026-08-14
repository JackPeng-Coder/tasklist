<template>
  <div class="group-wrap">
    <div class="row" :class="statusClass" data-test="row" :data-drop-id="group.id" data-drop-kind="group" @pointerdown="onPointerDown" @click="onRowClick">
      <span class="arrow" :class="{ open: group.expanded }" data-test="arrow">▸</span>
      <span class="name">{{ group.name }}</span>
      <span v-if="showDesc && group.description" class="desc"> · {{ group.description }}</span>
      <span class="spacer" />
      <span v-if="group.date" class="meta">{{ dateLabel }}</span>
      <span class="meta">{{ t('status.doneCount', { done: count.done, total: count.total }) }}</span>
      <template v-if="ui.editMode">
        <button class="mini-btn" @click.stop="$emit('edit', group.id)">{{ t('common.edit') }}</button>
        <button class="mini-btn" @click.stop="$emit('add-item', group.id)">{{ t('rail.addItem') }}</button>
        <button class="mini-btn" @click.stop="$emit('add-group', group.id)">{{ t('rail.addGroup') }}</button>
        <button class="mini-btn danger" @click.stop="$emit('remove', group.id)">{{ t('common.delete') }}</button>
      </template>
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
import { formatDateLabel } from '../logic/dates'
import { groupStatus } from '../logic/status'
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
const dateLabel = computed(() => {
  if (!props.group.date) return ''
  const label = formatDateLabel(props.group.date, new Date(ui.now))
  const text = label === 'yesterday' || label === 'today' || label === 'tomorrow' || label === 'dayAfterTomorrow'
    ? t(`date.${label}`)
    : label
  return text + (props.group.time ? ` ${props.group.time}` : '')
})

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
.row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--radius-md); background: var(--color-surface); margin-bottom: 8px; cursor: pointer; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); transition: box-shadow .15s, transform .15s; }
.row:hover { box-shadow: var(--shadow-md); }
.overdue { background: color-mix(in srgb, var(--color-overdue-deep) 12%, var(--color-surface)); border-color: color-mix(in srgb, var(--color-overdue) 35%, var(--color-border)); }
.pending { background: color-mix(in srgb, var(--color-pending-deep) 10%, var(--color-surface)); border-color: color-mix(in srgb, var(--color-pending) 35%, var(--color-border)); }
.done { background: color-mix(in srgb, var(--color-done-deep) 10%, var(--color-surface)); border-color: color-mix(in srgb, var(--color-done) 35%, var(--color-border)); }
.arrow { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; transition: transform .15s; color: var(--color-muted); font-size: var(--font-sm); }
.arrow.open { transform: rotate(90deg); }
.name { font-weight: 700; font-size: var(--font-md); }
.desc { color: var(--color-muted); font-size: var(--font-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.meta { color: var(--color-muted); font-size: var(--font-xs); }
.mini-btn { background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; color: var(--color-muted); cursor: pointer; font-size: var(--font-xs); transition: color .15s, background .15s, border-color .15s; }
.mini-btn:hover { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
.mini-btn.danger:hover { color: var(--color-overdue); background: rgba(224, 62, 62, .08); border-color: rgba(224, 62, 62, .25); }
.group-wrap { position: relative; }
.children { position: relative; margin-left: 18px; padding: 6px 0 2px 14px; }
.indent-line { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--color-border); }
</style>
