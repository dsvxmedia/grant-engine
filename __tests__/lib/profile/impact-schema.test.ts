import { describe, it, expect } from 'vitest'
import { ImpactMetricCreateSchema } from '@/lib/profile/impact-schema'

const VALID_UUID = '11111111-1111-4111-8111-111111111111'

describe('ImpactMetricCreateSchema', () => {
  it('rejects missing entity_id', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      metric_name: 'Jobs created',
      metric_value: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing metric_name', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      entity_id: VALID_UUID,
      metric_value: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing metric_value', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      entity_id: VALID_UUID,
      metric_name: 'Jobs created',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID entity_id', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      entity_id: 'not-a-uuid',
      metric_name: 'Jobs created',
      metric_value: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-number metric_value', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      entity_id: VALID_UUID,
      metric_name: 'Jobs created',
      metric_value: '100',
    })
    expect(result.success).toBe(false)
  })

  it('accepts minimal { entity_id, metric_name, metric_value }', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      entity_id: VALID_UUID,
      metric_name: 'Jobs created',
      metric_value: 100,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a full metric with all optional fields', () => {
    const result = ImpactMetricCreateSchema.safeParse({
      entity_id: VALID_UUID,
      metric_name: 'Jobs created',
      metric_value: 100,
      metric_unit: 'jobs',
      time_period: '2025',
      geography: 'Detroit, MI',
      source: 'Internal HR records',
    })
    expect(result.success).toBe(true)
  })
})
