<template>
  <div class="task-list" :style="{ '--depth': depth }">
    <template v-if="grouped.overdue.length">
      <div class="group-head overdue" data-test="group-head-overdue">已逾期 <span class="rule" /></div>
      <NodeRow v-for="n in grouped.overdue" :key="n.id" :node="n" :depth="depth" />
    </template>
    <template v-if="grouped.pending.length">
      <div class="group-head pending">未完成 <span class="rule" /></div>
      <NodeRow v-for="n in grouped.pending" :key="n.id" :node="n" :depth="depth" />
    </template>
    <template v-if="grouped.done.length">
      <div class="group-head done">已完成 <span class="rule" /></div>
      <NodeRow v-for="n in grouped.done" :key="n.id" :node="n" :depth="depth" />
    </template>
    <div v-if="isEmpty" class="empty-tip" data-test="empty-tip">暂无事项</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '../stores/ui'
import { groupedNodes } from '../logic/sort'
import type { TreeNode } from '../types'
import NodeRow from './NodeRow.vue'

const props = defineProps<{ nodes: TreeNode[]; depth: number }>()
const ui = useUiStore()
const grouped = computed(() => groupedNodes(props.nodes, ui.now))
const isEmpty = computed(() => props.nodes.length === 0)
</script>
