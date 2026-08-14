import { describe, expect, it } from 'vitest'
import { shouldStartDrag, resolveDropTarget } from './useDrag'

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
