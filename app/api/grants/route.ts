import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/grants
// Query params: ?search=text&funderType=federal&status=active&requiresLoi=true&isNewProgram=true&minScore=70
// Returns: { grants: GrantRecord[] }
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const funderType = searchParams.get('funderType')
  const status = searchParams.get('status') ?? 'active'
  const requiresLoi = searchParams.get('requiresLoi')
  const isNewProgram = searchParams.get('isNewProgram')

  const supabase = await createServiceClient()

  // Cast bypasses placeholder database.types.ts that lacks grants table yet.
  let query = (supabase as any)
    .from('grants')
    .select('*')
    .eq('status', status)

  if (search) {
    query = query.or(`title.ilike.%${search}%,funder_name.ilike.%${search}%`)
  }

  if (funderType) {
    query = query.eq('funder_type', funderType)
  }

  if (requiresLoi === 'true') {
    query = query.eq('requires_loi', true)
  }

  if (isNewProgram === 'true') {
    query = query.eq('is_new_program', true)
  }

  query = query
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200)

  const { data, error } = await query

  if (error) {
    console.error('GET /api/grants failed:', error)
    return NextResponse.json({ grants: [] })
  }

  return NextResponse.json({ grants: data ?? [] })
}
