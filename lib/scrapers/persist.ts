import { createServiceClient } from '@/lib/supabase/server'
import type { NormalizedGrant } from './types'

export type PersistResult = { inserted: number; errors: number }

export async function persistGrants(
  grants: NormalizedGrant[]
): Promise<PersistResult> {
  if (grants.length === 0) return { inserted: 0, errors: 0 }

  const supabase = await createServiceClient()
  const { error } = await (supabase as any)
    .from('grants')
    .upsert(grants, { onConflict: 'content_hash', ignoreDuplicates: true })

  if (error) {
    console.error('[persist] supabase upsert failed', error)
    return { inserted: 0, errors: grants.length }
  }
  return { inserted: grants.length, errors: 0 }
}
