<template>
  <div>
    <div class="row" :class="statusClass" data-test="row" @click="toggle">
      <span class="arrow" :class="{ open: group.expanded }" data-test="arrow">▸</span>
      <span class="name">{{ group.name }}</span>
      <span v-if="showDesc && group.description" class="desc"> · {{ group.description }}</span>
      <span class="spacer" />
      <span v-if="group.date" class="meta">{{ dateLabel }}</span>
      <span class="meta">{{ count.done }}/{{ count.total }} 已完成</span>
      <template v-if="ui.editMode">
        <button class="mini-btn" @click.stop="$emit('edit', group.id)">编辑</button>
        <button class="mini-btn" @click.stop="$emit('add-item', group.id)">+事项</button>
        <button class="mini-btn" @click.stop="$emit('add-group', group.id)">+组合</button>
        <button class="mini-btn danger" @click.stop="$emit('remove', group.id)">删除</button>
      </template>
    </div>
    <div v-if="group.expanded" class="children">
      <div class="indent-line" />
      <TaskList :nodes="group.items" :depth="depth + 1" @edit="$emit('edit', $event)" @remove="$emit('remove', $event)" @add-item="$emit('add-item', $event)" @add-group="$emit('add-group', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { formatDateLabel } from '../logic/dates'
import { groupStatus } from '../logic/status'
import type { Group } from '../types'
import TaskList from './TaskList.vue'

const props = defineProps<{ group: Group; depth: number }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void; (e: 'add-item', parentId: string): void; (e: 'add-group', parentId: string): void }>()
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
  return label + (props.group.time ? ` ${props.group.time}` : '')
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
</script>

<style scoped>
.row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: var(--color-surface); margin-bottom: 6px; cursor: pointer; border: 1px solid var(--color-border); }
.overdue { background: color-mix(in srgb, var(--color-overdue-deep) 15%, var(--color-surface)); }
.pending { background: color-mix(in srgb, var(--color-pending-deep) 12%, var(--color-surface)); }
.done { background: color-mix(in srgb, var(--color-done-deep) 12%, var(--color-surface)); }
.arrow { display: inline-block; width: 16px; transition: transform .15s; color: var(--color-muted); }
.arrow.open { transform: rotate(90deg); }
.name { font-weight: 600; }
.desc { color: var(--color-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.meta { color: var(--color-muted); font-size: 12px; }
.mini-btn { background: none; border: none; color: var(--color-muted); cursor: pointer; font-size: 12px; }
.mini-btn.danger:hover { color: var(--color-overdue); }
.children { position: relative; margin-left: 18px; padding-left: 14px; }
.indent-line { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--color-border); }
</style>
