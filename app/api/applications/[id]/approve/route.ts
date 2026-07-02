import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// PATCH /api/applications/[id]/approve
// Updates grant_applications status to 'approved' and linked grant_matches status to 'approved'
// Returns: { application: ApplicationRecord } or 404
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const supabase = await createServiceClient()

  // Update the application status
  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error(`PATCH /api/applications/${id}/approve failed:`, error)
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  // Also update the linked grant_matches record
  if (data.grant_match_id) {
    await (supabase as any)
      .from('grant_matches')
      .update({ status: 'approved' })
      .eq('id', data.grant_match_id)
  }

  return NextResponse.json({ application: data })
}
