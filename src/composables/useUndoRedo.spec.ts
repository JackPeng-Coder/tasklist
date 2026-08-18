import { describe, expect, it } from 'vitest'
import { isEditableTarget, isRedoShortcut, isUndoShortcut } from './useUndoRedo'

function ev(init: KeyboardEventInit & { target?: unknown }): KeyboardEvent {
  const e = new KeyboardEvent('keydown', init)
  Object.defineProperty(e, 'target', { value: init.target ?? document.body })
  return e
}

describe('useUndoRedo shortcuts', () => {
  it('Ctrl/Cmd+Z 为撤销', () => {
    expect(isUndoShortcut(ev({ key: 'z', ctrlKey: true }))).toBe(true)
    expect(isUndoShortcut(ev({ key: 'Z', ctrlKey: true }))).toBe(true)
    expect(isUndoShortcut(ev({ key: 'z', metaKey: true }))).toBe(true)
  })
  it('Ctrl+Y 与 Ctrl/Cmd+Shift+Z 为重做', () => {
    expect(isRedoShortcut(ev({ key: 'y', ctrlKey: true }))).toBe(true)
    expect(isRedoShortcut(ev({ key: 'Y', ctrlKey: true }))).toBe(true)
    expect(isRedoShortcut(ev({ key: 'z', ctrlKey: true, shiftKey: true }))).toBe(true)
    expect(isRedoShortcut(ev({ key: 'z', metaKey: true, shiftKey: true }))).toBe(true)
  })
  it('撤销不以 Ctrl+Y 判断、重做不以 Ctrl+Z 判断', () => {
    expect(isUndoShortcut(ev({ key: 'y', ctrlKey: true }))).toBe(false)
    expect(isRedoShortcut(ev({ key: 'z', ctrlKey: true }))).toBe(false)
  })
  it('无修饰或仅修饰键不误判', () => {
    expect(isUndoShortcut(ev({ key: 'z' }))).toBe(false)
    expect(isRedoShortcut(ev({ key: 'y' }))).toBe(false)
    expect(isUndoShortcut(ev({ key: 'Control', ctrlKey: true }))).toBe(false)
  })

  it('输入框/文本域/可编辑元素不算应用级快捷键（交给浏览器）', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    const plain = document.createElement('div')
    expect(isEditableTarget(ev({ key: 'z', target: input }))).toBe(true)
    expect(isEditableTarget(ev({ key: 'z', target: textarea }))).toBe(true)
    expect(isEditableTarget(ev({ key: 'z', target: select }))).toBe(true)
    expect(isEditableTarget(ev({ key: 'z', target: editable }))).toBe(true)
    expect(isEditableTarget(ev({ key: 'z', target: plain }))).toBe(false)
    expect(isEditableTarget(ev({ key: 'z', target: document.body }))).toBe(false)
  })
})