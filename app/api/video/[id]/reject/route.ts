import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/video/[id]/reject — reject a video submission (resets status for regeneration)
// Body: { notes?: string }
// Updates render_status = 'rejected'
// Returns: { submission: updated } or 404
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let notes: string | undefined
  try {
    const body = await request.json()
    if (typeof body?.notes === 'string') {
      notes = body.notes
    }
  } catch {
    // notes is optional — ignore parse errors
  }

  const supabase = await createServiceClient()

  const updatePayload: Record<string, unknown> = { render_status: 'rejected' }
  if (notes !== undefined) {
    updatePayload.notes = notes
  }

  const { data, error } = await (supabase as any)
    .from('video_submissions')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`PATCH /api/video/${id}/reject failed:`, error)
    return NextResponse.json(
      { error: 'Failed to reject video submission' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Video submission not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ submission: data })
}
