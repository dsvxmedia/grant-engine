'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { ApplicationRecord } from '@/components/pipeline/types'

type DraftSection = {
  heading: string
  text: string
}

function parseSections(draftContent: Record<string, unknown> | null): DraftSection[] {
  if (!draftContent) return []
  const sections = draftContent['sections']
  if (!Array.isArray(sections)) return []
  return sections
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      heading: (s['heading'] ?? s['name'] ?? '') as string,
      text: (s['text'] ?? s['content'] ?? '') as string,
    }))
    .filter((s) => s.heading && s.text && s.text !== '---')
}

function SectionEditor({
  section,
  index,
  applicationId,
  onSaved,
}: {
  section: DraftSection
  index: number
  applicationId: string
  onSaved: (index: number, newText: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(section.text)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sectionIndex: index, sectionText: editText }),
      })
      if (!res.ok) {
        toast.error('Failed to save section')
        return
      }
      onSaved(index, editText)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-40 font-mono text-xs"
            disabled={saving}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditText(section.text)
                setEditing(false)
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed [&>p]:text-muted-foreground [&>ul]:text-muted-foreground [&>ol]:text-muted-foreground [&>blockquote]:text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.text}</ReactMarkdown>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  )
}

interface ApplicationDraftProps {
  application: ApplicationRecord & {
    draft_pdf_url?: string | null
    draft_docx_url?: string | null
  }
}

export function ApplicationDraft({ application }: ApplicationDraftProps) {
  const [sections, setSections] = useState<DraftSection[]>(
    parseSections(application.draft_content)
  )

  const pdfUrl = (application as any).draft_pdf_url as string | null | undefined
  const docxUrl = (application as any).draft_docx_url as string | null | undefined

  function handleSectionSaved(index: number, newText: string) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, text: newText } : s))
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Download row */}
      {(pdfUrl || docxUrl) && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Download:</span>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              PDF
            </a>
          )}
          {docxUrl && (
            <a
              href={docxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              DOCX
            </a>
          )}
        </div>
      )}

      {/* Application sections */}
      {sections.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {sections.map((section, i) => (
            <div key={i} className="py-5 first:pt-0">
              <SectionEditor
                section={section}
                index={i}
                applicationId={application.id}
                onSaved={handleSectionSaved}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No draft content available yet.
        </p>
      )}
    </div>
  )
}
