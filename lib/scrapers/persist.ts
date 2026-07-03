import { createServiceClient } from '@/lib/supabase/server'
import { embedBatch, grantEmbeddingText, isEmbeddingEnabled } from '@/lib/embeddings'
import type { NormalizedGrant } from './types'

export type PersistResult = { inserted: number; errors: number }

const BACKFILL_BATCH = 500

async function backfillGrantEmbeddings(): Promise<void> {
  if (!isEmbeddingEnabled()) return

  const supabase = await createServiceClient()
  const { data: rows } = await (supabase as any)
    .from('grants')
    .select('id, title, funder_name, description')
    .is('description_embedding', null)
    .eq('status', 'active')
    .limit(BACKFILL_BATCH)

  if (!Array.isArray(rows) || rows.length === 0) return

  const texts = rows.map((g: any) => grantEmbeddingText(g))
  const embeddings = await embedBatch(texts)
  if (!embeddings) return

  await Promise.allSettled(
    rows.map((row: any, i: number) => {
      const embedding = embeddings[i]
      if (!embedding) return Promise.resolve()
      return (supabase as any)
        .from('grants')
        .update({ description_embedding: embedding })
        .eq('id', row.id)
    }),
  )
}

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

  // Best-effort: embed any grants that don't have a description_embedding yet.
  // Runs in the background — never blocks the scraper response.
  backfillGrantEmbeddings().catch((err) =>
    console.error('[persist] embedding backfill error', err)
  )

  return { inserted: grants.length, errors: 0 }
}
