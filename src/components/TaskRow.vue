<template>
  <div class="row" :class="statusClass" data-test="row" :data-drop-id="item.id" :data-drop-kind="item.done ? undefined : 'item'" @pointerdown="onPointerDown" @click="onRowClick">
    <span class="dot" :class="{ done: item.done }" data-test="dot" />
    <span class="name">{{ item.name }}</span>
    <span v-if="showDesc && item.description" class="desc"> · {{ item.description }}</span>
    <span class="spacer" />
    <span v-if="item.date" class="meta">{{ dateLabel }}</span>
    <template v-if="ui.editMode">
      <button class="mini-btn" @click.stop="$emit('edit', item.id)">{{ t('common.edit') }}</button>
      <button class="mini-btn danger" @click.stop="$emit('remove', item.id)">{{ t('common.delete') }}</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '../stores/data'
import { useUiStore } from '../stores/ui'
import { formatDateLabel } from '../logic/dates'
import { itemTimestamp, nodeStatus } from '../logic/status'
import { beginDrag, dragState } from '../composables/useDrag'
import type { Item } from '../types'

const props = defineProps<{ item: Item; depth: number; parentId: string | null }>()
const emit = defineEmits<{ (e: 'edit', id: string): void; (e: 'remove', id: string): void }>()
const { t } = useI18n()
const data = useDataStore()
const ui = useUiStore()

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  beginDrag(props.item.id, data.currentListId, props.parentId, e)
}
function onRowClick() {
  if (dragState.value?.active) return // 拖拽结束吞掉本次 click
  data.toggleDone(props.item.id)
}

const statusClass = computed(() => {
  const s = nodeStatus(props.item, ui.now)
  return s === 'overdue' ? 'overdue' : s === 'done' ? 'done' : 'pending'
})
const showDesc = computed(() => ui.settings.showDescription && !!props.item.description)
const dateLabel = computed(() => {
  if (!props.item.date) return ''
  const label = formatDateLabel(props.item.date, new Date(ui.now))
  const time = props.item.time ?? ''
  const text = label === 'yesterday' || label === 'today' || label === 'tomorrow' || label === 'dayAfterTomorrow'
    ? t(`date.${label}`)
    : label
  return text + (time ? ` ${time}` : '')
})
</script>

<style scoped>
.row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--radius-md); background: var(--color-surface); margin-bottom: 8px; cursor: pointer; border: 1px solid transparent; box-shadow: var(--shadow-sm); transition: box-shadow .15s, transform .15s; }
.row:hover { box-shadow: var(--shadow-md); }
.overdue { background: color-mix(in srgb, var(--color-overdue) 10%, var(--color-surface)); }
.pending { background: color-mix(in srgb, var(--color-pending) 7%, var(--color-surface)); }
.done { background: color-mix(in srgb, var(--color-done) 7%, var(--color-surface)); }
.dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--color-muted); flex-shrink: 0; transition: border-color .15s, background .15s; }
.dot.done { border-color: var(--color-done); background: var(--color-done); position: relative; }
.dot.done::after { content: '✓'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
.name { font-size: var(--font-md); font-weight: 500; }
.desc { color: var(--color-muted); font-size: var(--font-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.meta { color: var(--color-muted); font-size: var(--font-xs); }
.mini-btn { background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; color: var(--color-muted); cursor: pointer; font-size: var(--font-xs); transition: color .15s, background .15s, border-color .15s; }
.mini-btn:hover { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
.mini-btn.danger:hover { color: var(--color-overdue); background: rgba(224, 62, 62, .08); border-color: rgba(224, 62, 62, .25); }
</style>
