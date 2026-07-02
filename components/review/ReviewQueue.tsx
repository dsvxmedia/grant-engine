'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { formatCurrency } from '@/lib/utils'
import type { ApplicationRecord } from '@/components/pipeline/types'

interface ReviewQueueProps {
  applications: ApplicationRecord[]
}

type DialogMode = 'reject' | 'revise' | null

interface ActiveDialog {
  mode: DialogMode
  appId: string
}

function QaDots({ qaScores }: { qaScores: Record<string, number> | null }) {
  const dims = [
    { key: 'narrative', label: 'Narrative' },
    { key: 'clarity',   label: 'Clarity'   },
    { key: 'compliance', label: 'Compliance' },
  ]

  return (
    <div className="flex items-center gap-2">
      {dims.map(({ key, label }) => {
        const score = qaScores?.[key]
        const passed = score != null ? score >= 7.0 : null
        return (
          <div key={key} className="flex items-center gap-1">
            <span
              className={`size-2 rounded-full ${
                passed === null
                  ? 'bg-slate-300'
                  : passed
                    ? 'bg-green-500'
                    : 'bg-red-500'
              }`}
              title={`${label}: ${score ?? 'N/A'}`}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ReviewQueue({ applications }: ReviewQueueProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null)
  const [reviseNotes, setReviseNotes] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setActionLoading(id)
    try {
      await fetch(`/api/applications/${id}/approve`, { method: 'PATCH' })
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    setActiveDialog(null)
    try {
      await fetch(`/api/applications/${id}/reject`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRevise(id: string) {
    if (!reviseNotes.trim()) return
    setActionLoading(id)
    setActiveDialog(null)
    try {
      await fetch(`/api/applications/${id}/revise`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes: reviseNotes }),
      })
      setReviseNotes('')
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  const busy = isPending

  return (
    <>
      <div className="flex flex-col gap-3">
        {applications.map((app) => {
          const grant = app.grants
          const entity = app.business_entities
          const deadline = grant?.deadline ? new Date(grant.deadline) : null
          const awardRange =
            grant?.award_min != null && grant?.award_max != null
              ? `${formatCurrency(grant.award_min)} – ${formatCurrency(grant.award_max)}`
              : grant?.award_max != null
                ? `Up to ${formatCurrency(grant.award_max)}`
                : null
          const isLoading = actionLoading === app.id

          return (
            <div
              key={app.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/review/${app.id}`}
                    className="font-medium leading-snug hover:underline underline-offset-2"
                  >
                    {grant?.title ?? 'Untitled Grant'}
                  </Link>
                  {grant?.funder_name && (
                    <span className="text-xs text-muted-foreground">
                      {grant.funder_name}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {app.fit_score != null && (
                    <ScoreBadge score={app.fit_score} />
                  )}
                  {deadline && <DeadlineChip deadline={deadline} />}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3">
                {entity && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {entity.name}
                  </span>
                )}
                {awardRange && (
                  <span className="text-xs text-muted-foreground">
                    {awardRange}
                  </span>
                )}
                <QaDots qaScores={app.qa_scores} />
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                  disabled={busy || isLoading}
                  onClick={() => handleApprove(app.id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || isLoading}
                  onClick={() => {
                    setReviseNotes('')
                    setActiveDialog({ mode: 'revise', appId: app.id })
                  }}
                >
                  Request Revision
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy || isLoading}
                  onClick={() => setActiveDialog({ mode: 'reject', appId: app.id })}
                >
                  Reject
                </Button>
              </div>
            </div>
          )
        })}

        {applications.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title="No applications pending review"
            description="Applications that have completed the 5-pass writing pipeline and passed QA will appear here for your approval."
          />
        )}
      </div>

      {/* Reject confirmation dialog */}
      <Dialog
        open={activeDialog?.mode === 'reject'}
        onOpenChange={(open) => { if (!open) setActiveDialog(null) }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reject this application?</DialogTitle>
            <DialogDescription>
              This will mark the application as rejected. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (activeDialog?.appId) handleReject(activeDialog.appId)
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision notes dialog */}
      <Dialog
        open={activeDialog?.mode === 'revise'}
        onOpenChange={(open) => { if (!open) { setActiveDialog(null); setReviseNotes('') } }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              Describe what needs to be changed. The writing agent will use these notes in its next pass.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reviseNotes}
            onChange={(e) => setReviseNotes(e.target.value)}
            placeholder="e.g. Strengthen the impact section and reduce budget by 10%..."
            className="min-h-28"
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={busy || !reviseNotes.trim()}
              onClick={() => {
                if (activeDialog?.appId) handleRevise(activeDialog.appId)
              }}
            >
              Send for revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
