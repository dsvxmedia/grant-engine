import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/applications/[id] — fetch a single application with its draft
// Returns: { application: ApplicationRecord } or 404
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createServiceClient()

  // Cast bypasses placeholder database.types.ts that lacks grant_applications table yet.
  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`GET /api/applications/${id} failed:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
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
