import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/applications/[id] — fetch a single application with its draft
// Returns: { application: ApplicationRecord } or 404
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
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
