export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function formatDateLabel(dateStr: string, now: Date): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const base = startOfDay(now)
  const diff = Math.round((target.getTime() - base.getTime()) / 86400000)
  if (diff === -1) return 'yesterday'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === 2) return 'dayAfterTomorrow'
  if (target.getFullYear() === now.getFullYear()) return `${m}月${d}日`
  return `${y}年${m}月${d}日`
}

export function resolveDateField(value: string, now: Date): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = /^today([+-]\d+)?$/.exec(value)
  if (match) {
    const offset = match[1] ? parseInt(match[1], 10) : 0
    return toISO(new Date(startOfDay(now).getTime() + offset * 86400000))
  }
  if (value === 'tomorrow') return toISO(new Date(startOfDay(now).getTime() + 86400000))
  if (value === 'yesterday') return toISO(new Date(startOfDay(now).getTime() - 86400000))
  return value
}

export function formatTimeOnly(ts: number): string {
  if (!Number.isFinite(ts)) return ''
  const d = new Date(ts)
  if (d.getHours() === 0 && d.getMinutes() === 0) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
