import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/video/[id] — get single video submission status
// Returns: { submission: VideoJob } or 404
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('video_submissions')
    .select('*, grants(title, funder_name, award_min, award_max, deadline)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`GET /api/video/${id} failed:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch video submission' },
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
