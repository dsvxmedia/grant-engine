import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { runVideoPipeline } from '@/lib/video/pipeline'

const VideoCreateSchema = z.object({
  grant_match_id: z.string().uuid(),
})

// GET /api/video — list all video submissions, newest first
// Returns: { submissions: VideoJob[] }
export async function GET() {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('video_submissions')
    .select('*, grants(title, funder_name, deadline)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/video failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video submissions' },
      { status: 500 }
    )
  }

  return NextResponse.json({ submissions: data ?? [] })
}

// POST /api/video — trigger video generation for a grant match
// Body: { grant_match_id: string (UUID) }
// Returns: { result: VideoResult } with 201
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = VideoCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { grant_match_id } = parsed.data

  try {
    const result = await runVideoPipeline(grant_match_id)
    return NextResponse.json({ result }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('POST /api/video pipeline failed:', err)
    return NextResponse.json(
      { error: 'Video pipeline failed', details: message },
      { status: 500 }
    )
  }
}
