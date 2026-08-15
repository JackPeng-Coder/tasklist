import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const SAME_LINE_EPS = 2

export interface WrapGeometry {
  /** 行内是否存在日期 chip（有日期才有 chip） */
  hasChip: boolean
  /** 标题的垂直中心 y（同一 flex 行内各元素中心对齐，中心比 top 更稳健） */
  titleY: number
  chipY: number
  actionsY: number
}

/**
 * 按钮组换到下一行时是否应靠右对齐（给行加 .actions-wrapped 类）：
 * - 按钮与标题同一行 → 无需处理
 * - 按钮换到下一行且日期 chip 留在上方（或该行无日期）→ 靠右，与日期同侧
 * - 日期 chip 与按钮同处下一行 → 不加类，chip 靠右、按钮紧贴其后
 */
export function actionsWrapState(g: WrapGeometry): boolean {
  if (Math.abs(g.actionsY - g.titleY) <= SAME_LINE_EPS) return false
  if (!g.hasChip) return true
  return g.chipY < g.actionsY - SAME_LINE_EPS
}

/**
 * 行尾按钮换行对齐：当 .actions 换到下一行而 .time-chip 仍留在顶行（或无 chip）时，
 * 给行元素添加 actions-wrapped 类，CSS 据此让按钮组 margin-left: auto 靠右。
 * 纯 CSS 无法区分「按钮单独换行」与「日期+按钮一起换行」，故用 ResizeObserver
 * 监听行尺寸变化（换行、编辑模式切换、日期增删、窗口缩放都会改变行尺寸）并依据
 * 各元素几何位置判定。
 */
export function useTrailingWrap(rowRef: Ref<HTMLElement | null>): void {
  let ro: ResizeObserver | null = null

  function update(): void {
    const row = rowRef.value
    if (!row) return
    const actions = row.querySelector<HTMLElement>('.actions')
    const title = row.querySelector<HTMLElement>('.title')
    if (!actions || !title) {
      row.classList.remove('actions-wrapped')
      return
    }
    const chip = row.querySelector<HTMLElement>('.time-chip')
    const centerY = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return r.top + r.height / 2
    }
    const g: WrapGeometry = {
      hasChip: chip !== null,
      titleY: centerY(title),
      chipY: chip ? centerY(chip) : 0,
      actionsY: centerY(actions),
    }
    row.classList.toggle('actions-wrapped', actionsWrapState(g))
  }

  onMounted(() => {
    update()
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update)
      if (rowRef.value) ro.observe(rowRef.value)
    }
  })
  onBeforeUnmount(() => ro?.disconnect())
}
