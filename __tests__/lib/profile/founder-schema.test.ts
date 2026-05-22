import { describe, it, expect } from 'vitest'
import {
  FounderProfileSchema,
  MilestoneSchema,
  PressItemSchema,
} from '@/lib/profile/founder-schema'

describe('FounderProfileSchema', () => {
  it('accepts an empty object', () => {
    expect(FounderProfileSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a partial object with only owner_name', () => {
    expect(FounderProfileSchema.safeParse({ owner_name: 'Jane' }).success).toBe(
      true
    )
  })

  it('accepts a full profile with milestones and press items', () => {
    const full = {
      owner_name: 'Jane Doe',
      origin_story: 'It started in a garage.',
      why_i_started: { 'entity-uuid': 'to serve my community' },
      personal_community_ties: 'Lifelong resident.',
      key_milestones: [
        { year: 2020, title: 'Founded', description: 'Day one.' },
        { year: 2022, title: 'First grant' },
      ],
      press_recognition: [
        {
          date: '2023-01-15',
          outlet: 'Local Times',
          headline: 'A rising star',
          url: 'https://example.com/article',
        },
      ],
    }
    expect(FounderProfileSchema.safeParse(full).success).toBe(true)
  })

  it('accepts why_i_started keyed by entity id', () => {
    const parsed = FounderProfileSchema.safeParse({
      why_i_started: { 'some-uuid': 'reason text' },
    })
    expect(parsed.success).toBe(true)
  })
})

describe('MilestoneSchema', () => {
  it('rejects a milestone missing year', () => {
    expect(MilestoneSchema.safeParse({ title: 'No year' }).success).toBe(false)
  })

  it('rejects a milestone missing title', () => {
    expect(MilestoneSchema.safeParse({ year: 2020 }).success).toBe(false)
  })
})

describe('PressItemSchema', () => {
  it('rejects a press item missing outlet', () => {
    expect(
      PressItemSchema.safeParse({ date: '2023-01-01', headline: 'Hi' }).success
    ).toBe(false)
  })

  it('rejects a press item missing headline', () => {
    expect(
      PressItemSchema.safeParse({ date: '2023-01-01', outlet: 'Times' }).success
    ).toBe(false)
  })
})
