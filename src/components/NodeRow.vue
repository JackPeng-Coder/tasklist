<template>
  <TaskRow v-if="isGroup(node) === false" :item="node as Item" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" />
  <GroupRow v-else :group="node as Group" :depth="depth" :parent-id="parentId" @edit="emit('edit', $event)" @remove="emit('remove', $event)" @add-item="emit('add-item', $event)" @add-group="emit('add-group', $event)" />
</template>

<script setup lang="ts">
import { isGroup } from '../logic/status'
import type { Group, Item, TreeNode } from '../types'
import TaskRow from './TaskRow.vue'
import GroupRow from './GroupRow.vue'
defineProps<{ node: TreeNode; depth: number; parentId: string | null }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void; (e: 'add-item', parentId: string): void; (e: 'add-group', parentId: string): void }>()
</script>
