import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const supabase = await createServiceClient()

  const { error } = await (supabase as any)
    .from('grant_matches')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) {
    console.error(`PATCH /api/matches/${id}/archive failed:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
