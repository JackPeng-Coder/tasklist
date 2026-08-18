export function isEditableTarget(e: KeyboardEvent | { target: unknown }): boolean {
  const t = e.target as HTMLElement | null
  if (!t) return false
  if (typeof t.closest === 'function') {
    if (t.closest('input, textarea, select')) return true
  }
  const ce = (t as HTMLElement).contentEditable as string | boolean
  if (ce === 'true' || ce === true) return true
  if (typeof t.closest === 'function' && t.closest('[contenteditable="true"]')) return true
  return false
}

export function isUndoShortcut(e: KeyboardEvent): boolean {
  if (isEditableTarget(e)) return false
  return (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'z' || e.key === 'Z')
}

export function isRedoShortcut(e: KeyboardEvent): boolean {
  if (isEditableTarget(e)) return false
  const mod = e.ctrlKey || e.metaKey
  const y = (e.key === 'y' || e.key === 'Y') && !e.shiftKey && !e.altKey
  const zShift = (e.key === 'z' || e.key === 'Z') && e.shiftKey && !e.altKey
  return mod && (y || zShift)
}