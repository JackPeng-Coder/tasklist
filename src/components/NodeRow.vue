<template>
  <TaskRow v-if="isGroup(node) === false" :item="node as Item" :depth="depth" />
  <GroupRow v-else :group="node as Group" :depth="depth" />
</template>

<script setup lang="ts">
import { isGroup } from '../logic/status'
import type { Group, Item, TreeNode } from '../types'
import TaskRow from './TaskRow.vue'
import GroupRow from './GroupRow.vue'
defineProps<{ node: TreeNode; depth: number }>()
</script>
