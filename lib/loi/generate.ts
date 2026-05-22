import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

export type LoiInput = {
  grant: {
    title: string
    funder_name: string | null
    description: string | null
    eligibility_text: string | null
    award_min: number | null
    award_max: number | null
    loi_deadline: string | null
  }
  entity: {
    name: string
    mission: string | null
    focus_area: string | null
    state: string | null
    city: string | null
    who_we_serve: string[] | null
  }
  founderStory?: string | null
  requestedAmount?: number | null
}

export type LoiOutput = {
  content: string
  wordCount: number
}

const SYSTEM_PROMPT =
  'You are an expert grant writer specializing in Letters of Inquiry. Write a 1-2 page LOI that is professional, concise, and compelling without being pushy. The LOI should feel like a respectful introduction, not a sales pitch. Avoid superlatives, buzzwords, and grandiose claims. Focus on: who the organization is, what problem they solve, how this grant aligns with their work, and what they would do with funding. Write in first person plural ("We"). Target 500-700 words.'

function buildPrompt(input: LoiInput): string {
  const { grant, entity, founderStory, requestedAmount } = input
  const lines: string[] = []

  lines.push(`Grant opportunity: ${grant.title}`)
  lines.push(`Funder: ${grant.funder_name ?? 'Unknown'}`)
  if (grant.description) lines.push(`Grant description: ${grant.description}`)
  if (grant.eligibility_text) lines.push(`Eligibility: ${grant.eligibility_text}`)
  if (grant.award_min !== null && grant.award_max !== null) {
    lines.push(`Award range: $${grant.award_min} – $${grant.award_max}`)
  }
  if (grant.loi_deadline) lines.push(`LOI deadline: ${grant.loi_deadline}`)

  lines.push('')
  lines.push(`Organization: ${entity.name}`)
  if (entity.mission) lines.push(`Mission: ${entity.mission}`)
  if (entity.focus_area) lines.push(`Focus area: ${entity.focus_area}`)
  const location = [entity.city, entity.state].filter(Boolean).join(', ')
  if (location) lines.push(`Location: ${location}`)
  if (entity.who_we_serve && entity.who_we_serve.length > 0) {
    lines.push(`Who we serve: ${entity.who_we_serve.join(', ')}`)
  }
  if (founderStory) lines.push(`Founder background: ${founderStory}`)
  if (requestedAmount !== undefined && requestedAmount !== null) {
    lines.push(`Requested amount: $${requestedAmount.toLocaleString()}`)
  }

  lines.push('')
  lines.push('Write the full LOI text.')

  return lines.join('\n')
}

export async function generateLoi(input: LoiInput): Promise<LoiOutput> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let text: string
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    })
    const block = response.content[0]
    text = block && block.type === 'text' ? block.text : ''
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`LOI generation failed: ${message}`)
  }

  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length

  return { content: text, wordCount }
}
