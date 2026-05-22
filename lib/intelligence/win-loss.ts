import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type WinLossSegment = {
  dimension: string
  attempts: number
  wins: number
  winRate: number
}

export type WinLossReport = {
  segments: WinLossSegment[]
  topPerformers: WinLossSegment[]
  poorPerformers: WinLossSegment[]
  relationshipFirstFunders: string[]
  analyzedAt: string
}

function emptyReport(): WinLossReport {
  return {
    segments: [],
    topPerformers: [],
    poorPerformers: [],
    relationshipFirstFunders: [],
    analyzedAt: new Date().toISOString(),
  }
}

export async function analyzeWinLoss(): Promise<WinLossReport> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await (supabase as any)
      .from('grant_applications')
      .select(
        `id, outcome, entity_id, selected_framework,
         grants(funder_type, funder_name, category_tags),
         business_entities(name)`
      )
      .in('outcome', ['awarded', 'rejected'])

    if (error || !data || data.length === 0) {
      if (error) {
        console.error('[win-loss] Supabase error:', error)
      }
      return emptyReport()
    }

    // Group by funder_type × entity_id × selected_framework
    const dimensionMap = new Map<
      string,
      { attempts: number; wins: number }
    >()

    // Track per-funder win/rejection counts for relationship funders
    const funderMap = new Map<string, { wins: number; rejections: number }>()

    for (const row of data) {
      const funderType = row.grants?.funder_type ?? 'unknown'
      const entityId: string = row.entity_id ?? 'unknown'
      const framework: string = row.selected_framework ?? 'unknown'
      const funderName: string = row.grants?.funder_name ?? 'Unknown'
      const isWin = row.outcome === 'awarded'

      // Dimension segment key
      const key = `funder_type:${funderType}|entity:${entityId}|framework:${framework}`
      const existing = dimensionMap.get(key) ?? { attempts: 0, wins: 0 }
      dimensionMap.set(key, {
        attempts: existing.attempts + 1,
        wins: existing.wins + (isWin ? 1 : 0),
      })

      // Funder-level tracking
      const funderEntry = funderMap.get(funderName) ?? { wins: 0, rejections: 0 }
      funderMap.set(funderName, {
        wins: funderEntry.wins + (isWin ? 1 : 0),
        rejections: funderEntry.rejections + (isWin ? 0 : 1),
      })
    }

    const segments: WinLossSegment[] = []
    for (const [dimension, { attempts, wins }] of dimensionMap.entries()) {
      segments.push({
        dimension,
        attempts,
        wins,
        winRate: attempts > 0 ? wins / attempts : 0,
      })
    }

    // Qualified segments for top/poor performers (min 3 attempts)
    const qualified = segments.filter((s) => s.attempts >= 3)
    const sorted = [...qualified].sort((a, b) => b.winRate - a.winRate)
    const topPerformers = sorted.slice(0, 5)
    const poorPerformers = [...sorted].reverse().slice(0, 5)

    // Relationship-first funders: 3+ rejections, 0 wins
    const relationshipFirstFunders: string[] = []
    for (const [funderName, { wins, rejections }] of funderMap.entries()) {
      if (rejections >= 3 && wins === 0) {
        relationshipFirstFunders.push(funderName)
      }
    }

    return {
      segments,
      topPerformers,
      poorPerformers,
      relationshipFirstFunders,
      analyzedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[win-loss] Unexpected error:', err)
    return emptyReport()
  }
}
