import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type {
  ApplicationDraft,
  ApplicationSection,
  CritiqueOutput,
  PassInput,
  RevisionOutput,
} from '@/lib/writing/types'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

function parseSections(text: string): ApplicationSection[] {
  const parts = text.split(/^##\s+/m)

  const sections = parts
    .slice(1)
    .map((part) => {
      const newlineIndex = part.indexOf('\n')
      if (newlineIndex === -1) {
        return {
          name: part.trim(),
          content: '',
          wordCount: 0,
        }
      }
      const name = part.slice(0, newlineIndex).trim()
      const content = part.slice(newlineIndex + 1).trim()
      return {
        name,
        content,
        wordCount: countWords(content),
      }
    })
    .filter((s) => s.name.length > 0)

  return sections
}

function buildPrompt(draft: ApplicationDraft, critique: CritiqueOutput): string {
  // Sort items: critical first, then important, then minor
  const severityOrder = { critical: 0, important: 1, minor: 2 }
  const sortedItems = [...critique.items].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  const critiqueueItemsText = sortedItems
    .map(
      (item, i) =>
        `${i + 1}. [${item.severity.toUpperCase()}] Section: "${item.section}"\n   Issue: ${item.issue}\n   Fix: ${item.suggestion}`
    )
    .join('\n\n')

  return `You are revising a grant application based on a self-critique. Make targeted, surgical edits to address the critique items. Do not rewrite sections that were not critiqued. Preserve all factual content.

Return the revised full text maintaining the ## Section Name heading format exactly as used in the original draft.

---
## Critique Summary

${critique.summary}

---
## Changes to Make (ordered by severity — address all of these)

${critiqueueItemsText}

---
## Original Draft

${draft.rawText}

---
## Instructions

- Make targeted, surgical edits only to the sections and issues identified above.
- Do not rewrite sections that were not critiqued.
- Preserve all factual content, data, and figures from the original draft.
- Use the exact same ## Section Name headings as the original draft.
- Return the complete revised application text — all sections, not just the changed parts.

Begin the revised application now:`
}

export async function reviseApplication(
  draft: ApplicationDraft,
  critique: CritiqueOutput,
  _input: PassInput
): Promise<RevisionOutput> {
  const passthroughFields = {
    selectedAngles: draft.selectedAngles,
    selectedFramework: draft.selectedFramework,
    researchNotes: draft.researchNotes,
  }

  // Skip revision when there is nothing to fix or the draft is already excellent
  if (critique.items.length === 0 || critique.overallScore >= 9) {
    return {
      sections: draft.sections,
      rawText: draft.rawText,
      changesLog: [],
      ...passthroughFields,
    }
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let responseText: string
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildPrompt(draft, critique),
        },
      ],
    })

    const block = response.content[0]
    responseText = block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[revision] Pass 3 API call failed:', err)
    return {
      sections: draft.sections,
      rawText: draft.rawText,
      changesLog: ['Revision pass failed — returning original draft'],
      ...passthroughFields,
    }
  }

  // Parse sections from the response; fall back to draft if parsing yields nothing
  let sections = parseSections(responseText)
  if (sections.length === 0) {
    sections = draft.sections
  }

  // Build changesLog from the critique items that were addressed
  const changesLog = critique.items.map((item) => item.suggestion)

  return {
    sections,
    rawText: responseText,
    changesLog,
    ...passthroughFields,
  }
}
