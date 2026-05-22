import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// PATCH /api/applications/[id]/reject
// Body: { feedbackEmail?: boolean }
// Updates grant_applications: status = 'rejected', outcome = 'rejected'
// Also updates linked grant_matches: status = 'rejected'
// Optionally generates a feedback request email draft via Claude Haiku
// Returns: { application: ApplicationRecord, feedbackEmailDraft: string | null }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params

  let body: { feedbackEmail?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    // Body is optional; proceed with defaults
  }

  const supabase = await createServiceClient()

  // Update the application status and outcome
  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .update({ status: 'rejected', outcome: 'rejected' })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error(`PATCH /api/applications/${id}/reject failed:`, error)
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  // Also update the linked grant_matches record
  if (data.grant_match_id) {
    await (supabase as any)
      .from('grant_matches')
      .update({ status: 'rejected' })
      .eq('id', data.grant_match_id)
  }

  // Generate feedback email draft if requested
  let feedbackEmailDraft: string | null = null
  if (body.feedbackEmail) {
    try {
      const client = new Anthropic()
      const funderName = data.funder_name ?? 'the funder'
      const grantTitle = data.grant_title ?? 'our grant application'
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Write a 3-sentence professional email asking ${funderName} for feedback on why our grant application for ${grantTitle} was not selected. Tone: gracious, curious, not upset. No subject line needed.`,
          },
        ],
      })
      const block = message.content[0]
      if (block.type === 'text') {
        feedbackEmailDraft = block.text
      }
    } catch (err) {
      console.error(`PATCH /api/applications/${id}/reject — Claude feedback draft failed:`, err)
      feedbackEmailDraft = null
    }
  }

  return NextResponse.json({ application: data, feedbackEmailDraft })
}
