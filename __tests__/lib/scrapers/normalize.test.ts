import { describe, it, expect } from 'vitest'
import { normalizeGrant, isRollingGrant } from '@/lib/scrapers/normalize'
import type { RawGrant } from '@/lib/scrapers/types'

function baseRaw(overrides: Partial<RawGrant> = {}): RawGrant {
  return {
    source: 'grants-gov',
    title: 'Climate Resilience Grant',
    description: 'A grant for climate resilience projects.',
    sourceUrl: 'https://grants.gov/search/grantsResults/12345',
    deadline: '2026-12-31',
    ...overrides,
  }
}

function rollingRaw(overrides: Partial<RawGrant> = {}): RawGrant {
  return {
    source: 'monthly-programs',
    title: 'Year-Round Community Grant',
    description: 'Accepting applications year-round.',
    sourceUrl: 'https://example.org/grant',
    ...overrides,
  }
}

describe('normalizeGrant', () => {
  it('returns null for a past deadline', () => {
    const result = normalizeGrant(baseRaw({ deadline: '2020-01-01' }))
    expect(result).toBeNull()
  })

  it('returns null for grants-gov records with no deadline and no description', () => {
    const result = normalizeGrant({ source: 'grants-gov', title: 'FY 2012 Climate Program' })
    expect(result).toBeNull()
  })

  it('returns null when neither source_url nor application_url is provided', () => {
    const result = normalizeGrant(
      baseRaw({ sourceUrl: undefined, applicationUrl: undefined })
    )
    expect(result).toBeNull()
  })

  it('keeps a grant that has only an application_url', () => {
    const result = normalizeGrant(
      baseRaw({ sourceUrl: undefined, applicationUrl: 'https://apply.example.com' })
    )
    expect(result).not.toBeNull()
    expect(result!.application_url).toBe('https://apply.example.com')
  })

  it('keeps a rolling grant with no deadline (monthly-programs source)', () => {
    const result = normalizeGrant(rollingRaw())
    expect(result).not.toBeNull()
    expect(result!.deadline).toBeNull()
  })

  it('filters out a non-rolling null-deadline grant', () => {
    const result = normalizeGrant(
      baseRaw({ source: 'foundation', description: 'A standard grant.', deadline: undefined })
    )
    expect(result).toBeNull()
  })

  it('keeps a rolling grant identified by text (year-round language)', () => {
    const result = normalizeGrant(
      baseRaw({ source: 'foundation', description: 'We accept applications year-round.', deadline: undefined })
    )
    expect(result).not.toBeNull()
    expect(result!.deadline).toBeNull()
  })

  it('maps source, title, and funderName correctly', () => {
    const result = normalizeGrant(baseRaw({ funderName: 'Ford Foundation' }))
    expect(result).not.toBeNull()
    expect(result!.source).toBe('grants-gov')
    expect(result!.title).toBe('Climate Resilience Grant')
    expect(result!.funder_name).toBe('Ford Foundation')
  })

  it('parses a valid future deadline string into ISO format', () => {
    const result = normalizeGrant(baseRaw({ deadline: '2026-12-31' }))
    expect(result).not.toBeNull()
    expect(result!.deadline).toBe(new Date('2026-12-31').toISOString())
  })

  it('returns null deadline for an invalid date string on a rolling grant', () => {
    const result = normalizeGrant(rollingRaw({ deadline: 'not-a-date' }))
    expect(result).not.toBeNull()
    expect(result!.deadline).toBeNull()
  })

  it('returns null deadline for a rolling grant with no deadline', () => {
    const result = normalizeGrant(rollingRaw())
    expect(result).not.toBeNull()
    expect(result!.deadline).toBeNull()
  })

  it('detects LOI when description contains "letter of inquiry"', () => {
    const result = normalizeGrant(
      baseRaw({ description: 'A letter of inquiry is required.' })
    )
    expect(result).not.toBeNull()
    expect(result!.requires_loi).toBe(true)
  })

  it('detects LOI when description contains "LOI required"', () => {
    const result = normalizeGrant(baseRaw({ description: 'LOI required by June 1.' }))
    expect(result).not.toBeNull()
    expect(result!.requires_loi).toBe(true)
  })

  it('returns requires_loi=false when no LOI language is present', () => {
    const result = normalizeGrant(baseRaw({ description: 'Just a regular grant.' }))
    expect(result).not.toBeNull()
    expect(result!.requires_loi).toBe(false)
  })

  it('detects video when description contains "video required"', () => {
    const result = normalizeGrant(baseRaw({ description: 'A pitch video required.' }))
    expect(result).not.toBeNull()
    expect(result!.requires_video).toBe(true)
  })

  it('detects coalition when description contains "coalition"', () => {
    const result = normalizeGrant(baseRaw({ description: 'We fund a coalition of orgs.' }))
    expect(result).not.toBeNull()
    expect(result!.coalition_preferred).toBe(true)
  })

  it('honors explicit requires_loi=true regardless of description', () => {
    const result = normalizeGrant(
      baseRaw({ requiresLoi: true, description: 'No LOI language here.' })
    )
    expect(result).not.toBeNull()
    expect(result!.requires_loi).toBe(true)
  })

  it('produces a consistent content_hash for the same input', () => {
    const raw = baseRaw({ funderName: 'NSF', deadline: '2026-09-15T00:00:00.000Z' })
    expect(normalizeGrant(raw)!.content_hash).toBe(normalizeGrant(raw)!.content_hash)
  })

  it('produces a different content_hash when the title differs', () => {
    const a = normalizeGrant(baseRaw({ title: 'Grant A', funderName: 'NSF' }))
    const b = normalizeGrant(baseRaw({ title: 'Grant B', funderName: 'NSF' }))
    expect(a!.content_hash).not.toBe(b!.content_hash)
  })

  it('defaults category_tags to an empty array when not provided', () => {
    const result = normalizeGrant(baseRaw())
    expect(result).not.toBeNull()
    expect(result!.category_tags).toEqual([])
  })

  it('defaults geographic_restrictions to an empty object when not provided', () => {
    const result = normalizeGrant(baseRaw())
    expect(result).not.toBeNull()
    expect(result!.geographic_restrictions).toEqual({})
  })
})
