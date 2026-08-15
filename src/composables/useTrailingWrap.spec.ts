import { describe, expect, it } from 'vitest'
import { actionsWrapState } from './useTrailingWrap'

describe('actionsWrapState', () => {
  it('按钮与标题同一行时返回 false（无需换行对齐）', () => {
    // 同一 flex 行内各元素中心对齐；不同高度元素 top 有差异但 center 相同
    expect(actionsWrapState({ hasChip: true, titleY: 100, chipY: 100, actionsY: 101 })).toBe(false)
    expect(actionsWrapState({ hasChip: false, titleY: 100, chipY: 0, actionsY: 100 })).toBe(false)
    expect(actionsWrapState({ hasChip: true, titleY: 100, chipY: 100, actionsY: 99.5 })).toBe(false)
  })

  it('按钮换行且日期留在顶行时返回 true（按钮靠右）', () => {
    expect(actionsWrapState({ hasChip: true, titleY: 100, chipY: 100, actionsY: 140 })).toBe(true)
  })

  it('无日期时按钮单独换行返回 true（保持现状的右侧对齐）', () => {
    expect(actionsWrapState({ hasChip: false, titleY: 100, chipY: 0, actionsY: 140 })).toBe(true)
  })

  it('日期与按钮一起换行时返回 false（保持紧贴）', () => {
    expect(actionsWrapState({ hasChip: true, titleY: 100, chipY: 140, actionsY: 140 })).toBe(false)
    expect(actionsWrapState({ hasChip: true, titleY: 100, chipY: 140.5, actionsY: 139.8 })).toBe(false)
  })

  it('多行标题下日期垂直居中，仍视为留在顶行', () => {
    expect(actionsWrapState({ hasChip: true, titleY: 122, chipY: 123, actionsY: 165 })).toBe(true)
  })
})
