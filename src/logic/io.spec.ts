import { describe, expect, it } from 'vitest'
import { buildExportBlob, parseImportText } from './io'

describe('import/export helpers', () => {
  const data = { version: 1 as const, lists: [{ id: 'l', name: 'x', description: '', items: [] }], settings: { theme: 'light' as const, fontSize: 16, lang: 'zh', showDescription: true }, ui: { sidebarCollapsed: false, expandedGroupIds: [] } }

  it('导出为 JSON Blob', () => {
    const blob = buildExportBlob(data)
    expect(blob.type).toBe('application/json')
  })

  it('合法导入文本解析成功', () => {
    expect(parseImportText(JSON.stringify(data)).ok).toBe(true)
  })

  it('非法文本解析失败', () => {
    expect(parseImportText('not json').ok).toBe(false)
  })
})
