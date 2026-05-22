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

  const loadEntities = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/entities')
      if (!res.ok) return
      const { entities } = await res.json()
      setEntities(Array.isArray(entities) ? entities : [])
    } catch {
      // Tab-level entity list is best-effort; EntityList surfaces its own errors.
    }
  }, [])

  useEffect(() => {
    let active = true
    async function initialLoad() {
      try {
        const res = await fetch('/api/profile/entities')
        if (!res.ok) return
        const { entities } = await res.json()
        if (active) setEntities(Array.isArray(entities) ? entities : [])
      } catch {
        // Best-effort; EntityList surfaces its own errors.
      }
    }
    void initialLoad()
    return () => {
      active = false
    }
  }, [])

  return (
    <Tabs defaultValue="entities" className="gap-4">
      <TabsList>
        <TabsTrigger value="entities">Entities</TabsTrigger>
        <TabsTrigger value="founder">Founder Story</TabsTrigger>
        <TabsTrigger value="impact">Impact</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="entities">
        <EntityList onEntitiesChange={loadEntities} />
      </TabsContent>
      <TabsContent value="founder">
        <FounderStory />
      </TabsContent>
      <TabsContent value="impact">
        <ImpactMetrics entities={entities} />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentUpload entities={entities} />
      </TabsContent>
    </Tabs>
  )
}
