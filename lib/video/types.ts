export type VideoScript = {
  sections: Array<{
    name: string        // e.g. "Intro", "Problem", "Solution"
    text: string        // spoken content
    durationSeconds: number
  }>
  spokenText: string    // full concatenated text for TTS
  totalDurationSeconds: number
  wordCount: number
}

export type VideoJobStatus = 'pending' | 'rendering' | 'ready' | 'approved' | 'rejected' | 'submitted'

export type VideoJob = {
  id: string
  grantId: string
  grantMatchId: string | null
  entityId: string
  scriptContent: string | null
  videoUrl: string | null
  heygenVideoId: string | null
  voiceId: string | null
  renderStatus: VideoJobStatus
  aiDisclosureIncluded: boolean
  durationSeconds: number | null
  createdAt: string
}

export type VideoResult = {
  jobId: string
  videoUrl: string
  status: VideoJobStatus
}

export type VideoInput = {
  grant: {
    title: string
    funder_name: string | null
    description: string | null
    award_min: number | null
    award_max: number | null
    deadline: string | null
  }
  entity: {
    name: string
    mission: string | null
    focus_area: string | null
    who_we_serve: string[] | null
  }
  founderName: string | null
  founderStory: string | null
  requestedAmount: number | null
}
