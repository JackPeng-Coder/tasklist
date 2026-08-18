import { beforeEach, describe, expect, it } from 'vitest'
import { beginDrag, dragState, resetDrag, resolveDropTarget, resolveEffectiveTarget, setDropHandler, shouldStartDrag, type DropTarget } from './useDrag'

class PointerEventStub extends MouseEvent {
  constructor(type: string, init?: PointerEventInit) {
    super(type, init)
  }
  preventDefault() {}
}
if (typeof (globalThis as any).PointerEvent === 'undefined') {
  (globalThis as any).PointerEvent = PointerEventStub
}
if (typeof (document as any).elementFromPoint !== 'function') {
  (document as any).elementFromPoint = () => null
}

describe('useDrag helpers', () => {
  it('位移超过 8px 触发拖拽', () => {
    expect(shouldStartDrag(0, 0, 9, 0)).toBe(true)
    expect(shouldStartDrag(0, 0, 8, 0)).toBe(false)
    expect(shouldStartDrag(0, 0, 0, 20)).toBe(true)
  })

  it('elementFromPoint 命中组合返回 group', () => {
    const el = { dataset: { dropId: 'g1', dropKind: 'group' } } as unknown as Element
    const target = resolveDropTarget(el)
    expect(target).toEqual({ id: 'g1', kind: 'group' })
  })

  it('无命中返回 null（根层处理）', () => {
    expect(resolveDropTarget(null)).toBeNull()
  })
})

function makeDownEvent(el: HTMLElement): PointerEvent {
  return new PointerEvent('pointerdown', { button: 0, clientX: 0, clientY: 0, bubbles: true, cancelable: true }) as unknown as PointerEvent
}

// 把 currentTarget 挂到事件上，模拟在目标元素上触发
defineCurrentTarget(PointerEventStub.prototype)
function defineCurrentTarget(proto: any) {
  let captured: EventTarget | null = null
  Object.defineProperty(proto, 'currentTarget', {
    get() { return captured ?? this.target },
    set(v) { captured = v },
  })
}

describe('useDrag lifecycle', () => {
  const fakeEl = document.createElement('div') as unknown as HTMLElement

  beforeEach(() => {
    resetDrag()
    setDropHandler(() => {})
  })

  it('超过阈值后 pointerup 触发 drop 并清理状态', () => {
    const calls: Array<DropTarget | null> = []
    setDropHandler((t) => { calls.push(t) })
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 10 }))
    expect(dragState.value?.active).toBe(true)
    // 拖拽预览 = 被拖对象的克隆，激活后出现在 body 中
    expect(document.querySelector('.drag-ghost')).not.toBeNull()
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 10 }))
    expect(calls).toEqual([null])
    expect(dragState.value).toBeNull()
    // 释放后预览克隆被移除，不残留
    expect(document.querySelector('.drag-ghost')).toBeNull()
    // 拖拽后的 click 应被吞掉，不触发 toggle 等后续行为
    window.dispatchEvent(new Event('click'))
  })

  it('未达阈值时 pointerup 不触发 drop 并直接清理', () => {
    const calls: Array<DropTarget | null> = []
    setDropHandler((t) => { calls.push(t) })
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 4, clientY: 4 }))
    expect(dragState.value?.active).toBe(false)
    // 未达阈值时预览保持隐藏（display:none），释放后移除
    expect(document.querySelector('.drag-ghost')).not.toBeNull()
    expect((document.querySelector('.drag-ghost') as HTMLElement).style.display).toBe('none')
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 4, clientY: 4 }))
    expect(calls).toEqual([])
    expect(dragState.value).toBeNull()
    expect(document.querySelector('.drag-ghost')).toBeNull()
  })

  it('resetDrag 移除预览克隆并清空状态', () => {
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 10 }))
    expect(document.querySelector('.drag-ghost')).not.toBeNull()
    resetDrag()
    expect(dragState.value).toBeNull()
    expect(document.querySelector('.drag-ghost')).toBeNull()
  })

  it('激活后 body.dragging，悬停 Ctrl 事项目标加高亮，释放清理', () => {
    const el = document.createElement('div')
    el.setAttribute('data-drop-id', 'b')
    el.setAttribute('data-drop-kind', 'item')
    ;(document as any).elementFromPoint = () => el
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10, ctrlKey: true }))
    expect(dragState.value?.active).toBe(true)
    expect(document.body.classList.contains('dragging')).toBe(true)
    expect(el.classList.contains('drag-target')).toBe(true)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10, ctrlKey: true }))
    expect(document.body.classList.contains('dragging')).toBe(false)
    expect(el.classList.contains('drag-target')).toBe(false)
  })

  it('未按住 Ctrl 时事项目标不加高亮', () => {
    const el = document.createElement('div')
    el.setAttribute('data-drop-id', 'b')
    el.setAttribute('data-drop-kind', 'item')
    ;(document as any).elementFromPoint = () => el
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(document.body.classList.contains('dragging')).toBe(true)
    expect(el.classList.contains('drag-target')).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
  })

  it('悬停组合目标（子项区）高亮归一为组合行', () => {
    const wrap = document.createElement('div')
    wrap.className = 'group-wrap'
    const row = document.createElement('div')
    row.className = 'row'
    row.setAttribute('data-drop-id', 'g')
    row.setAttribute('data-drop-kind', 'group')
    const children = document.createElement('div')
    children.className = 'children'
    children.setAttribute('data-drop-id', 'g')
    children.setAttribute('data-drop-kind', 'group')
    wrap.append(row, children)
    document.body.appendChild(wrap)
    ;(document as any).elementFromPoint = () => children // 悬停子项区
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(true)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(false)
    wrap.remove()
  })

  it('按住/松开 Ctrl 而不移动即即时刷新目标高亮', () => {
    const el = document.createElement('div')
    el.setAttribute('data-drop-id', 'b')
    el.setAttribute('data-drop-kind', 'item')
    ;(document as any).elementFromPoint = () => el
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(el.classList.contains('drag-target')).toBe(false)
    // 按下 Ctrl（不移动鼠标）
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }))
    expect(dragState.value?.ctrl).toBe(true)
    expect(el.classList.contains('drag-target')).toBe(true)
    // 松开 Ctrl（不移动鼠标）
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', ctrlKey: false }))
    expect(dragState.value?.ctrl).toBe(false)
    expect(el.classList.contains('drag-target')).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
  })

  it('resolveEffectiveTarget：组内子事项无 Ctrl → 其父组合；Ctrl → 事项本身', () => {
    const wrap = document.createElement('div')
    wrap.className = 'group-wrap'
    const groupRow = document.createElement('div')
    groupRow.className = 'row'
    groupRow.setAttribute('data-drop-id', 'g')
    groupRow.setAttribute('data-drop-kind', 'group')
    const child = document.createElement('div')
    child.className = 'row'
    child.setAttribute('data-drop-id', 'c')
    child.setAttribute('data-drop-kind', 'item')
    wrap.append(groupRow, child)
    expect(resolveEffectiveTarget(child, false, 'l1')).toEqual({ kind: 'group', id: 'g' })
    expect(resolveEffectiveTarget(child, true, 'l1')).toEqual({ kind: 'item', id: 'c' })
    // 根层事项（不在 group-wrap 内）无 Ctrl → 列表根层
    const rootItem = document.createElement('div')
    rootItem.setAttribute('data-drop-id', 'r')
    rootItem.setAttribute('data-drop-kind', 'item')
    expect(resolveEffectiveTarget(rootItem, false, 'l1')).toEqual({ kind: 'list', id: 'l1' })
    // 组合元素（组行）→ 组合
    expect(resolveEffectiveTarget(groupRow, false, 'l1')).toEqual({ kind: 'group', id: 'g' })
  })

  it('悬停组内子事项（无 Ctrl）→ 父组合行高亮', () => {
    const wrap = document.createElement('div')
    wrap.className = 'group-wrap'
    const row = document.createElement('div')
    row.className = 'row'
    row.setAttribute('data-drop-id', 'g')
    row.setAttribute('data-drop-kind', 'group')
    const child = document.createElement('div')
    child.className = 'row'
    child.setAttribute('data-drop-id', 'c')
    child.setAttribute('data-drop-kind', 'item')
    wrap.append(row, child)
    document.body.appendChild(wrap)
    ;(document as any).elementFromPoint = () => child // 悬停组内子事项
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(true)
    expect(child.classList.contains('drag-target')).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(false)
    wrap.remove()
  })

  it('拖回自己所在父组合不高亮（无变化）', () => {
    const row = document.createElement('div')
    row.className = 'row'
    row.setAttribute('data-drop-id', 'g')
    row.setAttribute('data-drop-kind', 'group')
    document.body.appendChild(row)
    ;(document as any).elementFromPoint = () => row // 悬停自己的父组合
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', 'g', down) // n1 的父组合正是 g
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
    row.remove()
  })

  it('拖到祖父组合仍高亮（父的父，非原父，属真实移动）', () => {
    const wrap = document.createElement('div')
    wrap.className = 'group-wrap'
    const row = document.createElement('div')
    row.className = 'row'
    row.setAttribute('data-drop-id', 'h')
    row.setAttribute('data-drop-kind', 'group')
    wrap.append(row)
    document.body.appendChild(wrap)
    ;(document as any).elementFromPoint = () => row // 悬停祖父组合 h（n1 在 g 内，g 在 h 内）
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', 'g', down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(true)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
    wrap.remove()
  })

  it('拖到自身（组）不高亮（无变化）', () => {
    const row = document.createElement('div')
    row.className = 'row'
    row.setAttribute('data-drop-id', 'g')
    row.setAttribute('data-drop-kind', 'group')
    document.body.appendChild(row)
    ;(document as any).elementFromPoint = () => row // 悬停被拖组合自身
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('g', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10 }))
    expect(row.classList.contains('drag-target')).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10 }))
    row.remove()
  })

  it('Ctrl 拖到自身（事项）不高亮（无变化）', () => {
    const el = document.createElement('div')
    el.setAttribute('data-drop-id', 'n1')
    el.setAttribute('data-drop-kind', 'item')
    document.body.appendChild(el)
    ;(document as any).elementFromPoint = () => el
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', 'g', down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 10, ctrlKey: true }))
    expect(el.classList.contains('drag-target')).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 10, ctrlKey: true }))
    el.remove()
  })
})
