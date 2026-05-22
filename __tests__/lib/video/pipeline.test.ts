import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceClient } from '@/lib/supabase/server'
import { generateVideoScript } from '@/lib/video/script'
import { generateVoiceAudio } from '@/lib/video/voice'
import { startHeyGenRender, pollHeyGenStatus } from '@/lib/video/render'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('@/lib/video/script', () => ({
  generateVideoScript: vi.fn(),
}))
vi.mock('@/lib/video/voice', () => ({
  generateVoiceAudio: vi.fn(),
}))
vi.mock('@/lib/video/render', () => ({
  startHeyGenRender: vi.fn(),
  pollHeyGenStatus: vi.fn(),
}))
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.vercel-storage.com/videos/sub-444/pitch.mp4' }),
}))
vi.mock('server-only', () => ({}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)
const mockedGenerateVideoScript = vi.mocked(generateVideoScript)
const mockedGenerateVoiceAudio = vi.mocked(generateVoiceAudio)
const mockedStartHeyGenRender = vi.mocked(startHeyGenRender)
const mockedPollHeyGenStatus = vi.mocked(pollHeyGenStatus)

// ─── Fixture factories ────────────────────────────────────────────────────────

const GRANT_MATCH_ID = 'match-111'
const GRANT_ID = 'grant-222'
const ENTITY_ID = 'entity-333'
const SUBMISSION_ID = 'sub-444'
const HEYGEN_VIDEO_ID = 'heygen-555'
const AUDIO_URL = 'https://blob.vercel-storage.com/audio.mp3'
const FINAL_VIDEO_URL = 'https://heygen.com/render/completed.mp4'

function makeGrantMatch() {
  return {
    id: GRANT_MATCH_ID,
    grant_id: GRANT_ID,
    entity_id: ENTITY_ID,
    matched_angles: ['minority-owned', 'tech-company'],
    status: 'queued',
  }
}

function makeGrant() {
  return {
    id: GRANT_ID,
    title: 'Community Tech Grant',
    funder_name: 'Acme Foundation',
    description: 'A grant for tech startups.',
    award_min: 25000,
    award_max: 75000,
    deadline: '2026-12-01',
  }
}

function makeEntity() {
  return {
    id: ENTITY_ID,
    name: 'Test Tech Corp',
    mission: 'Empowering minority tech entrepreneurs.',
    focus_area: 'technology',
    who_we_serve: ['minority-owned businesses'],
  }
}

function makeFounderProfile() {
  return {
    id: 'founder-666',
    owner_name: 'Jane Doe',
    origin_story: 'I started this because I saw a gap in the market.',
    created_at: '2026-01-01T00:00:00Z',
  }
}

function makeVideoScript() {
  return {
    sections: [
      { name: 'Intro', text: 'Hi, I am Jane Doe.', durationSeconds: 15 },
      { name: 'Problem', text: 'There is a gap.', durationSeconds: 30 },
    ],
    spokenText: 'Hi, I am Jane Doe. There is a gap.',
    totalDurationSeconds: 45,
    wordCount: 9,
  }
}

function makeSavedSubmission() {
  return {
    id: SUBMISSION_ID,
    grant_id: GRANT_ID,
    entity_id: ENTITY_ID,
    grant_match_id: GRANT_MATCH_ID,
    render_status: 'pending',
    ai_disclosure_included: true,
  }
}

// ─── Supabase mock builder ────────────────────────────────────────────────────

function buildSupabaseMock({
  grantMatchNotFound = false,
}: {
  grantMatchNotFound?: boolean
} = {}) {
  // grant_matches fetch
  const grantMatchMaybeSingle = vi.fn().mockResolvedValue(
    grantMatchNotFound
      ? { data: null, error: null }
      : { data: makeGrantMatch(), error: null }
  )
  const grantMatchSelectEq = vi.fn().mockReturnValue({ maybeSingle: grantMatchMaybeSingle })
  const grantMatchSelect = vi.fn().mockReturnValue({ eq: grantMatchSelectEq })

  // grants fetch
  const grantMaybeSingle = vi.fn().mockResolvedValue({ data: makeGrant(), error: null })
  const grantSelectEq = vi.fn().mockReturnValue({ maybeSingle: grantMaybeSingle })
  const grantSelect = vi.fn().mockReturnValue({ eq: grantSelectEq })

  // business_entities fetch
  const entityMaybeSingle = vi.fn().mockResolvedValue({ data: makeEntity(), error: null })
  const entitySelectEq = vi.fn().mockReturnValue({ maybeSingle: entityMaybeSingle })
  const entitySelect = vi.fn().mockReturnValue({ eq: entitySelectEq })

  // founder_profile fetch (chained: .select().order().limit().maybeSingle())
  const founderMaybeSingle = vi.fn().mockResolvedValue({ data: makeFounderProfile(), error: null })
  const founderLimit = vi.fn().mockReturnValue({ maybeSingle: founderMaybeSingle })
  const founderOrder = vi.fn().mockReturnValue({ limit: founderLimit })
  const founderSelect = vi.fn().mockReturnValue({ order: founderOrder })

  // video_submissions insert
  const insertSingle = vi.fn().mockResolvedValue({
    data: makeSavedSubmission(),
    error: null,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
  const videoInsert = vi.fn().mockReturnValue({ select: insertSelect })

  // video_submissions update (any update on video_submissions)
  const videoUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const videoUpdate = vi.fn().mockReturnValue({ eq: videoUpdateEq })

  // notifications insert
  const notificationsInsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'grant_matches') return { select: grantMatchSelect }
    if (table === 'grants') return { select: grantSelect }
    if (table === 'business_entities') return { select: entitySelect }
    if (table === 'founder_profile') return { select: founderSelect }
    if (table === 'video_submissions') return { insert: videoInsert, update: videoUpdate }
    if (table === 'notifications') return { insert: notificationsInsert }
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    client: { from } as any,
    spies: {
      from,
      videoInsert,
      videoUpdate,
      videoUpdateEq,
      notificationsInsert,
    },
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()

  mockedGenerateVideoScript.mockResolvedValue(makeVideoScript())
  mockedGenerateVoiceAudio.mockResolvedValue(AUDIO_URL)
  mockedStartHeyGenRender.mockResolvedValue(HEYGEN_VIDEO_ID)
  mockedPollHeyGenStatus.mockResolvedValue({
    status: 'completed',
    videoUrl: FINAL_VIDEO_URL,
  })

  // Mock global fetch for the video download step (Step 8)
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  } as any)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runVideoPipeline', () => {
  it('calls all pipeline steps in sequence', async () => {
    const { client } = buildSupabaseMock()
    mockedCreateServiceClient.mockResolvedValue(client)

    const { runVideoPipeline } = await import('@/lib/video/pipeline')
    await runVideoPipeline(GRANT_MATCH_ID)

    expect(mockedGenerateVideoScript).toHaveBeenCalledOnce()
    expect(mockedGenerateVoiceAudio).toHaveBeenCalledOnce()
    expect(mockedStartHeyGenRender).toHaveBeenCalledOnce()
    expect(mockedPollHeyGenStatus).toHaveBeenCalled()
  })

  it('always sets ai_disclosure_included to true in the inserted record', async () => {
    const { client, spies } = buildSupabaseMock()
    mockedCreateServiceClient.mockResolvedValue(client)

    const { runVideoPipeline } = await import('@/lib/video/pipeline')
    await runVideoPipeline(GRANT_MATCH_ID)

    expect(spies.videoInsert).toHaveBeenCalledOnce()
    const insertArg = spies.videoInsert.mock.calls[0][0]
    expect(insertArg.ai_disclosure_included).toBe(true)
  })

  it('sets render_status to ready on successful completion', async () => {
    const { client, spies } = buildSupabaseMock()
    mockedCreateServiceClient.mockResolvedValue(client)

    const { runVideoPipeline } = await import('@/lib/video/pipeline')
    const result = await runVideoPipeline(GRANT_MATCH_ID)

    // The final update should set render_status to 'ready'
    const updateCalls = spies.videoUpdate.mock.calls
    const readyUpdate = updateCalls.find((call: any[]) =>
      call[0]?.render_status === 'ready'
    )
    expect(readyUpdate).toBeDefined()
    expect(result.status).toBe('ready')
  })

  it('creates a notification on successful completion', async () => {
    const { client, spies } = buildSupabaseMock()
    mockedCreateServiceClient.mockResolvedValue(client)

    const { runVideoPipeline } = await import('@/lib/video/pipeline')
    await runVideoPipeline(GRANT_MATCH_ID)

    expect(spies.notificationsInsert).toHaveBeenCalledOnce()
    const notifArg = spies.notificationsInsert.mock.calls[0][0]
    expect(notifArg.type).toBe('video_ready')
    expect(notifArg.title).toContain('Video ready')
  })

  it('throws when grant match is not found', async () => {
    const { client } = buildSupabaseMock({ grantMatchNotFound: true })
    mockedCreateServiceClient.mockResolvedValue(client)

    const { runVideoPipeline } = await import('@/lib/video/pipeline')

    await expect(runVideoPipeline(GRANT_MATCH_ID)).rejects.toThrow()
  })
})
