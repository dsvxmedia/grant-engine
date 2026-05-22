import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computeFitScore, type FitScoreInput } from '@/lib/matching/fit-score'

const NOW = new Date('2026-05-21T00:00:00.000Z')

function daysFromNow(days: number): string {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
}

function baseInput(): FitScoreInput {
  return {
    grant: {
      funder_type: 'foundation',
      award_min: 25_000,
      award_max: 100_000,
      deadline: daysFromNow(30),
      eligibility_tags: [],
      category_tags: [],
      is_new_program: false,
    },
    entity: {
      mission: 'technology community development',
      focus_area: 'urban tech',
      pitch_angles_generated: [],
      who_we_serve: null,
      revenue_range: '100k_500k',
      is_tech_company: true,
      is_social_enterprise: false,
      is_community_serving: true,
    },
  }
}

describe('computeFitScore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('returns score between 0 and 100', () => {
    const result = computeFitScore(baseInput())
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('score has correct structure', () => {
    const result = computeFitScore(baseInput())
    expect(result.components).toHaveProperty('missionAlignment')
    expect(result.components).toHaveProperty('angleMatch')
    expect(result.components).toHaveProperty('awardSizeFit')
    expect(result.components).toHaveProperty('deadlineUrgency')
    expect(result.components).toHaveProperty('funderPrestige')
    expect(result.components).toHaveProperty('winLoss')
    expect(Array.isArray(result.matchedAngles)).toBe(true)
  })

  it('funder prestige: federal grants score higher prestige than niche', () => {
    const federal = baseInput()
    federal.grant.funder_type = 'federal'
    const niche = baseInput()
    niche.grant.funder_type = 'niche'
    const federalResult = computeFitScore(federal)
    const nicheResult = computeFitScore(niche)
    expect(federalResult.components.funderPrestige).toBeGreaterThan(
      nicheResult.components.funderPrestige
    )
  })

  it('new program bonus adds to funder prestige', () => {
    const newProgram = baseInput()
    newProgram.grant.is_new_program = true
    const oldProgram = baseInput()
    oldProgram.grant.is_new_program = false
    const newResult = computeFitScore(newProgram)
    const oldResult = computeFitScore(oldProgram)
    expect(newResult.components.funderPrestige).toBeGreaterThan(
      oldResult.components.funderPrestige
    )
  })

  it('deadline urgency: ideal window (14-60 days) scores 1.0', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(30)
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(1.0)
  })

  it('deadline urgency: far future scores lower', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(200)
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(0.6)
  })

  it('deadline urgency: tight deadline (7-14 days) scores 0.5', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(10)
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(0.5)
  })

  it('deadline urgency: very tight (<7 days) scores 0.2', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(3)
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(0.2)
  })

  it('deadline urgency: medium-far (60-120 days) scores 0.8', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(90)
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(0.8)
  })

  it('deadline urgency: null deadline → neutral 0.5', () => {
    const input = baseInput()
    input.grant.deadline = null
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(0.5)
  })

  it('award size: midpoint within band scores 1.0', () => {
    const input = baseInput()
    input.entity.revenue_range = '100k_500k'
    input.grant.award_min = 25_000
    input.grant.award_max = 75_000
    const result = computeFitScore(input)
    expect(result.components.awardSizeFit).toBe(1.0)
  })

  it('award size: null award → neutral 0.5', () => {
    const input = baseInput()
    input.grant.award_min = null
    const result = computeFitScore(input)
    expect(result.components.awardSizeFit).toBe(0.5)
  })

  it('award size: null revenue_range → neutral 0.5', () => {
    const input = baseInput()
    input.entity.revenue_range = null
    const result = computeFitScore(input)
    expect(result.components.awardSizeFit).toBe(0.5)
  })

  it('award size: midpoint below band scales down proportionally', () => {
    const input = baseInput()
    input.entity.revenue_range = '1m_5m'
    input.grant.award_min = 50_000
    input.grant.award_max = 50_000
    const result = computeFitScore(input)
    expect(result.components.awardSizeFit).toBeLessThan(1.0)
    expect(result.components.awardSizeFit).toBeGreaterThan(0)
  })

  it('award size: midpoint above band scales down proportionally', () => {
    const input = baseInput()
    input.entity.revenue_range = 'under_100k'
    input.grant.award_min = 500_000
    input.grant.award_max = 500_000
    const result = computeFitScore(input)
    expect(result.components.awardSizeFit).toBeLessThan(1.0)
    expect(result.components.awardSizeFit).toBeGreaterThan(0)
  })

  it('angle match: matched eligibility tags appear in matchedAngles', () => {
    const input = baseInput()
    input.grant.eligibility_tags = ['tech_company']
    input.entity.pitch_angles_generated = ['tech startup serving communities']
    const result = computeFitScore(input)
    expect(result.matchedAngles).toContain('tech_company')
    expect(result.components.angleMatch).toBeGreaterThan(0)
  })

  it('angle match: object-shaped pitch_angles_generated parsed correctly', () => {
    const input = baseInput()
    input.grant.eligibility_tags = ['minority_owned']
    input.entity.pitch_angles_generated = [
      { angle: 'minority-owned business with deep roots' },
    ]
    const result = computeFitScore(input)
    expect(result.matchedAngles).toContain('minority_owned')
  })

  it('angle match: who_we_serve contributes to matching', () => {
    const input = baseInput()
    input.grant.eligibility_tags = ['underserved_community']
    input.entity.pitch_angles_generated = []
    input.entity.who_we_serve = ['underserved low-income families']
    const result = computeFitScore(input)
    expect(result.matchedAngles).toContain('underserved_community')
  })

  it('angle match: no grant eligibility tags → neutral 0.5', () => {
    const input = baseInput()
    input.grant.eligibility_tags = []
    const result = computeFitScore(input)
    expect(result.components.angleMatch).toBe(0.5)
  })

  it('win/loss component is always 0', () => {
    const result = computeFitScore(baseInput())
    expect(result.components.winLoss).toBe(0)
  })

  it('mission alignment: no mission → neutral 0.3', () => {
    const input = baseInput()
    input.entity.mission = null
    input.entity.focus_area = null
    const result = computeFitScore(input)
    expect(result.components.missionAlignment).toBe(0.3)
  })

  it('mission alignment: overlap with grant tags raises score', () => {
    const input = baseInput()
    input.entity.mission = 'technology and innovation for communities'
    input.entity.focus_area = 'urban development'
    input.grant.category_tags = ['technology', 'innovation', 'communities']
    const result = computeFitScore(input)
    expect(result.components.missionAlignment).toBeGreaterThan(0)
  })

  it('final score increases with better inputs', () => {
    const high = baseInput()
    high.grant.funder_type = 'federal'
    high.grant.is_new_program = true
    high.grant.eligibility_tags = ['tech_company', 'minority_owned']
    high.grant.category_tags = ['technology', 'community', 'development']
    high.entity.pitch_angles_generated = [
      'minority-owned tech company serving urban communities',
    ]
    high.entity.who_we_serve = ['community members']

    const neutral = baseInput()
    neutral.entity.mission = null
    neutral.entity.focus_area = null
    neutral.entity.pitch_angles_generated = []
    neutral.grant.eligibility_tags = []
    neutral.grant.category_tags = []

    const highResult = computeFitScore(high)
    const neutralResult = computeFitScore(neutral)
    expect(highResult.score).toBeGreaterThan(neutralResult.score)
  })

  it('score is rounded to 1 decimal', () => {
    const result = computeFitScore(baseInput())
    const decimals = result.score.toString().split('.')[1] ?? ''
    expect(decimals.length).toBeLessThanOrEqual(1)
  })

  it('deadline urgency: passed deadline scores 0', () => {
    const input = baseInput()
    input.grant.deadline = daysFromNow(-5)
    const result = computeFitScore(input)
    expect(result.components.deadlineUrgency).toBe(0)
  })

  it('funder prestige with new program bonus caps at 1.0', () => {
    const input = baseInput()
    input.grant.funder_type = 'federal'
    input.grant.is_new_program = true
    const result = computeFitScore(input)
    expect(result.components.funderPrestige).toBeLessThanOrEqual(1.0)
  })
})
