import { z } from 'zod'

/**
 * Zod schemas for the business_entities table.
 *
 * Mirrors the migration columns. `type` is intentionally a free-form string
 * (not an enum) — flexibility matters more than strictness here, since new
 * entity classifications may appear over time. Common values: 'parent',
 * 'subsidiary', 'llc', 'nonprofit', 'sole_proprietorship'.
 */

// The mutable fields of an entity, all optional. EntityCreate intersects this
// with required name/type; EntityUpdate is exactly this.
const entityOptionalFields = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  industry: z.string().optional(),
  naics_codes: z.array(z.string()).optional(),
  founding_date: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip_codes_served: z.array(z.string()).optional(),
  revenue_range: z.string().optional(),
  employee_count: z.number().int().optional(),
  mission: z.string().optional(),
  focus_area: z.string().optional(),
  is_african_american_owned: z.boolean().optional(),
  is_minority_owned: z.boolean().optional(),
  is_underserved_community_tied: z.boolean().optional(),
  is_tech_company: z.boolean().optional(),
  is_social_enterprise: z.boolean().optional(),
  is_community_serving: z.boolean().optional(),
  owner_demographics: z.record(z.string(), z.unknown()).optional(),
  geographic_ties: z.record(z.string(), z.unknown()).optional(),
  who_we_serve: z.array(z.string()).optional(),
  sam_registered: z.boolean().optional(),
  sam_uei: z.string().max(12).optional(),
  cage_code: z.string().max(5).optional(),
  sbir_eligible: z.boolean().optional(),
  sbir_phases: z.array(z.string()).optional(),
  pitch_angles_generated: z.array(z.unknown()).optional(),
  uploaded_documents: z.array(z.string()).optional(),
})

export const EntityCreateSchema = entityOptionalFields.extend({
  name: z.string().min(1),
  type: z.string().min(1),
})

export const EntityUpdateSchema = EntityCreateSchema.partial()

export type EntityCreateInput = z.infer<typeof EntityCreateSchema>
export type EntityUpdateInput = z.infer<typeof EntityUpdateSchema>
