import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/video/[id]/approve — approve a video submission for submission
// Updates render_status = 'approved', approved_at = now()
// Returns: { submission: updated } or 404
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('video_submissions')
    .update({
      render_status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`PATCH /api/video/${id}/approve failed:`, error)
    return NextResponse.json(
      { error: 'Failed to approve video submission' },
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
