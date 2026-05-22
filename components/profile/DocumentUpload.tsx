'use client'

import { useRef, useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BusinessEntity } from './types'

const DOCUMENT_TYPES = [
  { value: 'financials', label: 'Financials' },
  { value: 'team_bio', label: 'Team Bio' },
  { value: 'letter_of_support', label: 'Letter of Support' },
  { value: 'tax_form_990', label: 'Tax Form 990' },
  { value: 'other', label: 'Other' },
] as const

type DocumentUploadProps = {
  entities: BusinessEntity[]
}

function fileName(url: string): string {
  try {
    const path = new URL(url).pathname
    return decodeURIComponent(path.split('/').pop() || url)
  } catch {
    return url
  }
}

export function DocumentUpload({ entities }: DocumentUploadProps) {
  const [entityId, setEntityId] = useState('')
  const [documentType, setDocumentType] = useState<string>('financials')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedEntity = entities.find((e) => e.id === entityId) ?? null
  const documents = selectedEntity?.uploaded_documents ?? []

  async function handleUpload() {
    if (!entityId) {
      toast.error('Select an entity')
      return
    }
    if (!file) {
      toast.error('Choose a file to upload')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityId', entityId)
      formData.append('documentType', documentType)

      const res = await fetch('/api/profile/documents', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Upload failed')
      }
      toast.success('Document uploaded')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Upload Document
          </span>
          <Separator />
          <div className="flex flex-col gap-1.5">
            <Label>Entity</Label>
            <Select
              value={entityId}
              onValueChange={(v) => setEntityId(v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(v) => setDocumentType(v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document-file">File</Label>
            <Input
              id="document-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={uploading || entities.length === 0}
            >
              <Upload />
              {uploading ? 'Uploading' : 'Upload'}
            </Button>
          </div>
          {entities.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add a business entity first before uploading documents.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedEntity && (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Documents for {selectedEntity.name}
            </span>
            <Separator />
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No documents uploaded for this entity yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {documents.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate">{fileName(url)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
