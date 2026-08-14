<template>
  <Sidebar />
  <MainArea />
  <RightRail @add-item="onAddItem" @add-group="onAddGroup" @open-settings="settingsOpen = true" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import { useDataStore } from './stores/data'
import { useUiStore } from './stores/ui'
import { createItem, createGroup, type TreeNode } from './types'
import { saveTaskData } from './storage'
import Sidebar from './components/Sidebar.vue'
import MainArea from './components/MainArea.vue'
import RightRail from './components/RightRail.vue'

const data = useDataStore()
const ui = useUiStore()
const settingsOpen = ref(false)

let saveTimer: number | undefined
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTaskData({ version: 1, lists: data.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } })
  }, 300)
}

watch(() => [data.lists, data.currentListId, ui.$state], scheduleSave, { deep: true })

let interval: number | undefined
onMounted(() => {
  data.init()
  ui.applyToDOM()
  interval = window.setInterval(ui.touchNow, 60_000)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  clearInterval(interval)
  document.removeEventListener('visibilitychange', onVisibility)
})
function onVisibility() {
  if (document.visibilityState === 'visible') ui.touchNow()
}

function addNodeToCurrent(node: TreeNode) {
  if (!data.currentList) return
  data.addNode(null, node)
}
function onAddItem() { addNodeToCurrent(createItem('')) }
function onAddGroup() { addNodeToCurrent(createGroup('')) }
</script>
