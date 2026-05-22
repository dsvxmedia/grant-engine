import { describe, it, expect } from 'vitest'
import { normalizeGrant } from '@/lib/scrapers/normalize'
import type { RawGrant } from '@/lib/scrapers/types'

function baseRaw(overrides: Partial<RawGrant> = {}): RawGrant {
  return {
    source: 'grants-gov',
    title: 'Climate Resilience Grant',
    ...overrides,
  }
}

describe('normalizeGrant', () => {
  it('maps source, title, and funderName correctly', () => {
    const result = normalizeGrant(
      baseRaw({ funderName: 'Ford Foundation' })
    )
    expect(result.source).toBe('grants-gov')
    expect(result.title).toBe('Climate Resilience Grant')
    expect(result.funder_name).toBe('Ford Foundation')
  })

  it('parses a valid deadline string into ISO format', () => {
    const result = normalizeGrant(baseRaw({ deadline: '2026-12-31' }))
    expect(result.deadline).toBe(new Date('2026-12-31').toISOString())
  })

  it('returns null deadline for an invalid date string', () => {
    const result = normalizeGrant(baseRaw({ deadline: 'not-a-date' }))
    expect(result.deadline).toBeNull()
  })

  it('returns null deadline when deadline is absent', () => {
    const result = normalizeGrant(baseRaw())
    expect(result.deadline).toBeNull()
  })

  it('detects LOI when description contains "letter of inquiry"', () => {
    const result = normalizeGrant(
      baseRaw({ description: 'A letter of inquiry is required.' })
    )
    expect(result.requires_loi).toBe(true)
  })

  it('detects LOI when description contains "LOI required"', () => {
    const result = normalizeGrant(
      baseRaw({ description: 'LOI required by June 1.' })
    )
    expect(result.requires_loi).toBe(true)
  })

  it('returns requires_loi=false when no LOI language is present', () => {
    const result = normalizeGrant(
      baseRaw({ description: 'Just a regular grant.' })
    )
    expect(result.requires_loi).toBe(false)
  })

  it('detects video when description contains "video required"', () => {
    const result = normalizeGrant(
      baseRaw({ description: 'A pitch video required.' })
    )
    expect(result.requires_video).toBe(true)
  })

  it('detects coalition when description contains "coalition"', () => {
    const result = normalizeGrant(
      baseRaw({ description: 'We fund a coalition of orgs.' })
    )
    expect(result.coalition_preferred).toBe(true)
  })

  it('honors explicit requires_loi=true regardless of description', () => {
    const result = normalizeGrant(
      baseRaw({ requiresLoi: true, description: 'No LOI language here.' })
    )
    expect(result.requires_loi).toBe(true)
  })

  it('produces a consistent content_hash for the same input', () => {
    const raw = baseRaw({
      funderName: 'NSF',
      deadline: '2026-09-15T00:00:00.000Z',
    })
    expect(normalizeGrant(raw).content_hash).toBe(
      normalizeGrant(raw).content_hash
    )
  })

  it('produces a different content_hash when the title differs', () => {
    const a = normalizeGrant(
      baseRaw({ title: 'Grant A', funderName: 'NSF' })
    )
    const b = normalizeGrant(
      baseRaw({ title: 'Grant B', funderName: 'NSF' })
    )
    expect(a.content_hash).not.toBe(b.content_hash)
  })

  it('defaults category_tags to an empty array when not provided', () => {
    const result = normalizeGrant(baseRaw())
    expect(result.category_tags).toEqual([])
  })

  it('defaults geographic_restrictions to an empty object when not provided', () => {
    const result = normalizeGrant(baseRaw())
    expect(result.geographic_restrictions).toEqual({})
  })
})
