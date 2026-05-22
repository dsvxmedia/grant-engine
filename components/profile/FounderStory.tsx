'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { FounderProfile } from './types'

export function FounderStory() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [originStory, setOriginStory] = useState('')
  const [communityTies, setCommunityTies] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/profile/founder')
        if (!res.ok) throw new Error('Failed to load founder profile')
        const { profile } = (await res.json()) as { profile: FounderProfile | null }
        if (!active) return
        setOwnerName(profile?.owner_name ?? '')
        setOriginStory(profile?.origin_story ?? '')
        setCommunityTies(profile?.personal_community_ties ?? '')
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile/founder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: ownerName.trim() || undefined,
          origin_story: originStory.trim() || undefined,
          personal_community_ties: communityTies.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save')
      }
      toast.success('Founder profile saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="owner-name">Owner Name</Label>
          <Input
            id="owner-name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="origin-story">Origin Story</Label>
          <Textarea
            id="origin-story"
            value={originStory}
            onChange={(e) => setOriginStory(e.target.value)}
            rows={5}
            placeholder="How and why this began..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="community-ties">Personal Community Ties</Label>
          <Textarea
            id="community-ties"
            value={communityTies}
            onChange={(e) => setCommunityTies(e.target.value)}
            rows={4}
            placeholder="Your connection to the communities you serve..."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
