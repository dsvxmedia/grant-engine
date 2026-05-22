import { z } from 'zod'

/**
 * Zod schemas for the impact_metrics table.
 *
 * Each metric belongs to a business entity. metric_value is numeric in
 * Postgres but arrives as a JS number over JSON. Optional dimensions
 * (unit/period/geography/source) describe the measurement context.
 */

export const ImpactMetricCreateSchema = z.object({
  entity_id: z.string().uuid(),
  metric_name: z.string().min(1),
  metric_value: z.number(),
  metric_unit: z.string().optional(),
  time_period: z.string().optional(),
  geography: z.string().optional(),
  source: z.string().optional(),
})

export const ImpactMetricSchema = ImpactMetricCreateSchema.extend({
  id: z.string().uuid(),
  updated_at: z.string(),
})

export type ImpactMetricCreateInput = z.infer<typeof ImpactMetricCreateSchema>
export type ImpactMetric = z.infer<typeof ImpactMetricSchema>
