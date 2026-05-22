import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { HumanizerOutput, UniquenessOutput } from '@/lib/writing/types'

const SIMILARITY_THRESHOLD = 0.85
const LOOKBACK_DAYS = 90

/** Extract a set of lowercase keywords (>= 3 chars) from a block of text. */
function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 3)
  return new Set(words)
}

/** Jaccard similarity between two keyword sets: |intersection| / |union| */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0

  let intersectionCount = 0
  for (const word of a) {
    if (b.has(word)) intersectionCount++
  }

  const unionCount = a.size + b.size - intersectionCount
  return unionCount === 0 ? 0 : intersectionCount / unionCount
}

export async function checkUniqueness(humanized: HumanizerOutput): Promise<UniquenessOutput> {
  const passthroughFields = {
    sections: humanized.sections,
    rawText: humanized.rawText,
    changesLog: humanized.changesLog,
    selectedAngles: humanized.selectedAngles,
    selectedFramework: humanized.selectedFramework,
    researchNotes: humanized.researchNotes,
    humanizerApplied: humanized.humanizerApplied,
  }

  let existingApplications: Array<{ draft_content: unknown }>

  try {
    const supabase = await createServiceClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - LOOKBACK_DAYS)

    const { data, error } = await supabase
      .from('grant_applications')
      .select('draft_content')
      .gte('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('[uniqueness] Supabase query failed:', error)
      return { ...passthroughFields, uniquenessScore: 1.0, needsRevision: false }
    }

    existingApplications = (data as Array<{ draft_content: unknown }>) ?? []
  } catch (err) {
    console.error('[uniqueness] Unexpected error querying grant_applications:', err)
    return { ...passthroughFields, uniquenessScore: 1.0, needsRevision: false }
  }

  if (existingApplications.length === 0) {
    return { ...passthroughFields, uniquenessScore: 1.0, needsRevision: false }
  }

  const draftKeywords = extractKeywords(humanized.rawText)

  let maxSimilarity = 0
  for (const app of existingApplications) {
    const existingText = JSON.stringify(app.draft_content ?? '')
    const existingKeywords = extractKeywords(existingText)
    const similarity = jaccardSimilarity(draftKeywords, existingKeywords)
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity
    }
  }

  const uniquenessScore = 1.0 - maxSimilarity
  const needsRevision = maxSimilarity > SIMILARITY_THRESHOLD

  return { ...passthroughFields, uniquenessScore, needsRevision }
}
