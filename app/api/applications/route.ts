import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/applications — list all applications, newest first
// Returns: { applications: ApplicationRecord[] }
export async function GET() {
  const supabase = await createServiceClient()

  // Cast bypasses placeholder database.types.ts that lacks grant_applications table yet.
  const { data, error } = await (supabase as any)
    .from('grant_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/applications failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }

  return NextResponse.json({ applications: data ?? [] })
}
