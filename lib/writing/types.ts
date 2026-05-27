import type { ResearchFindings } from '@/lib/writing/research'

export type ApplicationSection = {
  name: string
  content: string
  wordCount: number
}

export type ApplicationDraft = {
  sections: ApplicationSection[]
  rawText: string         // full concatenated text for later passes
  selectedAngles: string[]
  selectedFramework: string
  researchNotes: string
}

export type PassInput = {
  grant: {
    title: string
    funder_name: string | null
    funder_type: string | null
    description: string | null
    award_min: number | null
    award_max: number | null
    deadline: string | null
    eligibility_tags: string[]
    category_tags: string[]
  }
  entity: {
    name: string
    industry: string | null
    city: string | null
    state: string | null
    founding_date: string | null
    employee_count: number | null
    mission: string | null
    focus_area: string | null
    who_we_serve: string[] | null
    is_african_american_owned: boolean | null
    is_minority_owned: boolean | null
    is_underserved_community_tied: boolean | null
    is_tech_company: boolean | null
    is_social_enterprise: boolean | null
    is_community_serving: boolean | null
    pitch_angles_generated: unknown
    grant_narrative: string | null
  }
  founderName: string | null
  founderStory: string | null
  research: ResearchFindings
  matchedAngles: string[]    // from grant_match.matched_angles
}

export type DraftOutput = ApplicationDraft

export type CritiqueItem = {
  section: string          // which section the critique applies to (or 'overall')
  issue: string            // what is wrong or could be improved
  suggestion: string       // specific actionable fix
  severity: 'critical' | 'important' | 'minor'
}

export type CritiqueOutput = {
  items: CritiqueItem[]
  overallScore: number     // 0-10 self-assessment
  summary: string          // 1-2 sentence summary of the draft's main weakness
}

export type RevisionOutput = {
  sections: ApplicationSection[]   // revised sections
  rawText: string                  // full revised text
  changesLog: string[]             // list of what was changed and why
  selectedAngles: string[]         // carried through from draft
  selectedFramework: string        // carried through from draft
  researchNotes: string            // carried through from draft
}

export type HumanizerOutput = {
  sections: ApplicationSection[]
  rawText: string
  changesLog: string[]
  selectedAngles: string[]
  selectedFramework: string
  researchNotes: string
  humanizerApplied: boolean        // true on success, false on API failure
}

export type UniquenessOutput = {
  sections: ApplicationSection[]
  rawText: string
  changesLog: string[]
  selectedAngles: string[]
  selectedFramework: string
  researchNotes: string
  humanizerApplied: boolean
  uniquenessScore: number          // 1.0 = fully unique, lower = more similar to others
  needsRevision: boolean           // true if similarity > 0.85
}
