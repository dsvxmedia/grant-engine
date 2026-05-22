import { describe, it, expect } from 'vitest'
import { formatDeadline, isUrgent, scoreColor, formatCurrency } from '@/lib/utils'

describe('formatDeadline', () => {
  it('returns "Today" for same-day deadline', () => {
    expect(formatDeadline(new Date())).toBe('Today')
  })
  it('returns days remaining for future date', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    expect(formatDeadline(future)).toBe('5 days')
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
