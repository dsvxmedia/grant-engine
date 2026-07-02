'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle, Calendar } from 'lucide-react'
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
import { toast } from 'sonner'
import { formatDeadline, isUrgent, cn } from '@/lib/utils'

const QA_LABELS: Record<string, string> = {
  narrative: 'Narrative',
  clarity: 'Clarity',
  compliance: 'Compliance',
}

interface ApplicationReviewFooterProps {
  applicationId: string
  status: string
  grantTitle?: string | null
  deadline?: string | null
  qaScores?: Record<string, number> | null
}

const TERMINAL = new Set(['approved', 'rejected', 'archived'])

export function ApplicationReviewFooter({
  applicationId,
  status,
  grantTitle,
  deadline,
  qaScores,
}: ApplicationReviewFooterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)
  const [reviseNotes, setReviseNotes] = useState('')

  const busy = isPending || actionLoading
  const done = TERMINAL.has(status)

  const deadlineDate = deadline ? new Date(deadline) : null
  const urgent = deadlineDate ? isUrgent(deadlineDate) : false

  // QA dims that scored below the 7.0 pass threshold
  const failedQa = qaScores
    ? Object.entries(qaScores).filter(([, score]) => score < 7.0)
    : []

  async function handleApprove() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        toast.error('Failed to approve application')
        return
      }
      toast.success('Application approved and moved to pipeline')
      startTransition(() => router.push('/review'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRevise() {
    if (!reviseNotes.trim()) return
    setActionLoading(true)
    setReviseOpen(false)
    try {
      const res = await fetch(`/api/applications/${applicationId}/revise`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes: reviseNotes }),
      })
      if (!res.ok) {
        toast.error('Failed to request revision')
        return
      }
      toast.success('Revision queued — writing agent will re-draft')
      setReviseNotes('')
      startTransition(() => router.push('/review'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    setActionLoading(true)
    setRejectOpen(false)
    try {
      const res = await fetch(`/api/applications/${applicationId}/reject`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        toast.error('Failed to reject application')
        return
      }
      toast.success('Application rejected')
      startTransition(() => router.push('/review'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="shrink-0 border-t border-border bg-background">

        {/* QA warning strip — only when scores exist and any failed */}
        {failedQa.length > 0 && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="font-semibold">QA gate not cleared —</span>
            <span>
              {failedQa
                .map(([key, score]) => `${QA_LABELS[key] ?? key} ${score.toFixed(1)}`)
                .join(' · ')}
            </span>
            <span className="ml-1 text-amber-600">
              (threshold 7.0 — consider requesting a revision)
            </span>
          </div>
        )}

        {/* Main action row */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">

          {/* Left — reject */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
            disabled={busy || done}
            onClick={() => setRejectOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>

          {/* Center — grant context + revision */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            {done ? (
              <span className="text-sm text-muted-foreground">
                This application is <span className="font-medium capitalize">{status}</span>
              </span>
            ) : (
              <>
                {/* Grant name + deadline */}
                <div className="flex items-center gap-2 min-w-0">
                  {grantTitle && (
                    <span className="truncate text-xs font-medium text-foreground max-w-56">
                      {grantTitle}
                    </span>
                  )}
                  {deadlineDate && (
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                        urgent
                          ? 'bg-red-50 text-red-600'
                          : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDeadline(deadlineDate)}
                    </span>
                  )}
                </div>

                {/* Revision CTA */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={() => {
                    setReviseNotes('')
                    setReviseOpen(true)
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                  Request revision
                </Button>
              </>
            )}
          </div>

          {/* Right — approve */}
          <Button
            size="sm"
            className="shrink-0 bg-green-600 text-white hover:bg-green-700 gap-1.5"
            disabled={busy || done}
            onClick={handleApprove}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Application
          </Button>
        </div>
      </div>

      {/* Reject confirmation */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reject this application?</DialogTitle>
            <DialogDescription>
              {grantTitle
                ? `"${grantTitle}" will be marked rejected.`
                : 'This application will be marked rejected.'}{' '}
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" disabled={busy} onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision notes */}
      <Dialog
        open={reviseOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReviseOpen(false)
            setReviseNotes('')
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              Describe what needs to change. The writing agent will use these notes in its next pass.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reviseNotes}
            onChange={(e) => setReviseNotes(e.target.value)}
            placeholder="e.g. Strengthen the impact section and cut the budget request by 10%…"
            className="min-h-28"
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={busy || !reviseNotes.trim()}
              onClick={handleRevise}
            >
              Send for revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
