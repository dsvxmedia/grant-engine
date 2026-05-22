import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { EntityUpdateSchema } from '@/lib/profile/entity-schema'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/profile/entities/[id] — single entity.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('business_entities')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  return NextResponse.json({ entity: data })
}

// PATCH /api/profile/entities/[id] — partial update, merged into existing row.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', details: null },
      { status: 400 }
    )
  }

  const parsed = EntityUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()
  // Cast bypasses the incomplete placeholder database.types.ts (see
  // entities/route.ts). Regenerate types when local Supabase is available.
  const { data, error } = await (supabase.from('business_entities') as any)
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  return NextResponse.json({ entity: data })
}

// DELETE /api/profile/entities/[id] — hard delete.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createServiceClient()
  const { error, count } = await supabase
    .from('business_entities')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
