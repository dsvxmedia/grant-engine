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
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params

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

  // Cast bypasses placeholder database.types.ts that lacks grant_applications table yet.
  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .update({
      status: 'drafting',
      draft_content: { user_revision_notes: notes },
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error(`POST /api/applications/${id}/revise failed:`, error)
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ application: data })
}
