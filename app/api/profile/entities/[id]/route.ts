import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { EntityUpdateSchema } from '@/lib/profile/entity-schema'
import { generateAngles } from '@/lib/profile/angles'

type RouteContext = { params: Promise<{ id: string }> }

// Editing any of these invalidates the generated angles, so they trigger a
// fire-and-forget regeneration after a successful PATCH.
const ANGLE_TRIGGER_FIELDS = [
  'is_african_american_owned',
  'is_minority_owned',
  'is_underserved_community_tied',
  'is_tech_company',
  'is_social_enterprise',
  'is_community_serving',
  'mission',
  'focus_area',
  'who_we_serve',
  'owner_demographics',
  'geographic_ties',
] as const

async function regenerateAngles(id: string, entity: Record<string, unknown>) {
  try {
    const angles = await generateAngles(entity as any)
    const supabase = await createServiceClient()
    await (supabase.from('business_entities') as any)
      .update({ pitch_angles_generated: angles })
      .eq('id', id)
  } catch (err) {
    console.error(`Angle regeneration failed for entity ${id}:`, err)
  }
}

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

  const touchesAngleFields = ANGLE_TRIGGER_FIELDS.some(
    (field) => field in parsed.data
  )
  if (touchesAngleFields) {
    void regenerateAngles(id, data)
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
    console.error(`DELETE /api/profile/entities/${id} failed:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
