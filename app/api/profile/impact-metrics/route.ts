import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { ImpactMetricCreateSchema } from '@/lib/profile/impact-schema'

// GET /api/profile/impact-metrics?entity_id=<uuid> — all metrics, optionally
// scoped to one entity, newest first.
export async function GET(request: NextRequest) {
  const entityId = new URL(request.url).searchParams.get('entity_id')

  if (entityId !== null && !z.string().uuid().safeParse(entityId).success) {
    return NextResponse.json({ error: 'Invalid entity_id' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  let query = supabase.from('impact_metrics').select('*')
  if (entityId) {
    query = query.eq('entity_id', entityId)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    console.error('GET /api/profile/impact-metrics failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ metrics: data ?? [] })
}

// POST /api/profile/impact-metrics — create a metric for an existing entity.
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

  const parsed = ImpactMetricCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()

  const { data: entity } = await supabase
    .from('business_entities')
    .select('id')
    .eq('id', parsed.data.entity_id)
    .single()

  if (!entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Cast bypasses the placeholder database.types.ts (see entities/route.ts).
  const { data, error } = await (supabase.from('impact_metrics') as any)
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    console.error('POST /api/profile/impact-metrics failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ metric: data }, { status: 201 })
}
