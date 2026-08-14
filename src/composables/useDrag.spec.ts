import { beforeEach, describe, expect, it } from 'vitest'
import { beginDrag, dragState, resetDrag, resolveDropTarget, setDropHandler, shouldStartDrag } from './useDrag'

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
  const fakeEl = { getBoundingClientRect: () => ({ width: 100, height: 30 }) } as unknown as HTMLElement

  beforeEach(() => {
    resetDrag()
    setDropHandler(() => {})
  })

  it('超过阈值后 pointerup 触发 drop 并清理状态', () => {
    const calls: Array<{ id: string; kind: 'item' | 'group' } | null> = []
    setDropHandler((t) => { calls.push(t) })
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 10 }))
    expect(dragState.value?.active).toBe(true)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 10 }))
    expect(calls).toEqual([null])
    expect(dragState.value).toBeNull()
    // 拖拽后的 click 应被吞掉，不触发 toggle 等后续行为
    window.dispatchEvent(new Event('click'))
  })

  it('未达阈值时 pointerup 不触发 drop 并直接清理', () => {
    const calls: Array<{ id: string; kind: 'item' | 'group' } | null> = []
    setDropHandler((t) => { calls.push(t) })
    const down = makeDownEvent(fakeEl)
    ;(down as any).currentTarget = fakeEl
    beginDrag('n1', 'l1', null, down)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 4, clientY: 4 }))
    expect(dragState.value?.active).toBe(false)
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 4, clientY: 4 }))
    expect(calls).toEqual([])
    expect(dragState.value).toBeNull()
  })
})
