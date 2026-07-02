import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { FounderProfileSchema } from '@/lib/profile/founder-schema'

// Single-tenant: there is at most one founder_profile row. We always read the
// earliest-created record as "the" profile.
async function fetchProfile(supabase: any) {
  return supabase
    .from('founder_profile')
    .select('*')
    .order('created_at')
    .limit(1)
    .maybeSingle()
}

// GET /api/profile/founder — the single founder profile, or null if unset.
export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await fetchProfile(supabase)

  if (error) {
    console.error('GET /api/profile/founder failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ profile: data ?? null })
}

// PATCH /api/profile/founder — upsert: update the existing row, or insert one.
export async function PATCH(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', details: null },
      { status: 400 }
    )
  }

  const parsed = FounderProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()
  const { data: existing, error: fetchError } = await fetchProfile(supabase)

  if (fetchError) {
    console.error('PATCH /api/profile/founder fetch failed:', fetchError)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Casts bypass the incomplete placeholder database.types.ts (see
  // entities/route.ts). Regenerate types when local Supabase is available.
  if (existing) {
    const { data, error } = await (supabase.from('founder_profile') as any)
      .update(parsed.data)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('PATCH /api/profile/founder update failed:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  }

  // owner_name is NOT NULL; default it so the first save never fails just
  // because the user hasn't filled in their name yet.
  const insertPayload = {
    ...parsed.data,
    owner_name: parsed.data.owner_name ?? 'Founder',
  }

  const { data, error } = await (supabase.from('founder_profile') as any)
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('PATCH /api/profile/founder insert failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
