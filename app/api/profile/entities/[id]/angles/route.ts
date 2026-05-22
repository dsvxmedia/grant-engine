import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAngles } from '@/lib/profile/angles'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/profile/entities/[id]/angles — regenerate narrative angles.
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params

  try {
    const supabase = await createServiceClient()
    const { data: entity, error } = await supabase
      .from('business_entities')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    const angles = await generateAngles(entity as any)

    await (supabase.from('business_entities') as any)
      .update({ pitch_angles_generated: angles })
      .eq('id', id)

    return NextResponse.json({ angles }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
