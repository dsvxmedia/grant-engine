'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EligibilityAttributes } from './EligibilityAttributes'
import type { BusinessEntity, EligibilityValues } from './types'

const ENTITY_TYPES = [
  'parent',
  'subsidiary',
  'llc',
  'nonprofit',
  'sole_proprietorship',
  'other',
] as const

type EntityFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: BusinessEntity | null
  onSuccess: () => void
}

function eligibilityFrom(entity?: BusinessEntity | null): EligibilityValues {
  return {
    is_african_american_owned: entity?.is_african_american_owned ?? false,
    is_minority_owned: entity?.is_minority_owned ?? false,
    is_underserved_community_tied: entity?.is_underserved_community_tied ?? false,
    is_tech_company: entity?.is_tech_company ?? false,
    is_social_enterprise: entity?.is_social_enterprise ?? false,
    is_community_serving: entity?.is_community_serving ?? false,
  }
}

export function EntityForm({
  open,
  onOpenChange,
  entity,
  onSuccess,
}: EntityFormProps) {
  const isEdit = Boolean(entity)
  const [name, setName] = useState(entity?.name ?? '')
  const [type, setType] = useState<string>(entity?.type ?? 'llc')
  const [industry, setIndustry] = useState(entity?.industry ?? '')
  const [state, setState] = useState(entity?.state ?? '')
  const [city, setCity] = useState(entity?.city ?? '')
  const [mission, setMission] = useState(entity?.mission ?? '')
  const [focusArea, setFocusArea] = useState(entity?.focus_area ?? '')
  const [eligibility, setEligibility] = useState<EligibilityValues>(
    eligibilityFrom(entity)
  )
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (name.trim().length === 0) {
      toast.error('Name is required')
      return
    }
    setSubmitting(true)
    const payload = {
      name: name.trim(),
      type,
      industry: industry.trim() || undefined,
      state: state.trim() || undefined,
      city: city.trim() || undefined,
      mission: mission.trim() || undefined,
      focus_area: focusArea.trim() || undefined,
      ...eligibility,
    }
    try {
      const res = await fetch(
        isEdit
          ? `/api/profile/entities/${entity!.id}`
          : '/api/profile/entities',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save entity')
      }
      toast.success(isEdit ? 'Entity updated' : 'Entity created')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save entity')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Entity' : 'Add Entity'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entity-name">Name</Label>
            <Input
              id="entity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entity-industry">Industry</Label>
              <Input
                id="entity-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entity-focus">Focus Area</Label>
              <Input
                id="entity-focus"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entity-state">State</Label>
              <Input
                id="entity-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entity-city">City</Label>
              <Input
                id="entity-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entity-mission">Mission</Label>
            <Textarea
              id="entity-mission"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
            />
          </div>
          <EligibilityAttributes
            values={eligibility}
            onChange={setEligibility}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving' : isEdit ? 'Save Changes' : 'Create Entity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
