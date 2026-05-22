import { z } from 'zod'

/**
 * Zod schemas for the single-tenant founder_profile table.
 *
 * Every field is optional: the API uses an upsert pattern and the UI saves
 * partial edits, so PATCH must accept any subset of fields. why_i_started is
 * keyed by entity id (entity_id -> reason); milestones and press are JSONB
 * arrays.
 */

export const MilestoneSchema = z.object({
  year: z.number(),
  title: z.string(),
  description: z.string().optional(),
})

export const PressItemSchema = z.object({
  date: z.string(),
  outlet: z.string(),
  headline: z.string(),
  url: z.string().optional(),
})

export const FounderProfileSchema = z.object({
  owner_name: z.string().optional(),
  origin_story: z.string().optional(),
  why_i_started: z.record(z.string(), z.string()).optional(),
  personal_community_ties: z.string().optional(),
  key_milestones: z.array(MilestoneSchema).optional(),
  press_recognition: z.array(PressItemSchema).optional(),
})

export const FounderProfileUpdateSchema = FounderProfileSchema

export type Milestone = z.infer<typeof MilestoneSchema>
export type PressItem = z.infer<typeof PressItemSchema>
export type FounderProfileInput = z.infer<typeof FounderProfileSchema>
export type FounderProfileUpdateInput = z.infer<
  typeof FounderProfileUpdateSchema
>
