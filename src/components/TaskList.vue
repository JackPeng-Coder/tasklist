<template>
  <div class="task-list" :style="{ '--depth': depth }">
    <template v-if="overdueRows.length">
      <div class="group-head overdue" data-test="group-head-overdue">已逾期 <span class="rule" /></div>
      <template v-for="r in overdueRows" :key="r.node.id">
        <div v-if="r.sep" class="date-sep">{{ r.sep }}</div>
        <NodeRow :node="r.node" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
      </template>
    </template>
    <template v-if="pendingRows.length">
      <div class="group-head pending">未完成 <span class="rule" /></div>
      <template v-for="r in pendingRows" :key="r.node.id">
        <div v-if="r.sep" class="date-sep">{{ r.sep }}</div>
        <NodeRow :node="r.node" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
      </template>
    </template>
    <template v-if="doneRows.length">
      <div class="group-head done">已完成 <span class="rule" /></div>
      <template v-for="r in doneRows" :key="r.node.id">
        <div v-if="r.sep" class="date-sep">{{ r.sep }}</div>
        <NodeRow :node="r.node" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
      </template>
    </template>
    <div v-if="isEmpty" class="empty-tip" data-test="empty-tip">暂无事项</div>
    <DragPreview :state="dragState" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useUiStore } from '../stores/ui'
import { useDataStore } from '../stores/data'
import { groupedNodes } from '../logic/sort'
import { formatDateLabel } from '../logic/dates'
import { dragState, resetDrag, setDropHandler } from '../composables/useDrag'
import type { TreeNode } from '../types'
import NodeRow from './NodeRow.vue'
import DragPreview from './DragPreview.vue'

const props = defineProps<{ nodes: TreeNode[]; depth: number; parentId: string | null }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void; (e: 'add-item', parentId: string): void; (e: 'add-group', parentId: string): void }>()
const ui = useUiStore()
const data = useDataStore()
const grouped = computed(() => groupedNodes(props.nodes, ui.now))
const isEmpty = computed(() => props.nodes.length === 0)

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

function withSeparators(nodes: TreeNode[], now: number): Array<{ node: TreeNode; sep?: string }> {
  const out: Array<{ node: TreeNode; sep?: string }> = []
  let prev: string | null = null
  for (const n of nodes) {
    const date = (n as { date?: string }).date
    if (date) {
      const label = formatDateLabel(date, new Date(now))
      if (label !== prev) { out.push({ node: n, sep: label }); prev = label }
      else out.push({ node: n })
    } else {
      out.push({ node: n })
    }
  }
  return out
}

const overdueRows = computed(() => withSeparators(grouped.value.overdue, ui.now))
const pendingRows = computed(() => withSeparators(grouped.value.pending, ui.now))
const doneRows = computed(() => withSeparators(grouped.value.done, ui.now))
</script>

<style scoped>
.group-head { display: flex; align-items: center; gap: 8px; font-size: 13px; margin: 10px 0 4px; }
.group-head.overdue { color: var(--color-overdue); }
.group-head.pending { color: var(--color-pending); }
.group-head.done { color: var(--color-done); }
.group-head .rule { flex: 1; border-bottom: 1px dashed var(--color-border); }
.date-sep { color: var(--color-muted); font-size: 12px; margin: 4px 0 2px; }
</style>
