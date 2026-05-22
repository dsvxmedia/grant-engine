import { describe, it, expect } from 'vitest'
import {
  EntityCreateSchema,
  EntityUpdateSchema,
} from '@/lib/profile/entity-schema'

describe('EntityCreateSchema', () => {
  it('rejects missing name', () => {
    const result = EntityCreateSchema.safeParse({ type: 'parent' })
    expect(result.success).toBe(false)
  })

  it('rejects missing type', () => {
    const result = EntityCreateSchema.safeParse({ name: 'Acme Corp' })
    expect(result.success).toBe(false)
  })

  it('accepts minimal { name, type }', () => {
    const result = EntityCreateSchema.safeParse({
      name: 'Acme Corp',
      type: 'parent',
    })
    expect(result.success).toBe(true)
  })

  it('accepts full entity with all optional fields', () => {
    const full = {
      name: 'Acme Holdings',
      type: 'parent',
      parent_id: '550e8400-e29b-41d4-a716-446655440000',
      industry: 'Technology',
      naics_codes: ['541511', '541512'],
      founding_date: '2018-04-01',
      state: 'GA',
      city: 'Atlanta',
      zip_codes_served: ['30301', '30302'],
      revenue_range: '1M-5M',
      employee_count: 42,
      mission: 'Build community-serving technology.',
      focus_area: 'Workforce development',
      is_african_american_owned: true,
      is_minority_owned: true,
      is_underserved_community_tied: true,
      is_tech_company: true,
      is_social_enterprise: false,
      is_community_serving: true,
      owner_demographics: { gender: 'female', veteran: false },
      geographic_ties: { hubzone: true },
      who_we_serve: ['small businesses', 'nonprofits'],
      sam_registered: true,
      sam_uei: 'ABC123DEF456',
      cage_code: '1A2B3',
      sbir_eligible: true,
      sbir_phases: ['I', 'II'],
      pitch_angles_generated: [{ angle: 'minority-owned tech' }],
      uploaded_documents: ['https://blob/doc1.pdf'],
    }
    const result = EntityCreateSchema.safeParse(full)
    expect(result.success).toBe(true)
  })
})

describe('EntityUpdateSchema', () => {
  it('accepts empty object {}', () => {
    const result = EntityUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update { name: "New Name" }', () => {
    const result = EntityUpdateSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })
})
