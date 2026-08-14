<template>
  <Sidebar @new-list="openNewList" @delete-list="onDeleteList" />
  <MainArea @edit="openEditNode" @remove="onRemoveNode" @add-item="openNewItem" @add-group="openNewGroup" />
  <RightRail @add-item="() => openNewItem(null)" @add-group="() => openNewGroup(null)" @open-settings="settingsOpen = true" />
  <ModalDialog :open="editingTarget !== null" @close="editingTarget = null">
    <template #title>
      <h3>{{ editingId ? '编辑' : '新建' }} {{ editingTarget === 'item' ? '事项' : editingTarget === 'group' ? '组合' : '列表' }}</h3>
    </template>
    <ItemForm
      v-if="editingTarget === 'item'"
      v-model:name="formName"
      v-model:description="formDescription"
      v-model:date="formDate"
      v-model:time="formTime"
      @submit="saveItemForm"
    />
    <GroupForm v-else-if="editingTarget === 'group'" v-model:name="formName" v-model:description="formDescription" @submit="saveGroupForm" />
    <ListForm v-else-if="editingTarget === 'list'" v-model:name="formName" v-model:description="formDescription" @submit="saveListForm" />
    <template #actions>
      <button class="btn" @click="editingTarget = null">取消</button>
      <button class="btn primary" data-test="save" :disabled="!formName.trim()" @click="saveForm">确认</button>
    </template>
  </ModalDialog>
  <ConfirmDialog :open="deletingType !== null" title="确认删除" message="删除后不可恢复" @confirm="confirmDelete" @cancel="onCancelDelete" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import { useDataStore } from './stores/data'
import { useUiStore } from './stores/ui'
import { createItem, createGroup, type Item } from './types'
import { saveTaskData } from './storage'
import Sidebar from './components/Sidebar.vue'
import MainArea from './components/MainArea.vue'
import RightRail from './components/RightRail.vue'
import ModalDialog from './components/ModalDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ItemForm from './components/ItemForm.vue'
import GroupForm from './components/GroupForm.vue'
import ListForm from './components/ListForm.vue'

const data = useDataStore()
const ui = useUiStore()
const settingsOpen = ref(false)

const editingTarget = ref<'item' | 'group' | 'list' | null>(null)
const editingId = ref<string | null>(null)
const editingParentId = ref<string | null>(null)
const formName = ref('')
const formDescription = ref('')
const formDate = ref<string>()
const formTime = ref<string>()
const deletingId = ref<string | null>(null)
const deletingType = ref<'list' | 'node' | null>(null)

let saveTimer: number | undefined
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTaskData({ version: 1, lists: data.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } })
  }, 300)
}

watch(() => [data.lists, data.currentListId, ui.settings, ui.sidebarCollapsed, ui.expandedGroupIds], scheduleSave, { deep: true })

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

function openNewItem(parentId: string | null) {
  editingTarget.value = 'item'; editingId.value = null; editingParentId.value = parentId
  formName.value = ''; formDescription.value = ''; formDate.value = undefined; formTime.value = undefined
}
function openNewGroup(parentId: string | null) {
  editingTarget.value = 'group'; editingId.value = null; editingParentId.value = parentId
  formName.value = ''; formDescription.value = ''
}
function openNewList() {
  editingTarget.value = 'list'; editingId.value = null
  formName.value = ''; formDescription.value = ''
}
function openEditNode(id: string) {
  if (!data.currentList) return
  const node = findNodeDeep(data.currentList.items, id)
  if (!node) return
  editingTarget.value = 'item' in node ? 'item' : 'group'
  editingId.value = id
  formName.value = node.name; formDescription.value = node.description
  formDate.value = (node as Item).date; formTime.value = (node as Item).time
}
function findNodeDeep(nodes: any[], id: string): any {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray(n.items)) { const r = findNodeDeep(n.items, id); if (r) return r }
  }
  return null
}
function saveItemForm() {
  if (!formName.value.trim()) return
  const patch = { name: formName.value.trim(), description: formDescription.value, date: formDate.value, time: formTime.value }
  if (editingId.value) data.updateNode(editingId.value, patch as any)
  else data.addNode(editingParentId.value, { ...createItem(formName.value.trim()), description: formDescription.value, date: formDate.value, time: formTime.value } as any)
  editingTarget.value = null
}
function saveGroupForm() {
  if (!formName.value.trim()) return
  if (editingId.value) data.updateNode(editingId.value, { name: formName.value.trim(), description: formDescription.value } as any)
  else data.addNode(editingParentId.value, { ...createGroup(formName.value.trim()), description: formDescription.value } as any)
  editingTarget.value = null
}
function saveListForm() {
  if (!formName.value.trim()) return
  if (editingId.value) data.renameList(editingId.value, formName.value.trim())
  else data.addList(formName.value.trim(), formDescription.value)
  editingTarget.value = null
}
function saveForm() {
  if (editingTarget.value === 'item') saveItemForm()
  else if (editingTarget.value === 'group') saveGroupForm()
  else if (editingTarget.value === 'list') saveListForm()
}
function onRemoveNode(id: string) {
  deletingId.value = id; deletingType.value = 'node'
}
function onDeleteList(id: string) {
  deletingId.value = id; deletingType.value = 'list'
}
function onCancelDelete() {
  deletingId.value = null; deletingType.value = null
}
function confirmDelete() {
  if (deletingType.value === 'list' && deletingId.value) data.deleteList(deletingId.value)
  if (deletingType.value === 'node' && deletingId.value) data.deleteNode(deletingId.value)
  deletingId.value = null; deletingType.value = null
}
</script>

<style scoped>
.btn { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; }
.btn.primary { background: var(--color-pending); color: #fff; border: none; }
.btn.primary:disabled { opacity: .5; cursor: not-allowed; }
</style>
