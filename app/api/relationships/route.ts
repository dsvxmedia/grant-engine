import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const CreateOfficerSchema = z.object({
  funder_name: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  focus_areas: z.array(z.string()).optional(),
})

// GET /api/relationships — list all program officers
export async function GET(_request?: Request) {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('program_officers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[relationships] GET failed:', error)
    return NextResponse.json({ officers: [] })
  }

  return NextResponse.json({ officers: data ?? [] })
}

// POST /api/relationships — create program officer
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateOfficerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('program_officers')
    .insert({
      funder_name: parsed.data.funder_name,
      name: parsed.data.name ?? null,
      email: parsed.data.email ?? null,
      focus_areas: parsed.data.focus_areas ?? [],
    })
    .select()

  if (error) {
    console.error('[relationships] POST insert failed:', error)
    return NextResponse.json({ error: 'Failed to create officer' }, { status: 500 })
  }

  const officer = data?.[0]
  return NextResponse.json({ officer }, { status: 201 })
}
