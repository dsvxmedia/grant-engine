import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/video/[id]/reject — reject a video submission (resets status for regeneration)
// Body: { notes?: string }
// Updates render_status = 'rejected'
// Returns: { submission: updated } or 404
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
