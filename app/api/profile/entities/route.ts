import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { EntityCreateSchema } from '@/lib/profile/entity-schema'

// GET /api/profile/entities — all entities, parents first then children.
export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('business_entities')
    .select('*')
    // parent_id IS NULL sorts first when ascending with nullsFirst.
    .order('parent_id', { ascending: true, nullsFirst: true })

  if (error) {
    console.error('GET /api/profile/entities failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ entities: data ?? [] })
}

// POST /api/profile/entities — create a new entity.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', details: null },
      { status: 400 }
    )
  }

  const parsed = EntityCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()
  // The generated database.types.ts is a placeholder missing most
  // business_entities columns, so the typed insert rejects the full payload.
  // Cast to bypass the incomplete types; regenerate types once Docker/Supabase
  // is available locally.
  const { data, error } = await (supabase.from('business_entities') as any)
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    console.error('POST /api/profile/entities failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ entity: data }, { status: 201 })
}
