import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { LoiCreateSchema } from '@/lib/loi/schema'
import { generateLoi } from '@/lib/loi/generate'

// GET /api/loi — list all LOI submissions, newest first.
export async function GET() {
  const supabase = await createServiceClient()
  // The generated database.types.ts placeholder does not include the
  // loi_submissions table yet; cast bypasses the missing types until
  // local Supabase is available to regenerate them.
  const { data, error } = await (supabase as any)
    .from('loi_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/loi failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LOI submissions' },
      { status: 500 }
    )
  }

  return NextResponse.json({ submissions: data ?? [] })
}

// POST /api/loi — create a draft LOI submission with auto-generated content.
// Always inserts as status='draft'. User must explicitly PATCH to 'submitted'.
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

  const parsed = LoiCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { grant_id, entity_id } = parsed.data
  const supabase = await createServiceClient()

  const { data: grant, error: grantError } = await (supabase as any)
    .from('grants')
    .select('*')
    .eq('id', grant_id)
    .maybeSingle()
  if (grantError || !grant) {
    return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
  }

  const { data: entity, error: entityError } = await (supabase as any)
    .from('business_entities')
    .select('*')
    .eq('id', entity_id)
    .maybeSingle()
  if (entityError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Founder profile is optional — fall back to no story rather than erroring.
  const { data: founderProfile } = await (supabase as any)
    .from('founder_profile')
    .select('origin_story')
    .order('created_at')
    .limit(1)
    .maybeSingle()

  let loiOutput
  try {
    loiOutput = await generateLoi({
      grant,
      entity,
      founderStory: founderProfile?.origin_story,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `POST /api/loi generation failed for grant ${grant_id}, entity ${entity_id}:`,
      err
    )
    return NextResponse.json(
      { error: 'LOI generation failed', details: message },
      { status: 500 }
    )
  }

  const { data, error } = await (supabase as any)
    .from('loi_submissions')
    .insert({
      grant_id,
      entity_id,
      loi_content: loiOutput.content,
      status: 'draft',
      full_application_triggered: false,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('POST /api/loi insert failed:', error)
    return NextResponse.json(
      { error: 'Failed to create LOI submission' },
      { status: 500 }
    )
  }

  return NextResponse.json({ submission: data }, { status: 201 })
}
