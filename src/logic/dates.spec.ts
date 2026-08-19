import { formatDateLabel, formatTimeOnly, resolveDateField, toISO } from './dates'

const NOW = new Date(2026, 7, 14, 12, 0) // 2026-08-14

describe('toISO', () => {
  it('输出本地 yyyy-mm-dd', () => {
    expect(toISO(new Date(2026, 7, 5))).toBe('2026-08-05')
  })
})

describe('formatDateLabel', () => {
  it('昨天/今天/明天/后天', () => {
    expect(formatDateLabel('2026-08-13', NOW)).toBe('yesterday')
    expect(formatDateLabel('2026-08-14', NOW)).toBe('today')
    expect(formatDateLabel('2026-08-15', NOW)).toBe('tomorrow')
    expect(formatDateLabel('2026-08-16', NOW)).toBe('dayAfterTomorrow')
  })
  it('同年显示 M月D日', () => {
    expect(formatDateLabel('2026-09-01', NOW)).toBe('9月1日')
  })
  it('跨年带年份', () => {
    expect(formatDateLabel('2025-12-31', NOW)).toBe('2025年12月31日')
  })
})

describe('formatTimeOnly', () => {
  it('带时间的时间戳只提取 HH:mm（不显示日期）', () => {
    expect(formatTimeOnly(new Date(2026, 7, 16, 18, 0).getTime())).toBe('18:00')
  })
  it('跨年只显示时间，不带年份', () => {
    expect(formatTimeOnly(new Date(2025, 11, 31, 9, 30).getTime())).toBe('09:30')
  })
  it('整点（00:00，即只有日期无时间）返回空字符串', () => {
    expect(formatTimeOnly(new Date(2026, 7, 14).getTime())).toBe('')
  })
  it('Infinity（无时间）返回空字符串', () => {
    expect(formatTimeOnly(Infinity)).toBe('')
  })
})

describe('resolveDateField', () => {
  it('绝对日期原样返回', () => {
    expect(resolveDateField('2026-08-20', NOW)).toBe('2026-08-20')
  })
  it('相对标记转换', () => {
    expect(resolveDateField('today', NOW)).toBe('2026-08-14')
    expect(resolveDateField('tomorrow', NOW)).toBe('2026-08-15')
    expect(resolveDateField('yesterday', NOW)).toBe('2026-08-13')
    expect(resolveDateField('today+3', NOW)).toBe('2026-08-17')
    expect(resolveDateField('today-2', NOW)).toBe('2026-08-12')
  })
  it('非法输入原样返回', () => {
    expect(resolveDateField('xxx', NOW)).toBe('xxx')
  })
})
