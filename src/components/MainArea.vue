<template>
  <main class="main-area" data-test="main-area">
    <template v-if="data.currentList">
      <h2 class="list-title">{{ data.currentList.name }}</h2>
      <p v-if="data.currentList.description" class="list-desc">{{ data.currentList.description }}</p>
      <TaskList :nodes="data.currentList.items" :depth="0" @add-item="onAddItem" @add-group="onAddGroup" />
    </template>
    <div v-else class="empty-tip">暂无列表</div>
  </main>
</template>

<script setup lang="ts">
import { useDataStore } from '../stores/data'
import { createGroup, createItem } from '../types'
import TaskList from './TaskList.vue'

const data = useDataStore()

function onAddItem(parentId: string | null) {
  if (!data.currentList) return
  data.addNode(parentId, createItem(''))
}
function onAddGroup(parentId: string | null) {
  if (!data.currentList) return
  data.addNode(parentId, createGroup(''))
}
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 16px 20px; }
.list-title { margin: 0 0 4px; }
.list-desc { margin: 0 0 12px; color: var(--color-muted); font-size: 13px; }
</style>
