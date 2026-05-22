import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/applications/[id]/qa — fetch QA scores for an application
// Returns: { application: { id, qa_scores, qa_passed, qa_retry_count, status } } or 404
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .select('id, qa_scores, qa_passed, qa_retry_count, status')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`GET /api/applications/${id}/qa failed:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch QA scores' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ application: data })
}
