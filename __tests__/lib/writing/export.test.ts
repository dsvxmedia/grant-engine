import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))

import { put } from '@vercel/blob'
import { createServiceClient } from '@/lib/supabase/server'

const mockedPut = vi.mocked(put)
const mockedCreateServiceClient = vi.mocked(createServiceClient)

function makeUniquenessOutput(overrides = {}) {
  return {
    sections: [
      { name: 'Executive Summary', content: 'We are a mission-driven org.', wordCount: 7 },
      { name: 'Needs Statement', content: 'The community needs support.', wordCount: 5 },
    ],
    rawText: 'We are a mission-driven org. The community needs support.',
    changesLog: ['Humanized tone.'],
    selectedAngles: ['minority-owned'],
    selectedFramework: 'theory-of-change',
    researchNotes: '{"funderBackground":"Acme Foundation"}',
    humanizerApplied: true,
    uniquenessScore: 0.95,
    needsRevision: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('exportApplication', () => {
  it('builds text from sections and uploads to blob', async () => {
    const pdfBlob = { url: 'https://blob.vercel-storage.com/lois/app-1/draft.pdf.txt' }
    const docxBlob = { url: 'https://blob.vercel-storage.com/lois/app-1/draft.docx.txt' }

    mockedPut
      .mockResolvedValueOnce(pdfBlob as any)
      .mockResolvedValueOnce(docxBlob as any)

    const single = vi.fn().mockResolvedValue({ data: { id: 'app-1' }, error: null })
    const eq = vi.fn().mockReturnValue({ single })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { exportApplication } = await import('@/lib/writing/export')
    const final = makeUniquenessOutput()
    await exportApplication('app-1', final)

    expect(mockedPut).toHaveBeenCalledTimes(2)

    const [firstPath, firstContent] = mockedPut.mock.calls[0]
    expect(firstPath).toBe('lois/app-1/draft.pdf.txt')
    expect(firstContent).toContain('## Executive Summary')
    expect(firstContent).toContain('We are a mission-driven org.')
    expect(firstContent).toContain('## Needs Statement')
    expect(firstContent).toContain('The community needs support.')
  })

  it('calls put twice with public access', async () => {
    const pdfBlob = { url: 'https://blob.vercel-storage.com/lois/app-2/draft.pdf.txt' }
    const docxBlob = { url: 'https://blob.vercel-storage.com/lois/app-2/draft.docx.txt' }

    mockedPut
      .mockResolvedValueOnce(pdfBlob as any)
      .mockResolvedValueOnce(docxBlob as any)

    const single = vi.fn().mockResolvedValue({ data: { id: 'app-2' }, error: null })
    const eq = vi.fn().mockReturnValue({ single })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { exportApplication } = await import('@/lib/writing/export')
    await exportApplication('app-2', makeUniquenessOutput())

    expect(mockedPut).toHaveBeenCalledTimes(2)

    const [, , firstOptions] = mockedPut.mock.calls[0]
    expect((firstOptions as any).access).toBe('public')

    const [secondPath, , secondOptions] = mockedPut.mock.calls[1]
    expect(secondPath).toBe('lois/app-2/draft.docx.txt')
    expect((secondOptions as any).access).toBe('public')
  })

  it('updates grant_applications with blob URLs', async () => {
    const pdfBlob = { url: 'https://blob.vercel-storage.com/lois/app-3/draft.pdf.txt' }
    const docxBlob = { url: 'https://blob.vercel-storage.com/lois/app-3/draft.docx.txt' }

    mockedPut
      .mockResolvedValueOnce(pdfBlob as any)
      .mockResolvedValueOnce(docxBlob as any)

    const single = vi.fn().mockResolvedValue({ data: { id: 'app-3' }, error: null })
    const eq = vi.fn().mockReturnValue({ single })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { exportApplication } = await import('@/lib/writing/export')
    const result = await exportApplication('app-3', makeUniquenessOutput())

    expect(from).toHaveBeenCalledWith('grant_applications')
    expect(update).toHaveBeenCalledWith({
      draft_pdf_url: pdfBlob.url,
      draft_docx_url: docxBlob.url,
    })
    expect(eq).toHaveBeenCalledWith('id', 'app-3')
    expect(result.pdfUrl).toBe(pdfBlob.url)
    expect(result.docxUrl).toBe(docxBlob.url)
  })

  it('returns empty strings on blob failure and never throws', async () => {
    mockedPut.mockRejectedValue(new Error('Blob upload failed'))

    const from = vi.fn()
    mockedCreateServiceClient.mockResolvedValue({ from } as any)

    const { exportApplication } = await import('@/lib/writing/export')

    const result = await exportApplication('app-fail', makeUniquenessOutput())

    expect(result.pdfUrl).toBe('')
    expect(result.docxUrl).toBe('')
    // Should not throw
  })
})
