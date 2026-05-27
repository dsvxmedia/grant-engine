import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { ApplicationSection, HumanizerOutput, RevisionOutput } from '@/lib/writing/types'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

function parseSections(text: string): ApplicationSection[] {
  const parts = text.split(/^##\s+/m)

  return parts
    .slice(1)
    .map((part) => {
      const newlineIndex = part.indexOf('\n')
      if (newlineIndex === -1) {
        return { name: part.trim(), content: '', wordCount: 0 }
      }
      const name = part.slice(0, newlineIndex).trim()
      const content = part.slice(newlineIndex + 1).trim()
      return { name, content, wordCount: countWords(content) }
    })
    .filter((s) => s.name.length > 0)
}

function buildPrompt(revision: RevisionOutput, founderVoice: string | null): string {
  const founderVoiceBlock = founderVoice
    ? `## Founder Voice\nAdopt the vocabulary and cadence from this passage when rewriting:\n\n${founderVoice}\n\n---\n`
    : ''

  return `You are a professional grant writer performing a humanization pass on a grant application. Your task is to make this text read as if written by a thoughtful, experienced human — not an AI.

${founderVoiceBlock}## Instructions

Remove all AI-sounding patterns including:
- "In conclusion"
- "It is worth noting"
- "It is important to"
- "Firstly"
- "Furthermore"
- "In today's world"
- "In the realm of"

Apply these writing techniques:
- Vary sentence length: mix short punchy sentences with longer, more detailed ones
- Vary sentence starts: never allow 3 consecutive sentences to start with the same word
- Convert passive voice to active voice where natural and clear
- Use concrete, specific language instead of vague generalities

Preserve without change:
- All facts, statistics, names, and dates
- All dollar amounts and numerical data
- All ## Section Name heading markers (keep them exactly as-is)

Return the complete humanized application text with all sections, maintaining the ## Section Name heading format.

---
## Application Text to Humanize

${revision.rawText}

---

Begin the humanized application now:`
}

export async function humanizeApplication(
  revision: RevisionOutput,
  founderVoice: string | null
): Promise<HumanizerOutput> {
  const passthroughFields = {
    changesLog: revision.changesLog,
    selectedAngles: revision.selectedAngles,
    selectedFramework: revision.selectedFramework,
    researchNotes: revision.researchNotes,
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let responseText: string
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: buildPrompt(revision, founderVoice),
        },
      ],
    })

    const block = response.content[0]
    responseText = block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[humanizer] Pass 4 API call failed:', err)
    return {
      sections: revision.sections,
      rawText: revision.rawText,
      humanizerApplied: false,
      ...passthroughFields,
    }
  }

  const sections = parseSections(responseText)

  return {
    sections: sections.length > 0 ? sections : revision.sections,
    rawText: responseText,
    humanizerApplied: true,
    ...passthroughFields,
  }
}
