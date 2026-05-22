import { z } from 'zod'

export const LoiCreateSchema = z.object({
  grant_id: z.string().uuid(),
  entity_id: z.string().uuid(),
})

export const LoiUpdateSchema = z.object({
  loi_content: z.string().min(1).optional(),
  status: z.enum(['draft', 'submitted', 'accepted', 'rejected']).optional(),
})

export type LoiCreateInput = z.infer<typeof LoiCreateSchema>
export type LoiUpdateInput = z.infer<typeof LoiUpdateSchema>
