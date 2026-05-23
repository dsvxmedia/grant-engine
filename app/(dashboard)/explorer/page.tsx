'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { DeadlineChip } from '@/components/shared/DeadlineChip'
import { GrantDetailSheet, type GrantDetailData } from '@/components/shared/GrantDetailSheet'
import { formatCurrency } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

type GrantRow = {
  id: string
  title: string
  funder_name: string | null
  award_min: number | null
  award_max: number | null
  deadline: string | null
  funder_type: string | null
  source_url: string | null
  application_url: string | null
  description: string | null
  eligibility_tags: string[] | null
  category_tags: string[] | null
  requires_loi: boolean
  coalition_preferred: boolean
  is_new_program: boolean
}

const FUNDER_TYPES = [
  { value: '', label: 'All types' },
  { value: 'federal', label: 'Federal' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'state', label: 'State' },
  { value: 'niche', label: 'Niche' },
]

function FunderTypeChip({ type }: { type: string | null }) {
  const color: Record<string, string> = {
    federal: 'bg-blue-50 text-blue-600',
    foundation: 'bg-purple-50 text-purple-600',
    corporate: 'bg-indigo-50 text-indigo-600',
    state: 'bg-teal-50 text-teal-600',
    niche: 'bg-orange-50 text-orange-600',
  }
  if (!type) return null
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${color[type] ?? 'bg-slate-100 text-slate-500'}`}
    >
      {type}
    </span>
  )
}

export default function ExplorerPage() {
  const [grants, setGrants] = useState<GrantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [funderType, setFunderType] = useState('')
  const [requiresLoi, setRequiresLoi] = useState(false)
  const [isNewProgram, setIsNewProgram] = useState(false)
  const [selectedGrant, setSelectedGrant] = useState<GrantDetailData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchGrants = useCallback(
    async (opts: {
      search: string
      funderType: string
      requiresLoi: boolean
      isNewProgram: boolean
    }) => {
      setLoading(true)
      setError(false)
      try {
        const params = new URLSearchParams()
        if (opts.search) params.set('search', opts.search)
        if (opts.funderType) params.set('funderType', opts.funderType)
        if (opts.requiresLoi) params.set('requiresLoi', 'true')
        if (opts.isNewProgram) params.set('isNewProgram', 'true')
        const res = await fetch(`/api/grants?${params.toString()}`)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        setGrants((json.grants ?? []).slice(0, 100))
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Initial load
  useEffect(() => {
    fetchGrants({ search, funderType, requiresLoi, isNewProgram })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced re-fetch when search changes
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchGrants({ search: value, funderType, requiresLoi, isNewProgram })
    }, 300)
  }

  function openDetail(grant: GrantRow) {
    setSelectedGrant({
      title: grant.title,
      funderName: grant.funder_name,
      funderType: grant.funder_type,
      awardMin: grant.award_min,
      awardMax: grant.award_max,
      deadline: grant.deadline,
      description: grant.description,
      sourceUrl: grant.source_url,
      applicationUrl: grant.application_url,
      eligibilityTags: (grant.eligibility_tags ?? []) as string[],
      categoryTags: (grant.category_tags ?? []) as string[],
      requiresLoi: grant.requires_loi,
      coalitionPreferred: grant.coalition_preferred,
    })
    setSheetOpen(true)
  }

  // Immediate re-fetch on filter changes
  function handleFunderTypeChange(value: string) {
    setFunderType(value)
    fetchGrants({ search, funderType: value, requiresLoi, isNewProgram })
  }

  function handleRequiresLoiChange(checked: boolean) {
    setRequiresLoi(checked)
    fetchGrants({ search, funderType, requiresLoi: checked, isNewProgram })
  }

  function handleIsNewProgramChange(checked: boolean) {
    setIsNewProgram(checked)
    fetchGrants({ search, funderType, requiresLoi, isNewProgram: checked })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Grant Explorer" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search + filters */}
        <div className="flex flex-col gap-3 mb-5">
          <Input
            placeholder="Search by title or funder..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-md"
          />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="funder-type-select">
                Funder type
              </label>
              <select
                id="funder-type-select"
                value={funderType}
                onChange={(e) => handleFunderTypeChange(e.target.value)}
                className="h-7 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {FUNDER_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={requiresLoi}
                onChange={(e) => handleRequiresLoiChange(e.target.checked)}
                className="rounded border-input"
              />
              <span>Requires LOI</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={isNewProgram}
                onChange={(e) => handleIsNewProgramChange(e.target.checked)}
                className="rounded border-input"
              />
              <span>New program</span>
            </label>
          </div>
        </div>

        {/* Status / count row */}
        <p className="text-xs text-muted-foreground mb-3">
          {loading
            ? 'Loading grants…'
            : error
              ? 'Failed to load grants.'
              : `Showing ${grants.length} grant${grants.length !== 1 ? 's' : ''}`}
        </p>

        {/* Table */}
        {!error && (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Funder
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Award range
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Deadline
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : grants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No grants match your filters.
                    </td>
                  </tr>
                ) : (
                  grants.map((grant) => {
                    const deadline = grant.deadline ? new Date(grant.deadline) : null
                    const awardRange =
                      grant.award_min != null && grant.award_max != null
                        ? `${formatCurrency(grant.award_min)} – ${formatCurrency(grant.award_max)}`
                        : grant.award_max != null
                          ? `Up to ${formatCurrency(grant.award_max)}`
                          : null
                    const applyUrl = grant.application_url ?? grant.source_url

                    return (
                      <tr key={grant.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          {grant.source_url ? (
                            <a
                              href={grant.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground hover:underline underline-offset-2 line-clamp-2"
                            >
                              {grant.title}
                            </a>
                          ) : (
                            <span className="font-medium line-clamp-2">{grant.title}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {grant.funder_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                          {awardRange ?? <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {deadline ? (
                            <DeadlineChip deadline={deadline} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Rolling</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <FunderTypeChip type={grant.funder_type} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetail(grant)}
                              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                            >
                              Info
                            </button>
                            {applyUrl && (
                              <a
                                href={applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
                              >
                                Apply
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedGrant && (
        <GrantDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          data={selectedGrant}
        />
      )}
    </div>
  )
}
