'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { EntityList } from './EntityList'
import { FounderStory } from './FounderStory'
import { ImpactMetrics } from './ImpactMetrics'
import { DocumentUpload } from './DocumentUpload'
import type { BusinessEntity } from './types'

export function ProfileTabs() {
  const [entities, setEntities] = useState<BusinessEntity[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/entities')
      if (!res.ok) return
      const data = await res.json() as { entities?: unknown }
      setEntities(Array.isArray(data.entities) ? data.entities as BusinessEntity[] : [])
    } catch {
      // EntityList surfaces its own errors; this shared state is best-effort.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void loadEntities().finally(() => { if (!active) setLoading(false) })
    return () => { active = false }
  }, [loadEntities])

  return (
    <Tabs defaultValue="entities" className="gap-4">
      <TabsList>
        <TabsTrigger value="entities">Entities</TabsTrigger>
        <TabsTrigger value="founder">Founder Story</TabsTrigger>
        <TabsTrigger value="impact">Impact</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="entities">
        <EntityList entities={entities} loading={loading} onReload={loadEntities} />
      </TabsContent>
      <TabsContent value="founder">
        <FounderStory />
      </TabsContent>
      <TabsContent value="impact">
        <ImpactMetrics entities={entities} />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentUpload entities={entities} onUploadSuccess={loadEntities} />
      </TabsContent>
    </Tabs>
  )
}
