'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BusinessEntity, ImpactMetric } from './types'

type ImpactMetricsProps = {
  entities: BusinessEntity[]
}

export function ImpactMetrics({ entities }: ImpactMetricsProps) {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const [entityId, setEntityId] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [period, setPeriod] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/impact-metrics')
      if (!res.ok) throw new Error('Failed to load metrics')
      const { metrics } = await res.json()
      setMetrics(Array.isArray(metrics) ? metrics : [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function initialLoad() {
      try {
        const res = await fetch('/api/profile/impact-metrics')
        if (!res.ok) throw new Error('Failed to load metrics')
        const { metrics } = await res.json()
        if (!active) return
        setMetrics(Array.isArray(metrics) ? metrics : [])
      } catch (err) {
        if (active) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load metrics'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void initialLoad()
    return () => {
      active = false
    }
  }, [])

  async function handleAdd() {
    if (!entityId) {
      toast.error('Select an entity')
      return
    }
    if (name.trim().length === 0) {
      toast.error('Metric name is required')
      return
    }
    const numeric = Number(value)
    if (value.trim().length === 0 || Number.isNaN(numeric)) {
      toast.error('Metric value must be a number')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/profile/impact-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          metric_name: name.trim(),
          metric_value: numeric,
          metric_unit: unit.trim() || undefined,
          time_period: period.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to add metric')
      }
      toast.success('Metric added')
      setName('')
      setValue('')
      setUnit('')
      setPeriod('')
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add metric')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : metrics.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No impact metrics yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Metric</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Geography</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{m.metric_name}</td>
                    <td className="px-4 py-2">
                      {m.metric_value}
                      {m.metric_unit ? ` ${m.metric_unit}` : ''}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {m.time_period ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {m.geography ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Add Metric
          </span>
          <Separator />
          <div className="flex flex-col gap-1.5">
            <Label>Entity</Label>
            <Select
              value={entityId}
              onValueChange={(v) => setEntityId(v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metric-name">Name</Label>
              <Input
                id="metric-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jobs created"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metric-value">Value</Label>
              <Input
                id="metric-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metric-unit">Unit</Label>
              <Input
                id="metric-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="jobs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metric-period">Time Period</Label>
              <Input
                id="metric-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2025"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAdd}
              disabled={adding || entities.length === 0}
            >
              <Plus />
              {adding ? 'Adding' : 'Add Metric'}
            </Button>
          </div>
          {entities.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add a business entity first before recording metrics.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
