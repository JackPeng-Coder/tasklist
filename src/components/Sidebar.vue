<template>
  <aside class="sidebar" :class="{ open: !ui.sidebarCollapsed }">
    <div class="sidebar-head">
      <button class="icon-btn" data-test="toggle-sidebar" @click="ui.toggleSidebar()">
        {{ ui.sidebarCollapsed ? '☰' : '✕' }}
      </button>
    </div>
    <div class="sidebar-body" />
  </aside>
</template>

<script setup lang="ts">
import { useUiStore } from '../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.sidebar { width: 240px; flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; }
@media (max-width: 720px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; transform: translateX(-100%); transition: transform .2s; }
  .sidebar.open { transform: translateX(0); }
}
.sidebar-head { padding: 8px; }
.icon-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text); }
</style>
