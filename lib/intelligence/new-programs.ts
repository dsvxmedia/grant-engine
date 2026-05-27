import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type NewProgramResult = {
  detected: number
  sources: { federal_register: number; manual: number }
}

export async function monitorNewPrograms(): Promise<NewProgramResult> {
  const empty: NewProgramResult = {
    detected: 0,
    sources: { federal_register: 0, manual: 0 },
  }

  try {
    const supabase = await createServiceClient()

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await (supabase as any)
      .from('grants')
      .select('*')
      .eq('is_new_program', true)
      .gte('created_at', since)

    if (error || !data || data.length === 0) {
      if (error) console.error('[new-programs] query error:', error)
      return empty
    }

    // Fetch grant IDs that already have a new_program notification to avoid duplicates
    const grantIds: string[] = data.map((g: { id: string }) => g.id)
    const { data: existingNotifs } = await (supabase as any)
      .from('notifications')
      .select('metadata')
      .eq('type', 'new_program')
      .in('metadata->>grant_id', grantIds)

    const alreadyNotified = new Set<string>(
      (existingNotifs ?? []).map((n: { metadata: { grant_id: string } }) => n.metadata?.grant_id).filter(Boolean)
    )

    let federalRegisterCount = 0
    let manualCount = 0

    for (const grant of data) {
      if (alreadyNotified.has(grant.id)) continue

      const source: string = grant.source ?? ''
      if (source === 'federal-register') {
        federalRegisterCount++
      } else {
        manualCount++
      }

      try {
        await (supabase as any).from('notifications').insert({
          type: 'new_program',
          title: 'New grant program detected',
          body: grant.title,
          metadata: { grant_id: grant.id },
        })
      } catch (notifErr) {
        console.error('[new-programs] failed to insert notification for grant', grant.id, notifErr)
      }
    }

    return {
      detected: data.length,
      sources: { federal_register: federalRegisterCount, manual: manualCount },
    }
  } catch (err) {
    console.error('[new-programs] unexpected error:', err)
    return empty
  }
}
