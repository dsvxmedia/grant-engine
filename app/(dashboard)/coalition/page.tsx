import { Header } from '@/components/layout/Header'
import { createServiceClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

type PartnerOrganization = {
  id: string
  name: string
  mission: string | null
  type: string | null
  contact_email: string | null
  relationship_strength: number | null
  created_at: string
}

async function fetchPartners(): Promise<PartnerOrganization[]> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await (supabase as any)
      .from('partner_organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as PartnerOrganization[]
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

function truncate(text: string | null, maxLen = 100): string {
  if (!text) return '—'
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export default async function CoalitionPage() {
  const partners = await fetchPartners()

  return (
    <div className="flex flex-col h-full">
      <Header title="Coalition Board" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl flex flex-col gap-6">
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No partner organizations yet. Add partners to find coalition opportunities.
            </p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Organization
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Mission
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Strength
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {partners.map((partner) => {
                    const { label, className } = strengthLabel(partner.relationship_strength)
                    return (
                      <tr key={partner.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{partner.name}</p>
                          {partner.contact_email && (
                            <p className="text-xs text-muted-foreground">{partner.contact_email}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {truncate(partner.mission)}
                        </td>
                        <td className="px-4 py-3 text-foreground capitalize">
                          {partner.type ?? '—'}
                        </td>
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
