import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatDeadline, isUrgent, scoreColor, formatCurrency } from '@/lib/utils'

describe('formatDeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns "Today" for same-day deadline', () => {
    expect(formatDeadline(new Date('2026-06-01T18:00:00.000Z'))).toBe('Today')
  })
  it('returns days remaining for future date', () => {
    expect(formatDeadline(new Date('2026-06-06T12:00:00.000Z'))).toBe('5 days')
  })
  it('returns "Overdue" for past deadline', () => {
    expect(formatDeadline(new Date('2026-05-28T12:00:00.000Z'))).toBe('Overdue')
  })
})

describe('isUrgent', () => {
  it('returns true when within 7 days', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    expect(isUrgent(soon)).toBe(true)
  })
  it('returns false when beyond 7 days', () => {
    const later = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    expect(isUrgent(later)).toBe(false)
  })
})

describe('scoreColor', () => {
  it('returns green classes for score 70+', () => expect(scoreColor(90)).toContain('green'))
  it('returns yellow classes for score 50-69', () => expect(scoreColor(60)).toContain('yellow'))
  it('returns red classes for score below 50', () => expect(scoreColor(30)).toContain('red'))
})

describe('formatCurrency', () => {
  it('formats as USD with no decimals', () => {
    expect(formatCurrency(25000)).toBe('$25,000')
  })
})
