import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { getGrantWriterSystemPromptBlocks } from '@/lib/writing/system-prompt'
import type { PassInput, DraftOutput, ApplicationSection } from '@/lib/writing/types'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

function buildUserPrompt(input: PassInput): string {
  const { grant, entity, founderName, founderStory, research, matchedAngles } = input

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
  if (entity.is_african_american_owned) entityFlags.push('African American-owned')
  if (entity.is_minority_owned) entityFlags.push('Minority-owned')
  if (entity.is_tech_company) entityFlags.push('Technology company')
  if (entity.is_social_enterprise) entityFlags.push('Social enterprise')
  if (entity.is_community_serving) entityFlags.push('Community-serving organization')
  if (entity.is_underserved_community_tied) entityFlags.push('Serves underserved communities')

  const location = [entity.city, entity.state].filter(Boolean).join(', ')
  const yearEstablished = entity.founding_date
    ? new Date(entity.founding_date).getFullYear().toString()
    : null
  const teamSize = entity.employee_count ? `${entity.employee_count} employees` : null

  const entityProfileLines: string[] = [
    `**Organization Name:** ${entity.name}`,
    entity.industry ? `**Industry:** ${entity.industry}` : null,
    location ? `**Location:** ${location}` : null,
    yearEstablished ? `**Year Established:** ${yearEstablished}` : null,
    teamSize ? `**Team Size:** ${teamSize}` : null,
    `**Mission:** ${entity.mission ?? 'Not provided.'}`,
    `**Focus Area:** ${entity.focus_area ?? 'Not provided.'}`,
    `**Who We Serve:** ${entity.who_we_serve?.join(', ') ?? 'Not specified.'}`,
    entityFlags.length > 0
      ? `**Organizational Characteristics:** ${entityFlags.join(', ')}`
      : null,
    founderName ? `**Principal Contact:** ${founderName}` : null,
  ].filter((line): line is string => line !== null)

  const founderStorySection = founderStory
    ? `\n## Founder Story\n${founderStory}\n`
    : ''

  const grantNarrativeSection = entity.grant_narrative
    ? `\n---\n## Organization Narrative (FOUNDATIONAL — build the application around this)\n\nThe following is the pre-written, approved narrative for this organization. This is the voice, positioning, and story the organization uses for grant applications. Do NOT contradict it, dilute it, or rewrite it. Use it as the FOUNDATION of every section you write. Draw on this language directly — incorporate phrases, framing, and positioning from this narrative throughout the application.\n\n${entity.grant_narrative}\n`
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

${entityProfileLines.join('\n')}
${founderStorySection}${grantNarrativeSection}
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
9. CRITICAL: Never write placeholder text. Do not use brackets like [City], [Year — applicant to confirm], [Number], [URL], or any similar markers. Every word in the final application must be real, readable prose. If a specific data point (website URL, phone number, founding year) was not provided in the Applicant Profile above, write around it using accurate general language — or omit that field entirely. A bracketed placeholder is never acceptable in a submission-ready application.
${entity.grant_narrative ? '10. CRITICAL: The Organization Narrative above is the approved voice of this organization. Use it. Do not invent an alternative voice or generic nonprofit language. Every section must sound like the organization described there.' : '10. Write in a clear, professional voice consistent with the organization\'s mission and focus area.'}

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
