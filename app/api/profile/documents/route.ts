import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  uploadDocument,
  ALLOWED_DOCUMENT_TYPES,
  type AllowedDocumentType,
} from '@/lib/profile/documents'

function isFileLike(value: unknown): value is File {
  return (
    value instanceof Blob &&
    typeof (value as File).name === 'string' &&
    (value as File).name.length > 0
  )
}

// POST /api/profile/documents — upload a document to Vercel Blob and append its
// URL to the owning entity's uploaded_documents array.
export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const entityId = formData.get('entityId')
  const documentType = formData.get('documentType')

  // Duck-type rather than `instanceof File`: across runtimes (undici vs the
  // test environment's global) the File constructor identity can differ, so we
  // check for the Blob-with-name shape that uploadDocument actually needs.
  if (!isFileLike(file)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (typeof entityId !== 'string' || entityId.length === 0) {
    return NextResponse.json({ error: 'entityId is required' }, { status: 400 })
  }
  if (
    typeof documentType !== 'string' ||
    !ALLOWED_DOCUMENT_TYPES.includes(documentType as AllowedDocumentType)
  ) {
    return NextResponse.json(
      {
        error: `documentType must be one of: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()
  const { data: entity, error: fetchError } = await supabase
    .from('business_entities')
    .select('id, uploaded_documents')
    .eq('id', entityId)
    .single()

  if (fetchError || !entity) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  let document
  try {
    document = await uploadDocument(
      file,
      entityId,
      documentType as AllowedDocumentType
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // No array-append in the JS client: read the current array, push, write back.
  const current: string[] =
    (entity as { uploaded_documents?: string[] | null }).uploaded_documents ??
    []
  const { error: updateError } = await (
    supabase.from('business_entities') as any
  )
    .update({ uploaded_documents: [...current, document.url] })
    .eq('id', entityId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ document }, { status: 201 })
}
