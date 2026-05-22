'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { EntityForm } from './EntityForm'
import { AnglePreview } from './AnglePreview'
import { ELIGIBILITY_FLAGS, type BusinessEntity } from './types'

function toAngleStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((a) =>
      typeof a === 'string' ? a : typeof a === 'object' && a !== null
        ? String((a as { angle?: unknown; text?: unknown }).angle ??
            (a as { text?: unknown }).text ??
            JSON.stringify(a))
        : String(a)
    )
    .filter(Boolean)
}

type EntityListProps = {
  entities: BusinessEntity[]
  loading: boolean
  onReload: () => void
}

export function EntityList({ entities, loading, onReload }: EntityListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessEntity | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(entity: BusinessEntity) {
    setEditing(entity)
    setFormOpen(true)
  }

  async function handleDelete(entity: BusinessEntity) {
    if (!window.confirm(`Delete "${entity.name}"? This cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/profile/entities/${entity.id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete entity')
      }
      toast.success('Entity deleted')
      void onReload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entities.length} {entities.length === 1 ? 'entity' : 'entities'}
        </p>
        <Button onClick={openCreate}>
          <Plus />
          Add Entity
        </Button>
      </div>

      {entities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No entities yet. Add your first business entity to begin matching
            grants.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {entities.map((entity) => {
            const location = [entity.city, entity.state]
              .filter(Boolean)
              .join(', ')
            const flags = ELIGIBILITY_FLAGS.filter(
              ({ key }) => entity[key] === true
            )
            const angles = toAngleStrings(entity.pitch_angles_generated)
            return (
              <Card key={entity.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {entity.name}
                    <Badge variant="secondary">
                      {entity.type.replace(/_/g, ' ')}
                    </Badge>
                  </CardTitle>
                  {(location || entity.industry) && (
                    <p className="text-xs text-muted-foreground">
                      {[entity.industry, location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {entity.mission && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {entity.mission}
                    </p>
                  )}
                  {flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {flags.map(({ key, label }) => (
                        <Badge key={key} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {angles.length > 0 && (
                    <>
                      <Separator />
                      <AnglePreview entityId={entity.id} angles={angles} />
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(entity)}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entity)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {formOpen && (
        <EntityForm
          key={editing?.id ?? 'create'}
          open={formOpen}
          onOpenChange={setFormOpen}
          entity={editing}
          onSuccess={onReload}
        />
      )}
    </div>
  )
}
