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
}

export interface DropTarget { id: string; kind: 'item' | 'group' }

export const DRAG_THRESHOLD = 8

export function shouldStartDrag(sx: number, sy: number, cx: number, cy: number): boolean {
  return Math.hypot(cx - sx, cy - sy) > DRAG_THRESHOLD
}

export function resolveDropTarget(el: Element | null): DropTarget | null {
  if (!el) return null
  const id = (el as HTMLElement).dataset.dropId
  const kind = (el as HTMLElement).dataset.dropKind
  if (id && (kind === 'item' || kind === 'group')) return { id, kind }
  return resolveDropTarget(el.parentElement)
}

export const dragState = ref<DragState | null>(null)
let onDrop: ((target: DropTarget | null) => void) | null = null
let startX = 0
let startY = 0
let tracking = false
let onMove: ((e: PointerEvent) => void) | null = null
let onUp: ((e: PointerEvent) => void) | null = null
let onCancel: (() => void) | null = null

export function setDropHandler(fn: (target: DropTarget | null) => void): void {
  onDrop = fn
}

export function beginDrag(nodeId: string, listId: string, parentId: string | null, e: PointerEvent): void {
  if (e.button !== 0 || tracking) return
  tracking = true
  startX = e.clientX
  startY = e.clientY
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  dragState.value = { nodeId, listId, parentId, x: e.clientX, y: e.clientY, width: rect.width, height: rect.height, active: false }
  onMove = (ev: PointerEvent) => {
    const d = dragState.value
    if (!d) return
    if (!d.active) {
      if (!shouldStartDrag(startX, startY, ev.clientX, ev.clientY)) return
      d.active = true
    }
    d.x = ev.clientX
    d.y = ev.clientY
  }
  onUp = (ev: PointerEvent) => {
    cleanup()
    const d = dragState.value
    if (!d || !d.active) {
      dragState.value = null
      return
    }
    const target = resolveDropTarget(document.elementFromPoint(ev.clientX, ev.clientY))
    onDrop?.(target)
    // 保留 dragState（active=true）直到本次 click 被行吞掉或落到 window，
    // 之后再清理，避免 click 触发 toggle
    const consume = () => {
      window.removeEventListener('click', consume)
      if (dragState.value?.active) dragState.value = null
    }
    window.addEventListener('click', consume)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  onCancel = () => {
    cleanup()
    dragState.value = null
  }
  window.addEventListener('pointercancel', onCancel)
}

function cleanup(): void {
  tracking = false
  if (onMove) window.removeEventListener('pointermove', onMove)
  if (onUp) window.removeEventListener('pointerup', onUp)
  if (onCancel) window.removeEventListener('pointercancel', onCancel)
  onMove = null
  onUp = null
  onCancel = null
}

export function resetDrag(): void {
  dragState.value = null
  cleanup()
}
