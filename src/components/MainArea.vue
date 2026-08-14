<template>
  <main class="main-area" data-test="main-area">
    <h2>{{ data.currentList?.name ?? '' }}</h2>
  </main>
</template>

<script setup lang="ts">
import { useDataStore } from '../stores/data'
const data = useDataStore()
</script>

<style scoped>
.main-area { flex: 1; overflow-y: auto; padding: 16px; }
</style>
