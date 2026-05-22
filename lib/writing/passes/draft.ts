import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { getGrantWriterSystemPromptBlocks } from '@/lib/writing/system-prompt'
import type { PassInput, DraftOutput, ApplicationSection } from '@/lib/writing/types'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

function buildUserPrompt(input: PassInput): string {
  const { grant, entity, founderStory, research, matchedAngles } = input

  const awardRange =
    grant.award_min !== null && grant.award_max !== null
      ? `$${grant.award_min.toLocaleString()} – $${grant.award_max.toLocaleString()}`
      : grant.award_max !== null
        ? `Up to $${grant.award_max.toLocaleString()}`
        : grant.award_min !== null
          ? `From $${grant.award_min.toLocaleString()}`
          : 'Not specified'

  const wordLimitsText =
    Object.keys(research.wordLimits).length > 0
      ? Object.entries(research.wordLimits)
          .map(([section, limit]) => `  - ${section}: ${limit} words`)
          .join('\n')
      : '  - No specific limits provided; follow default section guidelines.'

  const requiredSectionsText = research.requiredSections
    .map((s) => `  - ${s}`)
    .join('\n')

  const entityFlags: string[] = []
  if (entity.is_minority_owned) entityFlags.push('Minority-owned')
  if (entity.is_tech_company) entityFlags.push('Tech company')
  if (entity.is_social_enterprise) entityFlags.push('Social enterprise')

  const founderStorySection = founderStory
    ? `\n## Founder Story\n${founderStory}\n`
    : ''

  const prompt = `You are writing a grant application for the following opportunity. Produce a complete first draft with all required sections. Use ## Section Name headings for each section, exactly matching the required section names listed below.

---
## Grant Opportunity

**Title:** ${grant.title}
**Funder:** ${grant.funder_name ?? 'Unknown'}
**Funder Type:** ${grant.funder_type ?? 'Unknown'}
**Description:** ${grant.description ?? 'No description provided.'}
**Award Range:** ${awardRange}
**Deadline:** ${grant.deadline ?? 'Not specified'}
**Eligibility Tags:** ${grant.eligibility_tags.join(', ') || 'None specified'}
**Category Tags:** ${grant.category_tags.join(', ') || 'None specified'}

---
## Funder Research

**Funder Background:**
${research.funderBackground || 'No background information available.'}

**Previous Recipients:**
${research.previousRecipients.length > 0 ? research.previousRecipients.map((r) => `- ${r}`).join('\n') : 'None identified.'}

**Evaluation Criteria:**
${research.evaluationCriteria.length > 0 ? research.evaluationCriteria.map((c) => `- ${c}`).join('\n') : 'None specified.'}

**Key Funder Language to Mirror:**
${research.funderLanguage.length > 0 ? research.funderLanguage.map((l) => `- ${l}`).join('\n') : 'None identified.'}

**Strategic Framework:** ${research.selectedFramework}

---
## Applicant Profile

**Organization Name:** ${entity.name}
**Mission:** ${entity.mission ?? 'Not provided.'}
**Focus Area:** ${entity.focus_area ?? 'Not provided.'}
**Who We Serve:** ${entity.who_we_serve?.join(', ') ?? 'Not specified.'}
**Organizational Characteristics:** ${entityFlags.length > 0 ? entityFlags.join(', ') : 'None flagged.'}
${founderStorySection}
---
## Strongest Pitch Angles (use these strategically throughout the application)

${matchedAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---
## Required Sections

Write each of the following sections. Use the exact section name as the ## heading:
${requiredSectionsText}

## Word Limits

Respect these word limits precisely (target 95–100% of the limit, never exceed):
${wordLimitsText}

---
## Writing Instructions

1. Start each section with the exact ## heading matching the required section name.
2. Lead with the problem or community need — not the organization.
3. Mirror the funder's language listed above throughout the narrative.
4. Apply the ${research.selectedFramework} framework to structure your thinking.
5. Use SMART objectives in any goals or evaluation sections.
6. Include equity-centered framing that centers the community, not the organization.
7. Do not fabricate statistics — use general evidence-based language where specific data is not provided.
8. Write each section so it stands alone but builds cumulatively with the others.

Begin the application now:`

  return prompt
}

function parseSections(text: string): ApplicationSection[] {
  // Split on lines starting with ## (capturing the heading)
  const parts = text.split(/^##\s+/m)

  // If there's only one part (the pre-heading text or no headings at all), fall back
  const sections = parts
    .slice(1) // first element is any text before the first ## heading
    .map((part) => {
      const newlineIndex = part.indexOf('\n')
      if (newlineIndex === -1) {
        // Entire part is the heading with no body
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

export async function generateFirstDraft(input: PassInput): Promise<DraftOutput> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let responseText: string

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: getGrantWriterSystemPromptBlocks(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(input),
        },
      ],
    })

    const block = response.content[0]
    responseText = block.type === 'text' ? block.text : ''
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Pass 1 (draft) failed: ${message}`)
  }

  // Parse sections from the response
  let sections: ApplicationSection[] = parseSections(responseText)

  // Fallback: if no ## headings were found, treat the entire response as one section
  if (sections.length === 0) {
    sections = [
      {
        name: 'Full Draft',
        content: responseText.trim(),
        wordCount: countWords(responseText),
      },
    ]
  }

  return {
    sections,
    rawText: responseText,
    selectedAngles: input.matchedAngles,
    selectedFramework: input.research.selectedFramework,
    researchNotes: JSON.stringify(input.research),
  }
}
