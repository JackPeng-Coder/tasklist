<template>
  <div class="row" :class="statusClass" data-test="row" :data-drop-id="item.id" :data-drop-kind="item.done ? undefined : 'item'" @pointerdown="onPointerDown" @click="onRowClick">
    <span class="checkbox-wrap">
      <span class="checkmark" :class="{ checked: item.done }" data-test="dot">
        <svg viewBox="0 0 16 16"><path d="M3 8.5 L6.5 12 L13 4.5" /></svg>
      </span>
    </span>
    <span class="title">
      <span class="name">{{ item.name }}</span>
      <span v-if="showDesc && item.description" class="desc"> · {{ item.description }}</span>
    </span>
    <span class="spacer" />
    <span v-if="item.date" class="time-chip" :class="statusClass">{{ dateLabel }}</span>
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
.row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius); background: var(--card); margin-bottom: 8px; cursor: pointer; border: 1px solid var(--line); box-shadow: var(--shadow-card); transition: transform 160ms var(--spring), box-shadow 160ms var(--ease), background-color 200ms var(--ease), border-color 200ms var(--ease); }
.row:hover { transform: translateY(-1px); box-shadow: var(--shadow-lift); }
.overdue { background: var(--red-soft); border-color: var(--red-line); box-shadow: inset 3px 0 0 var(--red), var(--shadow-card); }
.pending { background: var(--blue-soft); border-color: var(--blue-line); box-shadow: inset 3px 0 0 var(--blue), var(--shadow-card); }
.done { background: var(--green-soft); border-color: var(--green-line); box-shadow: inset 3px 0 0 var(--green), var(--shadow-card); }
.overdue:hover { box-shadow: inset 3px 0 0 var(--red), var(--shadow-lift); }
.pending:hover { box-shadow: inset 3px 0 0 var(--blue), var(--shadow-lift); }
.done:hover { box-shadow: inset 3px 0 0 var(--green), var(--shadow-lift); }
.title { flex: 1 1 auto; min-width: 120px; }
.checkbox-wrap { position: relative; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; flex-shrink: 0; }
.checkmark { width: 18px; height: 18px; border: 2px solid var(--check-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--card); transition: border-color 180ms var(--ease), background-color 180ms var(--ease), transform 180ms var(--spring); }
.checkbox-wrap:hover .checkmark { border-color: var(--green); }
.checkmark svg { width: 10px; height: 10px; fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.checkmark svg path { stroke-dasharray: 14; stroke-dashoffset: 14; transition: stroke-dashoffset 250ms var(--ease) 60ms; }
.checkmark.checked { border-color: var(--green); background: var(--green); transform: scale(1.06); }
.checkmark.checked svg path { stroke-dashoffset: 0; }
.name { font-size: var(--font-md); font-weight: 500; }
.desc { color: var(--ink-2); font-size: var(--font-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spacer { flex: 1; }
.time-chip { font-size: var(--font-xs); font-variant-numeric: tabular-nums; color: var(--ink-2); background: var(--ink-tint); padding: 2px 8px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
.time-chip.overdue { color: var(--red-ink); background: rgba(224, 82, 82, 0.12); }
.time-chip.pending { color: var(--blue-ink); background: rgba(75, 111, 217, 0.11); }
.time-chip.done { color: var(--green-ink); background: rgba(53, 160, 111, 0.12); }
.mini-btn { background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; color: var(--ink-3); cursor: pointer; font-size: var(--font-xs); transition: color 150ms var(--ease), background-color 150ms var(--ease); }
.mini-btn:hover { background: var(--ink-tint); color: var(--ink); }
.mini-btn.danger:hover { color: var(--red); background: var(--red-soft); }
</style>
