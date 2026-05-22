import { put } from '@vercel/blob'
import { createServiceClient } from '@/lib/supabase/server'
import type { UniquenessOutput } from '@/lib/writing/types'

export type ExportResult = {
  pdfUrl: string    // actually a .txt Blob URL — named "pdf" for DB compatibility
  docxUrl: string   // also a .txt Blob URL
}

/**
 * Exports the final application as plain-text files uploaded to Vercel Blob.
 * Stores the resulting URLs in grant_applications.
 *
 * Error handling: if either Blob upload fails, logs and returns empty strings — never throws.
 */
export async function exportApplication(
  applicationId: string,
  final: UniquenessOutput
): Promise<ExportResult> {
  // Build full text: each section as `## Section Name\n\n{content}\n\n`
  const fullText = final.sections
    .map((section) => `## ${section.name}\n\n${section.content}\n\n`)
    .join('')

  let pdfUrl = ''
  let docxUrl = ''

  try {
    const [pdfBlob, docxBlob] = await Promise.all([
      put(`lois/${applicationId}/draft.pdf.txt`, fullText, {
        access: 'public',
        allowOverwrite: true,
        contentType: 'text/plain',
      }),
      put(`lois/${applicationId}/draft.docx.txt`, fullText, {
        access: 'public',
        allowOverwrite: true,
        contentType: 'text/plain',
      }),
    ])

    pdfUrl = pdfBlob.url
    docxUrl = docxBlob.url
  } catch (err) {
    console.error(`exportApplication: Blob upload failed for application ${applicationId}:`, err)
    return { pdfUrl: '', docxUrl: '' }
  }

  try {
    const supabase = await createServiceClient()
    await (supabase as any)
      .from('grant_applications')
      .update({ draft_pdf_url: pdfUrl, draft_docx_url: docxUrl })
      .eq('id', applicationId)
      .single()
  } catch (err) {
    console.error(`exportApplication: DB update failed for application ${applicationId}:`, err)
  }

  return { pdfUrl, docxUrl }
}
