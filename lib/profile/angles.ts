import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

export type EntityForAngleGeneration = {
  name: string
  mission?: string | null
  focus_area?: string | null
  industry?: string | null
  state?: string | null
  city?: string | null
  who_we_serve?: string[] | null
  is_african_american_owned?: boolean | null
  is_minority_owned?: boolean | null
  is_underserved_community_tied?: boolean | null
  is_tech_company?: boolean | null
  is_social_enterprise?: boolean | null
  is_community_serving?: boolean | null
  owner_demographics?: Record<string, unknown> | null
  geographic_ties?: Record<string, unknown> | null
}

const SYSTEM_PROMPT =
  'You are a grant writer who specializes in identifying the strongest narrative angles for grant applications. Generate 5-10 distinct, compelling narrative angles for this organization. Each angle should be 1-2 sentences highlighting a specific aspect of the organization\'s eligibility, identity, or impact. Return ONLY a JSON array of strings. No explanation.'

type BooleanEntityField = Extract<keyof EntityForAngleGeneration, `is_${string}`>

const ELIGIBILITY_LABELS: Partial<Record<BooleanEntityField, string>> = {
  is_african_american_owned: 'African American owned',
  is_minority_owned: 'Minority owned',
  is_underserved_community_tied: 'Tied to an underserved community',
  is_tech_company: 'Technology company',
  is_social_enterprise: 'Social enterprise',
  is_community_serving: 'Community serving',
}

function buildPrompt(entity: EntityForAngleGeneration): string {
  const lines: string[] = [`Organization: ${entity.name}`]

  if (entity.mission) lines.push(`Mission: ${entity.mission}`)
  if (entity.focus_area) lines.push(`Focus area: ${entity.focus_area}`)
  if (entity.industry) lines.push(`Industry: ${entity.industry}`)

  const location = [entity.city, entity.state].filter(Boolean).join(', ')
  if (location) lines.push(`Location: ${location}`)

  if (entity.who_we_serve && entity.who_we_serve.length > 0) {
    lines.push(`Who we serve: ${entity.who_we_serve.join(', ')}`)
  }

  const attributes = (Object.entries(ELIGIBILITY_LABELS) as [BooleanEntityField, string][])
    .filter(([key]) => entity[key] === true)
    .map(([, label]) => label)
  if (attributes.length > 0) {
    lines.push(`Eligibility attributes: ${attributes.join(', ')}`)
  }

  if (entity.owner_demographics && Object.keys(entity.owner_demographics).length > 0) {
    lines.push(`Owner demographics: ${JSON.stringify(entity.owner_demographics)}`)
  }
  if (entity.geographic_ties && Object.keys(entity.geographic_ties).length > 0) {
    lines.push(`Geographic ties: ${JSON.stringify(entity.geographic_ties)}`)
  }

  return lines.join('\n')
}

export async function generateAngles(
  entity: EntityForAngleGeneration
): Promise<string[]> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let text: string
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(entity) }],
    })
    const block = response.content[0]
    text = block && block.type === 'text' ? block.text : ''
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Angle generation API call failed: ${message}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(
      `Failed to parse angle generation response as JSON: ${text.slice(0, 200)}`
    )
  }

  if (!Array.isArray(parsed) || !parsed.every((a) => typeof a === 'string')) {
    throw new Error('Angle generation response was not a JSON array of strings')
  }

  return parsed as string[]
}
