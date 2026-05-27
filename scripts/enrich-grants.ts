/**
 * Enrich sparse grants.gov records with full descriptions from the detail API.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/enrich-grants.ts
 */
import { createClient } from '@supabase/supabase-js'
import type { OppDetail } from '../lib/scrapers/grants-gov'
import { fetchGrantDetail } from '../lib/scrapers/grants-gov'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 5
const DELAY_MS = 500

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractOppId(sourceUrl: string): string | null {
  const match = sourceUrl.match(/search-results-detail\/([^/?#]+)/)
  return match?.[1] ?? null
}

function applyDetail(detail: OppDetail) {
  const syn = detail.synopsis
  return {
    description: syn?.synopsisDesc ?? detail.synopsisDesc ?? null,
    eligibility_text: syn?.applicantDesc ?? detail.applicantDesc ?? null,
    award_min: syn?.awardFloor ? Number(syn.awardFloor) : null,
    award_max: syn?.awardCeiling ? Number(syn.awardCeiling) : null,
  }
}

async function main() {
  console.log('🔍 Fetching sparse grants-gov records...\n')

  const { data: sparseGrants, error } = await supabase
    .from('grants')
    .select('id, source_url, title')
    .eq('source', 'grants-gov')
    .is('description', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch sparse grants:', error.message)
    process.exit(1)
  }

  console.log(`Found ${sparseGrants.length} grants missing description.\n`)

  let enriched = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < sparseGrants.length; i += BATCH_SIZE) {
    const batch = sparseGrants.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async grant => {
        if (!grant.source_url) {
          skipped++
          return
        }

        const oppId = extractOppId(grant.source_url)
        if (!oppId) {
          skipped++
          return
        }

        const detail = await fetchGrantDetail(oppId)

        if (!detail) {
          console.log(`  ✗ No detail returned for: ${grant.title}`)
          failed++
          return
        }

        const updates = applyDetail(detail)
        const hasAnyData = Object.values(updates).some(v => v !== null)

        if (!hasAnyData) {
          console.log(`  — Empty detail for: ${grant.title}`)
          failed++
          return
        }

        const { error: updateError } = await supabase
          .from('grants')
          .update(updates)
          .eq('id', grant.id)

        if (updateError) {
          console.error(`  ✗ Update failed for ${grant.title}:`, updateError.message)
          failed++
        } else {
          const desc = updates.description?.slice(0, 80) ?? '(no desc)'
          console.log(`  ✓ ${grant.title.slice(0, 50)} → "${desc}..."`)
          enriched++
        }
      })
    )

    const processed = Math.min(i + BATCH_SIZE, sparseGrants.length)
    console.log(`\n[${processed}/${sparseGrants.length}] batch complete\n`)

    if (i + BATCH_SIZE < sparseGrants.length) {
      await sleep(DELAY_MS)
    }
  }

  console.log('─'.repeat(50))
  console.log(`✓ Done — ${enriched} enriched, ${failed} failed, ${skipped} skipped`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
