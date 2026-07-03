import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

const ReviseSchema = z.object({
  notes: z.string().min(1).max(2000),
})

// POST /api/applications/[id]/revise
// Body: { notes: string }  — user notes for the revision
// Updates status back to 'drafting', stores user notes in draft_content.user_revision_notes
// Returns: { application: ApplicationRecord }
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', details: null },
      { status: 400 }
    )
  }

  const parsed = ReviseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { notes } = parsed.data
  const supabase = await createServiceClient()

  // Fetch existing application first so we can merge notes without destroying the draft
  const { data: existing, error: fetchError } = await (supabase as any)
    .from('grant_applications')
    .select('draft_content')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    console.error(`POST /api/applications/${id}/revise — fetch failed:`, fetchError)
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const mergedContent = {
    ...(existing.draft_content ?? {}),
    user_revision_notes: notes,
  }

  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .update({
      status: 'pending_review',
      draft_content: mergedContent,
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error(`POST /api/applications/${id}/revise failed:`, error)
    return NextResponse.json(
      { error: 'Failed to save revision notes' },
      { status: 500 }
    )
  }

  return NextResponse.json({ application: data })
}
