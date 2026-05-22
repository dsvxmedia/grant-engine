import { Header } from '@/components/layout/Header'
import { createServiceClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

type ProgramOfficer = {
  id: string
  funder_name: string
  name: string | null
  email: string | null
  focus_areas: string[]
  relationship_strength: number | null
  last_contact_date: string | null
  created_at: string
}

async function fetchOfficers(): Promise<ProgramOfficer[]> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await (supabase as any)
      .from('program_officers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as ProgramOfficer[]
  } catch {
    return []
  }
}

function strengthLabel(score: number | null): { label: string; className: string } {
  if (score == null) return { label: 'New', className: 'bg-muted text-muted-foreground' }
  if (score >= 8) return { label: 'Strong', className: 'bg-green-100 text-green-700' }
  if (score >= 5) return { label: 'Building', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Weak', className: 'bg-red-100 text-red-600' }
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function RelationshipsPage() {
  const officers = await fetchOfficers()

  return (
    <div className="flex flex-col h-full">
      <Header title="Relationship Manager" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl flex flex-col gap-6">
          {officers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No program officers tracked yet. Officers are added automatically when you engage with funders.
            </p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Officer
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Funder
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Strength
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Last Contact
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {officers.map((officer) => {
                    const { label, className } = strengthLabel(officer.relationship_strength)
                    return (
                      <tr key={officer.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {officer.name ?? 'Unknown'}
                          </p>
                          {officer.email && (
                            <p className="text-xs text-muted-foreground">{officer.email}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">{officer.funder_name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              className
                            )}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatDate(officer.last_contact_date)}
                        </td>
                        <td className="px-4 py-3">
                          {officer.email ? (
                            <a
                              href={`mailto:${officer.email}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Log Contact
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">No email</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
