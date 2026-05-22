'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { formatCurrency } from '@/lib/utils'

export type LoiGrant = {
  id: string
  title: string
  funder_name: string
  award_min: number | null
  award_max: number | null
  loi_deadline: string | null
}

export type LoiEntity = {
  id: string
  name: string
}

export type LoiSubmission = {
  id: string
  grant_id: string
  entity_id: string
  loi_content: string | null
  loi_pdf_url: string | null
  submitted_at: string | null
  status: string
  full_application_triggered: boolean
  created_at: string
  updated_at: string
  grants: LoiGrant | null
  business_entities: LoiEntity | null
}

const PREVIEW_LENGTH = 150

export function LoiCard({ submission }: { submission: LoiSubmission }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(submission.loi_content ?? '')
  const [savePending, setSavePending] = useState(false)

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const content = submission.loi_content ?? ''
  const preview = content.length > PREVIEW_LENGTH ? content.slice(0, PREVIEW_LENGTH) + '…' : content

  const grant = submission.grants
  const entity = submission.business_entities

  const awardRange =
    grant?.award_min != null && grant?.award_max != null
      ? `${formatCurrency(grant.award_min)} – ${formatCurrency(grant.award_max)}`
      : 'Amount not specified'

  async function handleSave() {
    setSavePending(true)
    try {
      const res = await fetch(`/api/loi/${submission.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loi_content: editContent }),
      })
      if (!res.ok) return
      setEditing(false)
      startTransition(() => router.refresh())
    } finally {
      setSavePending(false)
    }
  }

  async function handleSubmit() {
    setSubmitDialogOpen(false)
    startTransition(async () => {
      await fetch(`/api/loi/${submission.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })
      router.refresh()
    })
  }

  async function handleDelete() {
    setDeleteDialogOpen(false)
    startTransition(async () => {
      await fetch(`/api/loi/${submission.id}`, { method: 'DELETE' })
      router.refresh()
    })
  }

  const busy = isPending || savePending

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>{grant?.title ?? 'Unknown Grant'}</CardTitle>
            <CardDescription>{grant?.funder_name ?? '—'}</CardDescription>
          </div>
          <StatusBadge status={submission.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {entity && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {entity.name}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{awardRange}</span>
          {grant?.loi_deadline ? (
            <DeadlineChip deadline={new Date(grant.loi_deadline)} />
          ) : (
            <span className="text-xs text-muted-foreground">No deadline</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-40 font-mono text-xs"
              disabled={busy}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={busy}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditContent(submission.loi_content ?? '')
                  setEditing(false)
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
              {expanded ? content : preview}
            </p>
            {content.length > PREVIEW_LENGTH && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="self-start text-xs text-primary underline-offset-2 hover:underline"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              Edit
            </Button>
          </div>
        )}
      </CardContent>

      {submission.status === 'draft' && (
        <CardFooter className="gap-2">
          <Button
            size="sm"
            onClick={() => setSubmitDialogOpen(true)}
            disabled={busy}
          >
            Submit LOI
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={busy}
          >
            Delete
          </Button>
        </CardFooter>
      )}

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Submit this LOI?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this LOI? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleSubmit} disabled={busy}>
              Submit LOI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this LOI draft?</DialogTitle>
            <DialogDescription>
              This will permanently delete the draft. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
