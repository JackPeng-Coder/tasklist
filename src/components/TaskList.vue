<template>
  <div class="task-list" :style="{ '--depth': depth }">
    <template v-if="overdueRows.length">
      <div class="group-head overdue" data-test="group-head-overdue"><span class="label">{{ t('status.overdue') }}</span><span class="rule" /></div>
      <template v-for="r in overdueRows" :key="r.node.id">
        <div v-if="r.sep" class="date-sep">{{ formatSep(r.sep) }}</div>
        <NodeRow :node="r.node" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
      </template>
    </template>
    <template v-if="pendingRows.length">
      <div class="group-head pending"><span class="label">{{ t('status.pending') }}</span><span class="rule" /></div>
      <template v-for="r in pendingRows" :key="r.node.id">
        <div v-if="r.sep" class="date-sep">{{ formatSep(r.sep) }}</div>
        <NodeRow :node="r.node" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
      </template>
    </template>
    <template v-if="doneRows.length">
      <div class="group-head done"><span class="label">{{ t('status.done') }}</span><span class="rule" /></div>
      <template v-for="r in doneRows" :key="r.node.id">
        <div v-if="r.sep" class="date-sep">{{ formatSep(r.sep) }}</div>
        <NodeRow :node="r.node" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
      </template>
    </template>
    <div v-if="isEmpty" class="empty-tip" data-test="empty-tip">{{ t('empty.noItems') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import { groupedNodes } from '../logic/sort'
import { formatDateLabel, toISO } from '../logic/dates'
import { isGroup, groupTimestamp } from '../logic/status'
import type { TreeNode } from '../types'
import NodeRow from './NodeRow.vue'

const props = defineProps<{ nodes: TreeNode[]; depth: number; parentId: string | null }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void; (e: 'add-item', parentId: string): void; (e: 'add-group', parentId: string): void }>()
const { t } = useI18n()
const ui = useUiStore()
const grouped = computed(() => groupedNodes(props.nodes, ui.now))
const isEmpty = computed(() => props.nodes.length === 0)

function withSeparators(nodes: TreeNode[], now: number): Array<{ node: TreeNode; sep?: string }> {
  const out: Array<{ node: TreeNode; sep?: string }> = []
  let prev: string | null = null
  for (const n of nodes) {
    const label = separatorLabel(n, now)
    if (label !== prev) { out.push({ node: n, sep: label }); prev = label }
    else out.push({ node: n })
  }
  return out
}

// 组合无 date 字段，其时间由递归计算得出，与行内时间 chip 同源
function separatorLabel(node: TreeNode, now: number): string {
  if (isGroup(node)) {
    const ts = groupTimestamp(node, now)
    return Number.isFinite(ts) ? formatDateLabel(toISO(new Date(ts)), new Date(now)) : 'nodate'
  }
  const date = (node as { date?: string }).date
  return date ? formatDateLabel(date, new Date(now)) : 'nodate'
}

const dateKeys = new Set(['yesterday', 'today', 'tomorrow', 'dayAfterTomorrow', 'nodate'])
function formatSep(sep: string) {
  return dateKeys.has(sep) ? t(`date.${sep}`) : sep
}

const overdueRows = computed(() => withSeparators(grouped.value.overdue, ui.now))
const pendingRows = computed(() => withSeparators(grouped.value.pending, ui.now))
const doneRows = computed(() => withSeparators(grouped.value.done, ui.now))
</script>

<style scoped>
.group-head { display: flex; align-items: center; gap: 10px; font-size: var(--font-sm); margin: var(--gap-lg) 0 var(--gap-sm); }
/* 组合展开后的第一个嵌套分节标题紧贴组合行（组内耦合最紧，只留 children 的 xs 上边距），后续分节标题保持正常间距 */
.children .group-head:first-of-type { margin-top: 0; }
.group-head .label { font-weight: 600; white-space: nowrap; }
.group-head.overdue { color: var(--color-overdue); }
.group-head.pending { color: var(--color-pending); }
.group-head.done { color: var(--color-done); }
.group-head .rule { flex: 1; height: 1px; background: color-mix(in srgb, currentColor 22%, transparent); }
.date-sep { color: var(--color-muted); font-size: var(--font-xs); margin: var(--gap-sep) 0; }
.empty-tip { color: var(--ink-3); }
</style>
