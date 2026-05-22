import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export type CoalitionMatch = {
  partnerId: string
  partnerName: string
  missionOverlap: string[]
  inquiryDraft: string
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  )
}

function computeOverlap(mission1: string, mission2: string): string[] {
  const tokens1 = tokenize(mission1)
  const tokens2 = tokenize(mission2)
  const overlap: string[] = []
  for (const token of tokens1) {
    if (tokens2.has(token)) overlap.push(token)
  }
  return overlap
}

export async function draftPartnerInquiry(
  partnerName: string,
  grantTitle: string,
  entityMission: string
): Promise<string> {
  const template = `We are reaching out regarding the "${grantTitle}" grant opportunity. We believe a coalition between our organizations could strengthen our joint application, given our aligned missions. We would welcome a conversation to explore this potential partnership.`

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Write a brief, professional partnership inquiry email to ${partnerName} about the "${grantTitle}" grant opportunity. Our mission: ${entityMission}. Keep it to 2-3 sentences. Return only the email body.`,
        },
      ],
    })

    const block = response.content[0]
    const body = block.type === 'text' ? block.text.trim() : ''
    return body || template
  } catch (err) {
    console.error('[coalition] draftPartnerInquiry error:', err)
    return template
  }
}

export async function findCoalitionPartners(
  grantId: string,
  entityId: string
): Promise<CoalitionMatch[]> {
  try {
    const supabase = await createServiceClient()

    // Fetch grant
    const { data: grant, error: grantError } = await (supabase as any)
      .from('grants')
      .select('id, title, coalition_preferred, eligibility_tags')
      .eq('id', grantId)
      .maybeSingle()

    if (grantError) console.error('[coalition] grant fetch error:', grantError)
    if (!grant || !grant.coalition_preferred) return []

    // Fetch the requesting entity
    const { data: entity, error: entityError } = await (supabase as any)
      .from('business_entities')
      .select('id, mission')
      .eq('id', entityId)
      .maybeSingle()

    if (entityError) console.error('[coalition] entity fetch error:', entityError)

    const entityMission: string = entity?.mission ?? ''

    // Fetch all partner organizations
    const { data: partners, error: partnersError } = await (supabase as any)
      .from('partner_organizations')
      .select('id, name, mission')

    if (partnersError) console.error('[coalition] partners fetch error:', partnersError)
    if (!partners || partners.length === 0) return []

    // Compute overlap for each partner
    const scored = partners
      .filter((p: any) => p.id !== entityId)
      .map((partner: any) => {
        const overlap = computeOverlap(entityMission, partner.mission ?? '')
        return { partner, overlap }
      })
      .filter(({ overlap }: { overlap: string[] }) => overlap.length > 0)
      .sort(
        (a: { overlap: string[] }, b: { overlap: string[] }) =>
          b.overlap.length - a.overlap.length
      )
      .slice(0, 3)

    // Draft inquiry emails
    const results: CoalitionMatch[] = await Promise.all(
      scored.map(async ({ partner, overlap }: { partner: any; overlap: string[] }) => {
        const inquiryDraft = await draftPartnerInquiry(
          partner.name,
          grant.title,
          entityMission
        )
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          missionOverlap: overlap,
          inquiryDraft,
        }
      })
    )

    return results
  } catch (err) {
    console.error('[coalition] findCoalitionPartners unexpected error:', err)
    return []
  }
}
