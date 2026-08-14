<template>
  <main class="main-area" data-test="main-area">
    <template v-if="data.currentList">
      <h2 class="list-title">{{ data.currentList.name }}</h2>
      <p v-if="data.currentList.description" class="list-desc">{{ data.currentList.description }}</p>
      <TaskList
        :nodes="data.currentList.items"
        :depth="0"
        :parent-id="null"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @add-item="emit('add-item', $event)"
        @add-group="emit('add-group', $event)"
      />
    </template>
    <div v-else class="empty-tip">暂无列表</div>
  </main>
</template>

<script setup lang="ts">
import { useDataStore } from '../stores/data'
import TaskList from './TaskList.vue'

const data = useDataStore()
const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'remove', id: string): void
  (e: 'add-item', parentId: string | null): void
  (e: 'add-group', parentId: string | null): void
}>()
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 16px 20px; }
.list-title { margin: 0 0 4px; }
.list-desc { margin: 0 0 12px; color: var(--color-muted); font-size: 13px; }
</style>
