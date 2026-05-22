import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const CreatePartnerSchema = z.object({
  name: z.string().min(1),
  mission: z.string().optional(),
  type: z.string().optional(),
  contact_email: z.string().email().optional(),
})

// GET /api/coalition — list partner organizations
export async function GET(_request?: Request) {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('partner_organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[coalition] GET failed:', error)
    return NextResponse.json({ partners: [] })
  }

  return NextResponse.json({ partners: data ?? [] })
}

// POST /api/coalition — create partner organization
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreatePartnerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('partner_organizations')
    .insert({
      name: parsed.data.name,
      mission: parsed.data.mission ?? null,
      type: parsed.data.type ?? null,
      contact_email: parsed.data.contact_email ?? null,
    })
    .select()

  if (error) {
    console.error('[coalition] POST insert failed:', error)
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }

  const partner = data?.[0]
  return NextResponse.json({ partner }, { status: 201 })
}
