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
    mission: string | null
    focus_area: string | null
    who_we_serve: string[] | null
    is_minority_owned: boolean | null
    is_tech_company: boolean | null
    is_social_enterprise: boolean | null
    pitch_angles_generated: unknown
  }
  founderStory: string | null
  research: ResearchFindings
  matchedAngles: string[]    // from grant_match.matched_angles
}

export type DraftOutput = ApplicationDraft
