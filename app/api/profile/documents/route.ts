import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
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

  // Atomic array append via Postgres RPC avoids the lost-update race that a
  // read-modify-write would have under concurrent uploads. Cast because the
  // placeholder database.types (generated without a live Supabase) does not
  // include this function in its Functions map.
  const { error: rpcError } = await (supabase.rpc as any)(
    'append_entity_document',
    {
      entity_id: entityId,
      doc_url: document.url,
    }
  )
  if (rpcError) {
    // clean up the orphaned blob since DB update failed
    await del(document.url, { token: env.BLOB_READ_WRITE_TOKEN })
    return NextResponse.json(
      { error: 'Failed to save document URL' },
      { status: 500 }
    )
  }

  return NextResponse.json({ document }, { status: 201 })
}
