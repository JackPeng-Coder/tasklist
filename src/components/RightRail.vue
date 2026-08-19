<template>
  <nav class="right-rail">
    <!-- 主要动作：+ 事项 -->
    <button class="icon-btn primary" data-test="add-item" :title="t('rail.addItem')" @click="$emit('add-item')">
      <svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
      </svg>
      <span class="btn-label">{{ t('rail.addItem') }}</span>
    </button>
    <!-- 主要动作：+ 组合（图标：方框+加号，区别于纯事项） -->
    <button class="icon-btn primary" data-test="add-group" :title="t('rail.addGroup')" @click="$emit('add-group')">
      <svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span class="btn-label">{{ t('rail.addGroup') }}</span>
    </button>
    <!-- 撤销 -->
    <button class="icon-btn" :class="{ dimmed: !data.canUndo }" data-test="undo" :disabled="!data.canUndo" :title="t('rail.undo') + ' (Ctrl+Z)'" @click="data.undo()">
      <svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M6 4L3 7l3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M3 7h7a3 3 0 0 1 0 6h-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="btn-label">{{ t('rail.undo') }}</span>
    </button>
    <!-- 重做 -->
    <button class="icon-btn" :class="{ dimmed: !data.canRedo }" data-test="redo" :disabled="!data.canRedo" :title="t('rail.redo') + ' (Ctrl+Y)'" @click="data.redo()">
      <svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M10 4l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M13 7H6a3 3 0 0 0 0 6h2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="btn-label">{{ t('rail.redo') }}</span>
    </button>
    <!-- 编辑（激活态实色填充） -->
    <button class="icon-btn" :class="{ active: ui.editMode }" data-test="edit" :title="t('rail.edit')" @click="ui.toggleEditMode()">
      <svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M11.5 2.5l2 2-7 7H4.5v-2l7-7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M3 13.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span class="btn-label">{{ t('rail.edit') }}</span>
    </button>
    <!-- 设置（滑尺条图标：三条不同长度的横线 + 圆点，表示调节） -->
    <button class="icon-btn" data-test="settings" :title="t('rail.settings')" @click="$emit('open-settings')">
      <svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.5 4.5h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M2.5 8h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M2.5 11.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="11.5" cy="4.5" r="1.4" fill="currentColor" />
        <circle cx="6" cy="8" r="1.4" fill="currentColor" />
        <circle cx="9.5" cy="11.5" r="1.4" fill="currentColor" />
      </svg>
      <span class="btn-label">{{ t('rail.settings') }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import { useDataStore } from '../stores/data'
const { t } = useI18n()
const ui = useUiStore()
const data = useDataStore()
defineEmits<{ (e: 'add-item'): void; (e: 'add-group'): void; (e: 'open-settings'): void }>()
</script>

<style scoped>
/* 容器：宽屏为竖向右侧栏，窄屏为横向底部固定栏 */
.right-rail {
  width: var(--right-rail-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 12px 8px;
  background: var(--card);
  border-left: 1px solid var(--line);
}

@media (max-width: 720px) {
  .right-rail {
    flex-direction: row;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: auto; /* 覆盖基础样式的 64px，让 fixed 容器铺满屏幕宽度 */
    min-height: 52px;
    border-left: none;
    border-top: 1px solid var(--line);
    padding: 6px 8px calc(env(safe-area-inset-bottom, 0px) + 6px);
    gap: 4px;
    background: var(--card);
    box-shadow: 0 -2px 8px var(--ink-tint);
    z-index: 55;
  }
}

/* 按钮基础 */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 8px 4px;
  cursor: pointer;
  color: var(--ink-2);
  font-size: var(--font-xs);
  line-height: 1.2;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  transition:
    color 150ms var(--ease),
    background-color 150ms var(--ease),
    border-color 150ms var(--ease),
    box-shadow 150ms var(--ease),
    transform 140ms var(--spring),
    scale 200ms var(--spring);
}

.icon-btn .btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: block;
}

.icon-btn .btn-label {
  /* 文字可被截断（窄屏 6 个按钮挤一行时） */
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* 按压反馈：scale 与 transform 独立叠加，不覆盖主区上浮等效果 */
.icon-btn:not(:disabled):active {
  scale: 0.9;
  transition: scale 60ms var(--ease);
}

/* 默认 hover：浅灰底 + 深字色 + 灰边 */
.icon-btn:not(.primary):not(.active):hover {
  background: var(--ink-tint);
  border-color: var(--line);
  color: var(--ink);
}

/* 主要动作：实色填充（蓝）—— 高识别度的入口按钮 */
.icon-btn.primary {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
  box-shadow: var(--shadow-card);
}
.icon-btn.primary:hover {
  background: var(--blue-hover);
  border-color: var(--blue-hover);
  color: #fff;
  box-shadow: var(--shadow-lift);
}
.icon-btn.primary:not(:disabled):active {
  background: var(--blue-hover);
}

/* 编辑激活态：实色填充（蓝） */
.icon-btn.active {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
  box-shadow: var(--shadow-card);
}
.icon-btn.active:not(:disabled):active {
  background: var(--blue-hover);
}

/* 禁用态：明显的弱化（透明度 + 灰度滤镜） + not-allowed 光标 */
.icon-btn:disabled {
  opacity: 0.4;
  filter: grayscale(1);
  cursor: not-allowed;
  pointer-events: none;
}
.icon-btn.dimmed:not(:disabled) {
  /* 防御性：当 dimmed 但未禁用时（例如过渡帧），保持弱化外观 */
  opacity: 0.55;
  filter: grayscale(0.6);
}

/* 窄屏：仅图标，6 个按钮一行均匀分布；title 仍提供中文提示 */
@media (max-width: 720px) {
  .icon-btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 8px 4px;
    justify-content: center;
  }
  .icon-btn .btn-label {
    /* 窄屏仅图标：隐藏文字标签 */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .icon-btn {
    position: relative; /* 让 .btn-label 绝对定位正确 */
  }
}
</style>