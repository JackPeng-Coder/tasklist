<template>
  <div class="row" :class="statusClass" data-test="row" :data-drop-id="item.id" :data-drop-kind="item.done ? undefined : 'item'" @pointerdown="onPointerDown" @click="onRowClick">
    <span class="dot" :class="{ done: item.done }" data-test="dot" />
    <span class="name">{{ item.name }}</span>
    <span v-if="showDesc && item.description" class="desc"> · {{ item.description }}</span>
    <span class="spacer" />
    <span v-if="item.date" class="meta">{{ dateLabel }}</span>
    <template v-if="ui.editMode">
      <button class="mini-btn" @click.stop="$emit('edit', item.id)">编辑</button>
      <button class="mini-btn danger" @click.stop="$emit('remove', item.id)">删除</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { formatDateLabel } from '../logic/dates'
import { itemTimestamp, nodeStatus } from '../logic/status'
import { beginDrag, dragState } from '../composables/useDrag'
import type { Item } from '../types'

const props = defineProps<{ item: Item; depth: number; parentId: string | null }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void }>()
const data = useDataStore()
const ui = useUiStore()

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  beginDrag(props.item.id, data.currentListId, props.parentId, e)
}
function onRowClick() {
  if (dragState.value?.active) return // 拖拽结束吞掉本次 click
  data.toggleDone(props.item.id)
}

const statusClass = computed(() => {
  const s = nodeStatus(props.item, ui.now)
  return s === 'overdue' ? 'overdue' : s === 'done' ? 'done' : 'pending'
})
const showDesc = computed(() => ui.settings.showDescription && !!props.item.description)
const dateLabel = computed(() => {
  if (!props.item.date) return ''
  const label = formatDateLabel(props.item.date, new Date(ui.now))
  const t = props.item.time ?? ''
  return label === 'yesterday' || label === 'today' || label === 'tomorrow' || label === 'dayAfterTomorrow'
    ? label + (t ? ` ${t}` : '')
    : label + (t ? ` ${t}` : '')
})
</script>

<style scoped>
.row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: var(--color-surface); margin-bottom: 6px; cursor: pointer; }
.overdue { background: color-mix(in srgb, var(--color-overdue) 12%, var(--color-surface)); }
.pending { background: color-mix(in srgb, var(--color-pending) 8%, var(--color-surface)); }
.done { background: color-mix(in srgb, var(--color-done) 8%, var(--color-surface)); }
.dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--color-muted); flex-shrink: 0; }
.dot.done { border-color: var(--color-done); background: var(--color-done); }
.name { font-size: 15px; }
.desc { color: var(--color-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.meta { color: var(--color-muted); font-size: 12px; }
.mini-btn { background: none; border: none; color: var(--color-muted); cursor: pointer; font-size: 12px; }
.mini-btn.danger:hover { color: var(--color-overdue); }
</style>
