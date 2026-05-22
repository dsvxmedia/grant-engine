import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { VideoInput, VideoScript } from './types'

// ─── Fallback template ────────────────────────────────────────────────────────

function buildFallbackScript(input: VideoInput): VideoScript {
  const name = input.founderName ?? 'our founder'
  const entityName = input.entity.name
  const funderName = input.grant.funder_name ?? 'your organization'
  const amount = input.requestedAmount
    ? `$${input.requestedAmount.toLocaleString()}`
    : 'funding'

  const sections = [
    {
      name: 'Intro',
      text: `Hi, I'm ${name} from ${entityName}.`,
      durationSeconds: 15,
    },
    {
      name: 'Problem',
      text: `Our community faces real challenges that demand innovative solutions.`,
      durationSeconds: 30,
    },
    {
      name: 'Solution',
      text: `At ${entityName}, we are building targeted programs to address those challenges head-on.`,
      durationSeconds: 45,
    },
    {
      name: 'Impact',
      text: `${input.entity.mission ?? `${entityName} serves those who need it most.`}`,
      durationSeconds: 30,
    },
    {
      name: 'Ask',
      text: `We are requesting ${amount} to accelerate our work and expand our reach.`,
      durationSeconds: 20,
    },
    {
      name: 'Close',
      text: `${funderName} is the right partner to help us make that happen. Thank you.`,
      durationSeconds: 10,
    },
  ]

  const spokenText = sections.map((s) => s.text).join(' ')
  const wordCount = spokenText.split(/\s+/).filter(Boolean).length
  const totalDurationSeconds = sections.reduce((sum, s) => sum + s.durationSeconds, 0)

  return { sections, spokenText, wordCount, totalDurationSeconds }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateVideoScript(input: VideoInput): Promise<VideoScript> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const entityDescription = [
    input.entity.mission,
    input.entity.focus_area ? `Focus area: ${input.entity.focus_area}` : null,
    input.entity.who_we_serve?.length
      ? `Serves: ${input.entity.who_we_serve.join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `You are writing a 2.5-minute video pitch script for a grant application.

Grant: ${input.grant.title}
Funder: ${input.grant.funder_name ?? 'Unknown funder'}
${input.grant.description ? `Grant description: ${input.grant.description}` : ''}
Award range: ${input.grant.award_min != null ? `$${input.grant.award_min.toLocaleString()}` : 'unspecified'} – ${input.grant.award_max != null ? `$${input.grant.award_max.toLocaleString()}` : 'unspecified'}
${input.grant.deadline ? `Deadline: ${input.grant.deadline}` : ''}

Organization: ${input.entity.name}
${entityDescription}

Founder: ${input.founderName ?? 'Not specified'}
${input.founderStory ? `Founder story: ${input.founderStory}` : ''}
${input.requestedAmount != null ? `Requested amount: $${input.requestedAmount.toLocaleString()}` : ''}

Write a compelling, authentic pitch script with these six sections:
1. Intro (15 seconds): Introduce the founder and organization warmly
2. Problem (30 seconds): Describe the specific community problem being solved
3. Solution (45 seconds): Explain what the organization does and how it works
4. Impact (30 seconds): Share concrete outcomes and who is served
5. Ask (20 seconds): State the requested amount and how it will be used
6. Close (10 seconds): Explain why this funder is the right partner

Guidelines:
- Keep total under 400 words (≈2.5 minutes at 130 words per minute)
- Use 130 words per minute to estimate durationSeconds for each section
- Sound human and authentic — not AI-generated
- Mirror the funder's values and language where possible

Return ONLY a JSON object in this exact format, with no other text:
{
  "sections": [
    { "name": "Intro", "text": "...", "durationSeconds": 15 },
    { "name": "Problem", "text": "...", "durationSeconds": 30 },
    { "name": "Solution", "text": "...", "durationSeconds": 45 },
    { "name": "Impact", "text": "...", "durationSeconds": 30 },
    { "name": "Ask", "text": "...", "durationSeconds": 20 },
    { "name": "Close", "text": "...", "durationSeconds": 10 }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content[0]
    const rawText = block.type === 'text' ? block.text : ''

    // Extract JSON from response — may be wrapped in markdown fences
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[video/script] Claude response did not contain valid JSON, using fallback')
      return buildFallbackScript(input)
    }

    const parsed = JSON.parse(jsonMatch[0]) as { sections: Array<{ name: string; text: string; durationSeconds: number }> }

    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      console.error('[video/script] Parsed sections array is empty, using fallback')
      return buildFallbackScript(input)
    }

    const sections = parsed.sections.map((s) => ({
      name: String(s.name ?? ''),
      text: String(s.text ?? ''),
      durationSeconds: Number(s.durationSeconds ?? 0),
    }))

    const spokenText = sections.map((s) => s.text).join(' ')
    const wordCount = spokenText.split(/\s+/).filter(Boolean).length
    const totalDurationSeconds = sections.reduce((sum, s) => sum + s.durationSeconds, 0)

    return { sections, spokenText, wordCount, totalDurationSeconds }
  } catch (err) {
    console.error('[video/script] Error generating script, using fallback:', err)
    return buildFallbackScript(input)
  }
}
