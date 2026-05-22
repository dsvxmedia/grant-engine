'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  submissionId: string
  grantMatchId: string | null
}

export function VideoActions({ submissionId, grantMatchId }: Props) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [regenerateNotes, setRegenerateNotes] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setApproving(true)
    setError(null)
    try {
      const res = await fetch(`/api/video/${submissionId}/approve`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to approve')
      router.push('/video')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
      setApproving(false)
    }
  }

  async function handleRegenerate() {
    if (!grantMatchId) return
    setRegenerating(true)
    setError(null)
    try {
      // Reject (reset) the current submission
      await fetch(`/api/video/${submissionId}/reject`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes: regenerateNotes }),
      })
      // Trigger new pipeline run with same grant_match_id
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ grant_match_id: grantMatchId }),
      })
      if (!res.ok) throw new Error('Failed to start regeneration')
      router.push('/video')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed')
      setRegenerating(false)
      setShowRegenerateDialog(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-red-600 rounded-md bg-red-50 px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={approving}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {approving ? 'Approving…' : 'Approve'}
        </button>

        <button
          onClick={() => setShowRegenerateDialog(true)}
          disabled={approving || !grantMatchId}
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Regenerate
        </button>

        <Link
          href="/video"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </Link>
      </div>

      {showRegenerateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="text-base font-semibold mb-1">Regenerate Video</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The current submission will be rejected and a new pipeline run will start.
            </p>
            <label className="block text-sm font-medium mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={regenerateNotes}
              onChange={(e) => setRegenerateNotes(e.target.value)}
              placeholder="Describe what to change in the next version…"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRegenerateDialog(false)}
                disabled={regenerating}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {regenerating ? 'Starting…' : 'Confirm Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
