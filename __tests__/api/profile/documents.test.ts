import { describe, it, expect, vi, beforeEach } from 'vitest'
import { del } from '@vercel/blob'
import { createServiceClient } from '@/lib/supabase/server'
import { uploadDocument } from '@/lib/profile/documents'

vi.mock('@vercel/blob', () => ({ put: vi.fn(), del: vi.fn() }))
vi.mock('@/lib/env', () => ({ env: { BLOB_READ_WRITE_TOKEN: 'test-token' } }))
vi.mock('@/lib/supabase/server', () => ({ createServiceClient: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/profile/documents', () => ({
  uploadDocument: vi.fn(),
  ALLOWED_DOCUMENT_TYPES: [
    'financials',
    'team_bio',
    'letter_of_support',
    'tax_form_990',
    'other',
  ],
}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedUploadDocument = vi.mocked(uploadDocument)
const mockedDel = vi.mocked(del)

beforeEach(() => {
  vi.clearAllMocks()
})

// jsdom's global File is not accepted by undici's FormData.append (webidl
// File check fails), so we hand the route a request whose formData() resolves a
// Map-backed FormData-like. The route only calls .get(), which Map provides.
function formRequest(fields: {
  file?: Blob
  entityId?: string
  documentType?: string
}) {
  const map = new Map<string, unknown>()
  if (fields.file) map.set('file', fields.file)
  if (fields.entityId !== undefined) map.set('entityId', fields.entityId)
  if (fields.documentType !== undefined)
    map.set('documentType', fields.documentType)
  return {
    formData: async () => ({ get: (key: string) => map.get(key) ?? null }),
  }
}

function mockEntityFound(
  currentDocs: string[] | null = [],
  rpcResult: { error: unknown } = { error: null }
) {
  const single = vi
    .fn()
    .mockResolvedValue({ data: { id: 'e1', uploaded_documents: currentDocs }, error: null })
  const selectEq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq: selectEq })

  const from = vi.fn().mockReturnValue({ select })
  const rpc = vi.fn().mockResolvedValue(rpcResult)
  mockedCreateServiceClient.mockResolvedValue({ from, rpc } as any)
  return { rpc, from }
}

function pdf() {
  return new File(['content'], 'doc.pdf', { type: 'application/pdf' })
}

describe('POST /api/profile/documents', () => {
  it('returns 201 with document on success', async () => {
    const doc = {
      url: 'https://blob/doc.pdf',
      filename: 'doc.pdf',
      contentType: 'application/pdf',
      size: 7,
      documentType: 'financials' as const,
      entityId: 'e1',
      uploadedAt: '2026-05-21T00:00:00.000Z',
    }
    const { rpc } = mockEntityFound([])
    mockedUploadDocument.mockResolvedValue(doc)

    const { POST } = await import('@/app/api/profile/documents/route')
    const res = await POST(
      formRequest({
        file: pdf(),
        entityId: 'e1',
        documentType: 'financials',
      }) as any
    )

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.document).toEqual(doc)
    expect(rpc).toHaveBeenCalledWith('append_entity_document', {
      entity_id: 'e1',
      doc_url: 'https://blob/doc.pdf',
    })
  })

  it('returns 500 and deletes orphaned blob when DB update fails', async () => {
    const doc = {
      url: 'https://blob/doc.pdf',
      filename: 'doc.pdf',
      contentType: 'application/pdf',
      size: 7,
      documentType: 'financials' as const,
      entityId: 'e1',
      uploadedAt: '2026-05-21T00:00:00.000Z',
    }
    mockEntityFound([], { error: 'DB error' })
    mockedUploadDocument.mockResolvedValue(doc)

    const { POST } = await import('@/app/api/profile/documents/route')
    const res = await POST(
      formRequest({
        file: pdf(),
        entityId: 'e1',
        documentType: 'financials',
      }) as any
    )

    expect(res.status).toBe(500)
    expect(mockedDel).toHaveBeenCalledWith(
      'https://blob/doc.pdf',
      expect.anything()
    )
  })

  it('returns 400 when file is missing', async () => {
    const { POST } = await import('@/app/api/profile/documents/route')
    const res = await POST(
      formRequest({ entityId: 'e1', documentType: 'financials' }) as any
    )
    expect(res.status).toBe(400)
    expect(mockedUploadDocument).not.toHaveBeenCalled()
  })

  it('returns 400 when documentType is invalid', async () => {
    const { POST } = await import('@/app/api/profile/documents/route')
    const res = await POST(
      formRequest({
        file: pdf(),
        entityId: 'e1',
        documentType: 'not_a_type',
      }) as any
    )
    expect(res.status).toBe(400)
    expect(mockedUploadDocument).not.toHaveBeenCalled()
  })

  it('returns 404 when entity not found', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { POST } = await import('@/app/api/profile/documents/route')
    const res = await POST(
      formRequest({
        file: pdf(),
        entityId: 'nope',
        documentType: 'financials',
      }) as any
    )
    expect(res.status).toBe(404)
    expect(mockedUploadDocument).not.toHaveBeenCalled()
  })

  it('returns 500 on upload error', async () => {
    mockEntityFound([])
    mockedUploadDocument.mockRejectedValue(new Error('blob exploded'))

    const { POST } = await import('@/app/api/profile/documents/route')
    const res = await POST(
      formRequest({
        file: pdf(),
        entityId: 'e1',
        documentType: 'financials',
      }) as any
    )
    expect(res.status).toBe(500)
  })
})
