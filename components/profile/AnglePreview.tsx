'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type AnglePreviewProps = {
  entityId: string
  angles: string[]
}

export function AnglePreview({ entityId, angles }: AnglePreviewProps) {
  const [current, setCurrent] = useState<string[]>(angles)
  const [loading, setLoading] = useState(false)

  async function regenerate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/profile/entities/${entityId}/angles`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to regenerate angles')
      const { angles: next } = await res.json()
      setCurrent(Array.isArray(next) ? next : [])
      toast.success('Angles regenerated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Pitch Angles
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={regenerate}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : undefined} />
          {loading ? 'Regenerating' : 'Regenerate'}
        </Button>
      </div>
      {current.length === 0 ? (
        <p className="text-xs text-muted-foreground">No angles generated yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {current.map((angle, i) => (
            <li
              key={i}
              className="rounded-md bg-muted px-2.5 py-1.5 text-xs leading-snug"
            >
              {angle}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
