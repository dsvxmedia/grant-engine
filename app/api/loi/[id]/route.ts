import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { LoiUpdateSchema } from '@/lib/loi/schema'

type RouteContext = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/loi/[id] — fetch a single LOI submission.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const supabase = await createServiceClient()

  // Cast bypasses placeholder database.types.ts that lacks loi_submissions.
  const { data, error } = await (supabase as any)
    .from('loi_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`GET /api/loi/${id} failed:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch LOI submission' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'LOI submission not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ submission: data })
}

// PATCH /api/loi/[id] — update content or status.
// HARD RULE: status='submitted' is only set via this user-initiated PATCH.
// When it transitions to 'submitted', also stamp submitted_at server-side.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', details: null },
      { status: 400 }
    )
  }

  const parsed = LoiUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const updateObj: Record<string, unknown> = {}
  if (parsed.data.loi_content !== undefined) {
    updateObj.loi_content = parsed.data.loi_content
  }
  if (parsed.data.status !== undefined) {
    updateObj.status = parsed.data.status
    if (parsed.data.status === 'submitted') {
      updateObj.submitted_at = new Date().toISOString()
    }
  }

  const supabase = await createServiceClient()

  // Guard: never submit a LOI past the grant deadline.
  if (parsed.data.status === 'submitted') {
    const { data: loiRow, error: fetchErr } = await (supabase as any)
      .from('loi_submissions')
      .select('id, grants(loi_deadline, deadline)')
      .eq('id', id)
      .single()

    if (fetchErr || !loiRow) {
      return NextResponse.json({ error: 'LOI submission not found' }, { status: 404 })
    }

    const grantData = loiRow.grants as { loi_deadline?: string | null; deadline?: string | null } | null
    const deadline = grantData?.loi_deadline ?? grantData?.deadline
    if (deadline && new Date(deadline) < new Date()) {
      return NextResponse.json({ error: 'Grant deadline has passed' }, { status: 422 })
    }
  }

  const { data, error } = await (supabase as any)
    .from('loi_submissions')
    .update(updateObj)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error(`PATCH /api/loi/${id} failed:`, error)
    return NextResponse.json(
      { error: 'LOI submission not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ submission: data })
}

// DELETE /api/loi/[id] — hard delete, only allowed for draft submissions.
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const supabase = await createServiceClient()

  const { data: existing, error: fetchError } = await (supabase as any)
    .from('loi_submissions')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error(`DELETE /api/loi/${id} fetch failed:`, fetchError)
    return NextResponse.json(
      { error: 'Failed to fetch LOI submission' },
      { status: 500 }
    )
  }

  if (!existing) {
    return NextResponse.json(
      { error: 'LOI submission not found' },
      { status: 404 }
    )
  }

  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft LOIs can be deleted' },
      { status: 400 }
    )
  }

  const { error: deleteError } = await (supabase as any)
    .from('loi_submissions')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error(`DELETE /api/loi/${id} failed:`, deleteError)
    return NextResponse.json(
      { error: 'Failed to delete LOI submission' },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
