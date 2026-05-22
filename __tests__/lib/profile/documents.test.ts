import { describe, it, expect, vi, beforeEach } from 'vitest'
import { put } from '@vercel/blob'

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}))
vi.mock('@/lib/env', () => ({ env: { BLOB_READ_WRITE_TOKEN: 'test-token' } }))

const mockedPut = vi.mocked(put)

beforeEach(() => {
  vi.clearAllMocks()
})

function mockPutResult(url: string) {
  return { url, pathname: 'p', contentType: 'application/pdf' } as any
}

describe('uploadDocument', () => {
  it('returns UploadedDocument with correct shape', async () => {
    mockedPut.mockResolvedValue(mockPutResult('https://blob/x.pdf'))
    const { uploadDocument } = await import('@/lib/profile/documents')
    const file = new File(['content'], 'test.pdf', {
      type: 'application/pdf',
    })

    const result = await uploadDocument(file, 'entity-1', 'financials')

    expect(result.url).toBe('https://blob/x.pdf')
    expect(result.filename).toBe('test.pdf')
    expect(result.contentType).toBe('application/pdf')
    expect(result.size).toBe(file.size)
    expect(result.documentType).toBe('financials')
    expect(result.entityId).toBe('entity-1')
    expect(typeof result.uploadedAt).toBe('string')
    expect(new Date(result.uploadedAt).toString()).not.toBe('Invalid Date')
  })

  it('uses the correct path format', async () => {
    mockedPut.mockResolvedValue(mockPutResult('https://blob/x.pdf'))
    const { uploadDocument } = await import('@/lib/profile/documents')
    const file = new File(['content'], 'report.pdf', {
      type: 'application/pdf',
    })

    await uploadDocument(file, 'entity-42', 'tax_form_990')

    const pathname = mockedPut.mock.calls[0][0]
    expect(pathname).toMatch(
      /^entities\/entity-42\/docs\/tax_form_990\/\d+-report\.pdf$/
    )
  })

  it('throws on files > 25MB', async () => {
    const { uploadDocument } = await import('@/lib/profile/documents')
    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024 })

    await expect(
      uploadDocument(big, 'entity-1', 'other')
    ).rejects.toThrow('File too large: max 25MB')
    expect(mockedPut).not.toHaveBeenCalled()
  })

  it("passes access: 'public' to put", async () => {
    mockedPut.mockResolvedValue(mockPutResult('https://blob/x.pdf'))
    const { uploadDocument } = await import('@/lib/profile/documents')
    const file = new File(['content'], 'test.pdf', {
      type: 'application/pdf',
    })

    await uploadDocument(file, 'entity-1', 'team_bio')

    expect(mockedPut.mock.calls[0][2]).toMatchObject({ access: 'public' })
  })

  it('passes BLOB_READ_WRITE_TOKEN to put', async () => {
    mockedPut.mockResolvedValue(mockPutResult('https://blob/x.pdf'))
    const { uploadDocument } = await import('@/lib/profile/documents')
    const file = new File(['content'], 'test.pdf', {
      type: 'application/pdf',
    })

    await uploadDocument(file, 'entity-1', 'letter_of_support')

    expect(mockedPut.mock.calls[0][2]).toMatchObject({ token: 'test-token' })
  })
})
