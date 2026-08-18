<template>
  <Sidebar @new-list="openNewList" @delete-list="onDeleteList" @rename-list="openRenameList" />
  <MainArea @edit="openEditNode" @remove="onRemoveNode" @add-item="openNewItem" @add-group="openNewGroup" />
  <RightRail @add-item="() => openNewItem(null)" @add-group="() => openNewGroup(null)" @open-settings="settingsOpen = true" />
  <ModalDialog :open="editingTarget !== null" @close="editingTarget = null">
    <template #title>
      <h3>{{ dialogTitle }}</h3>
    </template>
    <ItemForm
      v-if="editingTarget === 'item'"
      v-model:name="formName"
      v-model:description="formDescription"
      v-model:date="formDate"
      v-model:time="formTime"
      :invalid="formItemInvalid"
      @update:invalid="formItemInvalid = $event"
      @submit="saveItemForm"
    />
    <GroupForm v-else-if="editingTarget === 'group'" v-model:name="formName" v-model:description="formDescription" @submit="saveGroupForm" />
    <ListForm v-else-if="editingTarget === 'list'" v-model:name="formName" v-model:description="formDescription" @submit="saveListForm" />
    <template #actions>
      <button class="btn" @click="editingTarget = null">{{ t('common.cancel') }}</button>
      <button class="btn primary" data-test="save" :disabled="!formName.trim() || (editingTarget === 'item' && formItemInvalid)" @click="saveForm">{{ t('common.confirm') }}</button>
    </template>
  </ModalDialog>
  <ModalDialog :open="settingsOpen" @close="settingsOpen = false">
    <template #title><h3>{{ t('settings.title') }}</h3></template>
    <SettingsPanel @import="onImport" @export="onExport" @about="onAbout" />
    <template #actions>
      <button class="btn" @click="settingsOpen = false">{{ t('common.cancel') }}</button>
    </template>
  </ModalDialog>
  <ConfirmDialog :open="deletingType !== null" :title="t('confirm.title')" :message="t('confirm.message')" @confirm="confirmDelete" @cancel="onCancelDelete" />
    <ConfirmDialog :open="importConfirmOpen" :title="t('settings.importTitle')" :message="t('settings.importMessage')" :confirm-text="t('common.confirm')" @confirm="confirmImport" @cancel="importConfirmOpen = false" />
    <AlertDialog :open="alertOpen" :title="alertTitle" :message="alertMessage" @close="alertOpen = false" />
    <PromptDialog :open="promptOpen" :title="promptTitle" :default-value="promptDefault" @confirm="onPromptConfirm" @cancel="promptOpen = false" />
    <input ref="fileInput" type="file" accept="application/json" data-test="import-input" class="hidden-input" @change="onFileChange" />

</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from './stores/data'
import { useUiStore } from './stores/ui'
import { createItem, createGroup, type Item, type TaskData } from './types'
import { loadTaskData, saveTaskData } from './storage'
import { isGroup } from './logic/status'
import { buildExportBlob, parseImportText } from './logic/io'
import { mergeTaskData } from './logic/merge'
import Sidebar from './components/Sidebar.vue'
import MainArea from './components/MainArea.vue'
import RightRail from './components/RightRail.vue'
import ModalDialog from './components/ModalDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import AlertDialog from './components/AlertDialog.vue'
import PromptDialog from './components/PromptDialog.vue'
import ItemForm from './components/ItemForm.vue'
import GroupForm from './components/GroupForm.vue'
import ListForm from './components/ListForm.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { isRedoShortcut, isUndoShortcut } from './composables/useUndoRedo'
import i18n from './i18n'
import pkg from '../package.json'

const { t } = useI18n()
const data = useDataStore()
const ui = useUiStore()
const settingsOpen = ref(false)

const dialogTitle = computed(() => {
  const editing = editingId.value !== null
  if (editingTarget.value === 'item') return t(editing ? 'item.edit' : 'item.new')
  if (editingTarget.value === 'group') return t(editing ? 'group.edit' : 'group.new')
  return t(editing ? 'list.edit' : 'list.new')
})

const editingTarget = ref<'item' | 'group' | 'list' | null>(null)
const editingId = ref<string | null>(null)
const editingParentId = ref<string | null>(null)
const formName = ref('')
const formDescription = ref('')
const formDate = ref<string>()
const formTime = ref<string>()
const formItemInvalid = ref(false)
const deletingId = ref<string | null>(null)
const deletingType = ref<'list' | 'node' | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const pendingImport = ref<TaskData | null>(null)
const importConfirmOpen = ref(false)

const alertOpen = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const promptOpen = ref(false)
const promptTitle = ref('')
const promptDefault = ref('')
const promptCallback = ref<((value: string | null) => void) | null>(null)

function showAlert(title: string, message: string) {
  alertTitle.value = title
  alertMessage.value = message
  alertOpen.value = true
}
function showPrompt(title: string, defaultValue: string): Promise<string | null> {
  promptTitle.value = title
  promptDefault.value = defaultValue
  promptOpen.value = true
  return new Promise((resolve) => {
    promptCallback.value = resolve
  })
}
function onPromptConfirm(value: string | null) {
  promptOpen.value = false
  promptCallback.value?.(value)
  promptCallback.value = null
}


let saveTimer: number | undefined
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTaskData({ version: 1, lists: data.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } })
  }, 300)
}

watch(() => [data.lists, data.currentListId, ui.settings, ui.sidebarCollapsed, ui.expandedGroupIds], scheduleSave, { deep: true })

watch(() => ui.settings.lang, (lang) => {
  i18n.global.locale.value = lang as 'zh' | 'en'
  localStorage.setItem('tasklist:lang', lang)
})

let interval: number | undefined
onMounted(() => {
  data.init()
  if (data.recovered) showAlert(t('common.notice'), t('settings.recovered'))
  const saved = loadTaskData()
  ui.settings = saved.data.settings
  ui.sidebarCollapsed = saved.data.ui.sidebarCollapsed
  ui.expandedGroupIds = saved.data.ui.expandedGroupIds
  const lang = saved.data.settings.lang
  if (lang === 'zh' || lang === 'en') {
    i18n.global.locale.value = lang
    localStorage.setItem('tasklist:lang', lang)
  }
  ui.applyToDOM()
  interval = window.setInterval(ui.touchNow, 60_000)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('keydown', onUndoRedoKey)
})
onBeforeUnmount(() => {
  clearInterval(interval)
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('keydown', onUndoRedoKey)
})
function onUndoRedoKey(e: KeyboardEvent) {
  if (isUndoShortcut(e)) { e.preventDefault(); data.undo() }
  else if (isRedoShortcut(e)) { e.preventDefault(); data.redo() }
}
function onVisibility() {
  if (document.visibilityState === 'visible') ui.touchNow()
}

function openNewItem(parentId: string | null) {
  editingTarget.value = 'item'; editingId.value = null; editingParentId.value = parentId
  formName.value = ''; formDescription.value = ''; formDate.value = undefined; formTime.value = undefined; formItemInvalid.value = false
}
function openNewGroup(parentId: string | null) {
  editingTarget.value = 'group'; editingId.value = null; editingParentId.value = parentId
  formName.value = ''; formDescription.value = ''
}
function openNewList() {
  editingTarget.value = 'list'; editingId.value = null
  formName.value = ''; formDescription.value = ''
}
async function openRenameList(list: { id: string; name: string }) {
  const name = await showPrompt(t('sidebar.renameList'), list.name)
  if (name?.trim()) data.renameList(list.id, name.trim())
}
function openEditNode(id: string) {
  if (!data.currentList) return
  const node = findNodeDeep(data.currentList.items, id)
  if (!node) return
  editingTarget.value = isGroup(node) ? 'group' : 'item'
  editingId.value = id
  formName.value = node.name; formDescription.value = node.description
  formDate.value = (node as Item).date; formTime.value = (node as Item).time; formItemInvalid.value = false
}
function findNodeDeep(nodes: any[], id: string): any {
  for (const n of nodes) {
    if (n.id === id) return n
    if (Array.isArray(n.items)) { const r = findNodeDeep(n.items, id); if (r) return r }
  }
  return null
}
function saveItemForm() {
  if (!formName.value.trim() || formItemInvalid.value) return
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

function onImport() {
  fileInput.value?.click()
}
function onExport() {
  doExport()
}
function onAbout() {
  showAlert(t('settings.about'), `TaskList v${pkg.version}`)
}

function doExport() {
  const taskData: TaskData = { version: 1, lists: data.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } }
  const blob = buildExportBlob(taskData)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasklist-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) onImportFile(file)
  input.value = ''
}

function onImportFile(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    const r = parseImportText(String(reader.result))
    if (!r.ok) { showAlert(t('common.notice'), t('settings.importFailed')); return }
    pendingImport.value = r.data
    importConfirmOpen.value = true
  }
  reader.readAsText(file)
}

function confirmImport() {
  if (!pendingImport.value) return
  const merged = mergeTaskData({ version: 1, lists: data.lists, settings: ui.settings, ui: { sidebarCollapsed: ui.sidebarCollapsed, expandedGroupIds: ui.expandedGroupIds } }, pendingImport.value)
  data.lists = merged.lists
  ui.settings = merged.settings
  ui.sidebarCollapsed = merged.ui.sidebarCollapsed
  ui.expandedGroupIds = merged.ui.expandedGroupIds
  ui.applyToDOM()
  pendingImport.value = null
  importConfirmOpen.value = false
  showAlert(t('common.notice'), t('settings.imported'))
}
</script>

<style scoped>
.btn { padding: 5px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); cursor: pointer; font-size: var(--font-sm); font-weight: 500; box-shadow: var(--shadow-card); transition: color 150ms var(--ease), border-color 150ms var(--ease), background-color 150ms var(--ease), transform 140ms var(--spring), scale 200ms var(--spring); }
.btn:not(:disabled):active { scale: 0.94; transition: scale 60ms var(--ease); }
.btn:hover { color: var(--blue-ink); border-color: var(--blue); box-shadow: var(--shadow-lift); }
.btn.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
.btn.primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); color: #fff; }
.btn.primary:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
.hidden-input { display: none; }
</style>
