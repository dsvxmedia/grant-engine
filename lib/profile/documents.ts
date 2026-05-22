import { put } from '@vercel/blob'
import { env } from '@/lib/env'

export type AllowedDocumentType =
  | 'financials'
  | 'team_bio'
  | 'letter_of_support'
  | 'tax_form_990'
  | 'other'

export const ALLOWED_DOCUMENT_TYPES: readonly AllowedDocumentType[] = [
  'financials',
  'team_bio',
  'letter_of_support',
  'tax_form_990',
  'other',
]

export type UploadedDocument = {
  url: string
  filename: string
  contentType: string
  size: number
  documentType: AllowedDocumentType
  entityId: string
  uploadedAt: string
}

const MAX_FILE_BYTES = 25 * 1024 * 1024

export async function uploadDocument(
  file: File,
  entityId: string,
  documentType: AllowedDocumentType
): Promise<UploadedDocument> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File too large: max 25MB')
  }

  const pathname = `entities/${entityId}/docs/${documentType}/${Date.now()}-${file.name}`

  const result = await put(pathname, file, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
  })

  return {
    url: result.url,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    documentType,
    entityId,
    uploadedAt: new Date().toISOString(),
  }
}
