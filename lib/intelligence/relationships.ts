import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export type OutreachDraft = {
  to: string
  subject: string
  body: string
}

export async function getDueOutreachWindows(): Promise<
  { funderName: string; grantTitle: string; predictedOpenDate: string }[]
> {
  try {
    const supabase = await createServiceClient()
    const now = new Date().toISOString()
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await (supabase as any)
      .from('grant_cycles')
      .select('predicted_next_open, grants(title, funder_name)')
      .gte('predicted_next_open', now)
      .lte('predicted_next_open', in30Days)

    if (error || !data) {
      if (error) console.error('[relationships] getDueOutreachWindows error:', error)
      return []
    }

    return data.map((row: any) => ({
      funderName: row.grants?.funder_name ?? 'Unknown',
      grantTitle: row.grants?.title ?? 'Unknown',
      predictedOpenDate: row.predicted_next_open,
    }))
  } catch (err) {
    console.error('[relationships] getDueOutreachWindows unexpected error:', err)
    return []
  }
}

export async function draftOutreachEmail(
  funderName: string,
  entityMission: string
): Promise<OutreachDraft> {
  const templateDraft: OutreachDraft = {
    to: funderName,
    subject: `Introduction: Our Work and Mission`,
    body: `We are reaching out to introduce our organization and share our mission: ${entityMission}. We believe our work aligns with your funding priorities and would welcome the opportunity to connect.`,
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Write a 2-sentence professional email introducing our organization to the program officer at ${funderName}. Our mission: ${entityMission}. Do not ask for anything — just make them aware of our work. Return only the email body, no subject line.`,
        },
      ],
    })

    const block = response.content[0]
    const body = block.type === 'text' ? block.text.trim() : ''

    if (!body) return templateDraft

    return {
      to: funderName,
      subject: `Introduction: Our Work Aligns with ${funderName}'s Mission`,
      body,
    }
  } catch (err) {
    console.error('[relationships] draftOutreachEmail error:', err)
    return templateDraft
  }
}

export async function logContact(
  programOfficerId: string,
  type: string,
  notes: string
): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const contactEntry = {
      type,
      notes,
      timestamp: new Date().toISOString(),
    }

    // Append to contact_history jsonb array via update
    const { error } = await (supabase as any)
      .from('program_officers')
      .update({
        contact_history: (supabase as any).raw(
          `contact_history || '${JSON.stringify([contactEntry])}'::jsonb`
        ),
      })
      .eq('id', programOfficerId)

    if (error) {
      console.error('[relationships] logContact error:', error)
    }
  } catch (err) {
    console.error('[relationships] logContact unexpected error:', err)
  }
}
