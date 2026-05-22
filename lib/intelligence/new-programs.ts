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

    let federalRegisterCount = 0
    let manualCount = 0

    for (const grant of data) {
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
