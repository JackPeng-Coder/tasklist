import { ref } from 'vue'

export interface DragState {
  nodeId: string
  listId: string
  parentId: string | null
  x: number
  y: number
  width: number
  height: number
  active: boolean
  ctrl: boolean
  /** 拖拽预览：被拖对象本身的克隆（真实外观），跟随光标，释放后移除 */
  ghost: HTMLElement | null
}

export interface DropTarget { id: string; kind: 'item' | 'group' | 'list' }

export const DRAG_THRESHOLD = 8

export function shouldStartDrag(sx: number, sy: number, cx: number, cy: number): boolean {
  return Math.hypot(cx - sx, cy - sy) > DRAG_THRESHOLD
}

/** 从指针所在元素向上找到最近的拖放目标元素（携带 data-drop-id + 有效 drop-kind） */
export function resolveDropElem(el: Element | null): HTMLElement | null {
  if (!el) return null
  let cur: HTMLElement | null = el as HTMLElement
  while (cur) {
    const id = cur.dataset && cur.dataset.dropId
    const kind = cur.dataset && cur.dataset.dropKind
    if (id && (kind === 'item' || kind === 'group')) return cur
    cur = cur.parentElement
  }
  return null
}

export function resolveDropTarget(el: Element | null): DropTarget | null {
  const elem = resolveDropElem(el)
  return elem ? { id: elem.dataset.dropId!, kind: elem.dataset.dropKind as 'item' | 'group' } : null
}

/**
 * 解析「有效落点」，结合 Ctrl 与元素所在层级：
 * - 组合（或其展开子项区、组内子事项）→ 该组合
 * - 事项 + Ctrl → 该事项（合并为目标）
 * - 根层事项（无 Ctrl）→ 列表根层（仅供落点判定，不作为高亮目标）
 */
export function resolveEffectiveTarget(el: Element | null, ctrl: boolean, fallbackListId: string): DropTarget | null {
  const elem = resolveDropElem(el)
  if (!elem) return null
  const kind = elem.dataset.dropKind
  if (kind === 'group') return { kind: 'group', id: elem.dataset.dropId! }
  if (kind === 'item') {
    if (ctrl) return { kind: 'item', id: elem.dataset.dropId! }
    const wrap = (elem as HTMLElement).closest('.group-wrap')
    if (wrap) {
      const groupRow = wrap.querySelector<HTMLElement>('.row[data-drop-kind="group"]')
      if (groupRow?.dataset.dropId) return { kind: 'group', id: groupRow.dataset.dropId }
    }
    return { kind: 'list', id: fallbackListId }
  }
  return null
}

export const dragState = ref<DragState | null>(null)
let onDrop: ((target: DropTarget | null) => void) | null = null
let startX = 0
let startY = 0
/** 拖动起始时鼠标在行内的抓取点偏移（预览保持该相对位置，不居中于光标） */
let grabDX = 0
let grabDY = 0
let tracking = false
let onMove: ((e: PointerEvent) => void) | null = null
let onUp: ((e: PointerEvent) => void) | null = null
let onCancel: (() => void) | null = null
let onKey: ((e: KeyboardEvent) => void) | null = null

export function setDropHandler(fn: (target: DropTarget | null) => void): void {
  onDrop = fn
}

let targetEl: HTMLElement | null = null

function markTarget(el: HTMLElement | null): void {
  if (targetEl === el) return
  if (targetEl) targetEl.classList.remove('drag-target')
  targetEl = el
  if (el) el.classList.add('drag-target')
}

// 更新悬停目标高亮：按有效落点判定——
// 组合（含展开子项区、组内子事项命中）归一为组合行高亮；事项仅在按住 Ctrl（合并）时高亮；根层事项（无 Ctrl）不高亮
function updateTarget(d: DragState, cx: number, cy: number): void {
  const dropEl = resolveDropElem(document.elementFromPoint(cx, cy))
  if (!dropEl) { markTarget(null); return }
  const eff = resolveEffectiveTarget(dropEl, d.ctrl, d.listId)
  if (!eff || eff.kind === 'list') { markTarget(null); return }
  if (eff.kind === 'item') { markTarget(dropEl); return }
  // 组合：直接命中组行则用之；子项区/组内子事项命中则按 id 归一为组合行
  const groupRow = dropEl.classList.contains('row') && dropEl.dataset.dropKind === 'group'
    ? dropEl
    : document.querySelector<HTMLElement>(`.row[data-drop-kind="group"][data-drop-id="${eff.id}"]`)
  markTarget(groupRow)
}

export function beginDrag(nodeId: string, listId: string, parentId: string | null, e: PointerEvent): void {
  if (e.button !== 0 || tracking) return
  e.preventDefault()
  tracking = true
  startX = e.clientX
  startY = e.clientY
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  grabDX = e.clientX - rect.left
  grabDY = e.clientY - rect.top
  // 拖拽预览 = 被拖对象本身的克隆（不透明）：完整保留状态色、勾选/箭头、时间 chip、编辑按钮等外观
  // （克隆携带组件的 scoped 属性，样式与真实行一致）；未达阈值前隐藏
  const ghost = el.cloneNode(true) as HTMLElement
  Object.assign(ghost.style, {
    position: 'fixed',
    left: e.clientX - grabDX + 'px',
    top: e.clientY - grabDY + 'px',
    width: rect.width + 'px',
    margin: '0',
    zIndex: '200',
    pointerEvents: 'none',
    opacity: '1',
    display: 'none',
  })
  ghost.classList.add('drag-ghost')
  document.body.appendChild(ghost)
  dragState.value = { nodeId, listId, parentId, x: e.clientX, y: e.clientY, width: rect.width, height: rect.height, active: false, ctrl: e.ctrlKey, ghost }
  document.body.classList.add('no-select')
  onMove = (ev: PointerEvent) => {
    const d = dragState.value
    if (!d) return
    d.ctrl = ev.ctrlKey
    if (!d.active) {
      if (!shouldStartDrag(startX, startY, ev.clientX, ev.clientY)) return
      d.active = true
      if (d.ghost) {
        d.ghost.style.display = 'block'
        d.ghost.style.left = ev.clientX - grabDX + 'px'
        d.ghost.style.top = ev.clientY - grabDY + 'px'
      }
      // 拖拽激活：其他元素半透明、拖动克隆不透明（body.dragging）
      document.body.classList.add('dragging')
      updateTarget(d, ev.clientX, ev.clientY)
    }
    d.x = ev.clientX
    d.y = ev.clientY
    if (d.ghost) {
      d.ghost.style.left = ev.clientX - grabDX + 'px'
      d.ghost.style.top = ev.clientY - grabDY + 'px'
    }
    // 悬停目标高亮（组合或 Ctrl 事项）恢复不透明
    updateTarget(d, ev.clientX, ev.clientY)
  }
  onUp = (ev: PointerEvent) => {
    cleanup()
    const d = dragState.value
    if (!d || !d.active) {
      dragState.value = null
      document.body.classList.remove('no-select')
      return
    }
    const target = resolveEffectiveTarget(document.elementFromPoint(ev.clientX, ev.clientY), d.ctrl, d.listId)
    onDrop?.(target)
    // 立即清理预览与选中禁止；在捕获阶段拦截紧随其后的 click，避免触发行切换
    dragState.value = null
    document.body.classList.remove('no-select')
    window.addEventListener('click', suppressClick, { capture: true, once: true })
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  // 按住/松开 Ctrl 而不移动鼠标时，也要即时更新合并意图并重算目标高亮
  onKey = (ev: KeyboardEvent) => {
    const d = dragState.value
    if (!d || ev.key !== 'Control') return
    d.ctrl = ev.ctrlKey
    if (d.active) updateTarget(d, d.x, d.y)
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  onCancel = () => {
    cleanup()
    dragState.value = null
    document.body.classList.remove('no-select')
  }
  window.addEventListener('pointercancel', onCancel)
}

function cleanup(): void {
  tracking = false
  if (onMove) window.removeEventListener('pointermove', onMove)
  if (onUp) window.removeEventListener('pointerup', onUp)
  if (onCancel) window.removeEventListener('pointercancel', onCancel)
  if (onKey) {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKey)
  }
  onMove = null
  onUp = null
  onCancel = null
  onKey = null
  // 移除拖拽预览克隆
  const ghost = dragState.value?.ghost
  if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost)
  if (dragState.value) dragState.value.ghost = null
  // 清理拖拽高亮：目标类 + 其他元素半透明
  markTarget(null)
  document.body.classList.remove('dragging')
}

function suppressClick(e: MouseEvent): void {
  e.stopPropagation()
}

export function resetDrag(): void {
  cleanup()
  dragState.value = null
  document.body.classList.remove('no-select')
}
