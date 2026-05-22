import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkEligibility, type EligibilityInput } from '@/lib/matching/eligibility'

const NOW = new Date('2026-05-21T12:00:00.000Z')

function daysFromNow(days: number): string {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
}

function baseInput(): EligibilityInput {
  return {
    grant: {
      id: 'grant-1',
      deadline: daysFromNow(30),
      requires_loi: false,
      funder_type: 'foundation',
      geographic_restrictions: {},
      eligibility_tags: [],
      award_min: null,
      award_max: null,
    },
    entity: {
      id: 'entity-1',
      state: 'GA',
      city: 'Atlanta',
      type: 'llc',
      is_african_american_owned: true,
      is_minority_owned: true,
      is_underserved_community_tied: true,
      is_tech_company: true,
      is_social_enterprise: false,
      is_community_serving: true,
      sam_registered: true,
      sbir_eligible: true,
      revenue_range: '100k_500k',
    },
    alreadyApplied: false,
  }
}

describe('checkEligibility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('passes when all filters satisfied', () => {
    const result = checkEligibility(baseInput())
    expect(result).toEqual({ passed: true, failures: [] })
  })

  it('fails when deadline passed', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(-1)
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('deadline_passed')
  })

  it('fails when deadline within 7 days (non-LOI)', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(5)
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('deadline_too_close')
  })

  it('fails when deadline within 14 days for LOI grant', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(10)
    input.grant.requires_loi = true
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('deadline_too_close_for_loi')
  })

  it('passes when no deadline set', () => {
    const input = baseInput()
    input.grant.deadline = null
    const result = checkEligibility(input)
    expect(result.passed).toBe(true)
  })

  it('fails when already applied', () => {
    const input = baseInput()
    input.alreadyApplied = true
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('already_applied')
  })

  it('fails SAM check for federal grant without SAM registration', () => {
    const input = baseInput()
    input.grant.funder_type = 'federal'
    input.entity.sam_registered = false
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('sam_registration_required')
  })

  it('passes SAM check for non-federal grant without SAM registration', () => {
    const input = baseInput()
    input.grant.funder_type = 'foundation'
    input.entity.sam_registered = false
    const result = checkEligibility(input)
    expect(result.failures).not.toContain('sam_registration_required')
  })

  it('fails geographic check when entity state not in allowed list', () => {
    const input = baseInput()
    input.grant.geographic_restrictions = { states: ['TX', 'FL'] }
    input.entity.state = 'GA'
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('geographic_restriction')
  })

  it('passes geographic check when no states restriction', () => {
    const input = baseInput()
    input.grant.geographic_restrictions = {}
    const result = checkEligibility(input)
    expect(result.failures).not.toContain('geographic_restriction')
  })

  it('passes geographic check when entity state is in allowed list', () => {
    const input = baseInput()
    input.grant.geographic_restrictions = { states: ['GA', 'TX'] }
    input.entity.state = 'GA'
    const result = checkEligibility(input)
    expect(result.failures).not.toContain('geographic_restriction')
  })

  it('fails geographic check when entity state is null but states are restricted', () => {
    const input = baseInput()
    input.grant.geographic_restrictions = { states: ['GA'] }
    input.entity.state = null
    const result = checkEligibility(input)
    expect(result.failures).toContain('geographic_restriction')
  })

  it('fails award size check when grant minimum exceeds entity max', () => {
    const input = baseInput()
    input.grant.award_min = 300_000
    input.grant.award_max = 500_000
    input.entity.revenue_range = 'under_100k'
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('award_too_large_for_entity')
  })

  it('passes award size check when revenue_range is 5m_plus regardless of grant size', () => {
    const input = baseInput()
    input.grant.award_min = 10_000_000
    input.grant.award_max = 50_000_000
    input.entity.revenue_range = '5m_plus'
    const result = checkEligibility(input)
    expect(result.failures).not.toContain('award_too_large_for_entity')
  })

  it('skips award size check when award_min or award_max is null', () => {
    const input = baseInput()
    input.grant.award_min = null
    input.grant.award_max = null
    input.entity.revenue_range = 'under_100k'
    const result = checkEligibility(input)
    expect(result.failures).not.toContain('award_too_large_for_entity')
  })

  it('collects multiple failures at once', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(-1)
    input.alreadyApplied = true
    const result = checkEligibility(input)
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('deadline_passed')
    expect(result.failures).toContain('already_applied')
  })
})
