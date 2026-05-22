import { createServiceClient } from '@/lib/supabase/server'
import type { NormalizedGrant } from './types'

export async function isDuplicate(contentHash: string): Promise<boolean> {
  const supabase = await createServiceClient()
  const { data } = await (supabase as any)
    .from('grants')
    .select('id')
    .eq('content_hash', contentHash)
    .limit(1)
    .maybeSingle()
  return data !== null
}

export async function filterNewGrants(
  grants: NormalizedGrant[]
): Promise<NormalizedGrant[]> {
  if (grants.length === 0) return []

  const hashes = grants.map((g) => g.content_hash)
  const supabase = await createServiceClient()
  const { data } = await (supabase as any)
    .from('grants')
    .select('content_hash')
    .in('content_hash', hashes)

  const existing = new Set<string>(
    (data ?? []).map((row: { content_hash: string }) => row.content_hash)
  )
  return grants.filter((g) => !existing.has(g.content_hash))
}
