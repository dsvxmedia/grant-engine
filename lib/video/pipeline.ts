import 'server-only'
import { put } from '@vercel/blob'
import { createServiceClient } from '@/lib/supabase/server'
import { generateVideoScript } from './script'
import { generateVoiceAudio } from './voice'
import { startHeyGenRender, pollHeyGenStatus } from './render'
import type { VideoInput, VideoResult } from './types'

const POLL_INTERVAL_MS = 30_000   // 30 seconds
const MAX_POLL_ATTEMPTS = 20       // 10 minutes max

// ─── Pipeline orchestrator ────────────────────────────────────────────────────

export async function runVideoPipeline(grantMatchId: string): Promise<VideoResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServiceClient()) as any

  // ── Step 1: Fetch grant_match ──────────────────────────────────────────────
  const { data: grantMatch, error: matchError } = await db
    .from('grant_matches')
    .select('*')
    .eq('id', grantMatchId)
    .maybeSingle()

  if (matchError) {
    console.error('[video/pipeline] Failed to fetch grant_match:', matchError)
    throw new Error(`[video/pipeline] DB error fetching grant_match: ${matchError.message}`)
  }

  if (!grantMatch) {
    throw new Error(`[video/pipeline] grant_match not found: ${grantMatchId}`)
  }

  // ── Step 2: Fetch grant, entity, founder_profile ───────────────────────────
  const { data: grant, error: grantError } = await db
    .from('grants')
    .select('*')
    .eq('id', grantMatch.grant_id)
    .maybeSingle()

  if (grantError || !grant) {
    throw new Error(`[video/pipeline] Failed to fetch grant: ${grantError?.message ?? 'not found'}`)
  }

  const { data: entity, error: entityError } = await db
    .from('business_entities')
    .select('*')
    .eq('id', grantMatch.entity_id)
    .maybeSingle()

  if (entityError || !entity) {
    throw new Error(`[video/pipeline] Failed to fetch entity: ${entityError?.message ?? 'not found'}`)
  }

  const { data: founderProfile } = await db
    .from('founder_profile')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Step 3: Insert video_submissions record ────────────────────────────────
  const { data: submission, error: insertError } = await db
    .from('video_submissions')
    .insert({
      grant_id: grant.id,
      grant_match_id: grantMatchId,
      entity_id: entity.id,
      render_status: 'pending',
      ai_disclosure_included: true,
    })
    .select()
    .single()

  if (insertError || !submission) {
    throw new Error(
      `[video/pipeline] Failed to insert video_submission: ${insertError?.message ?? 'unknown'}`
    )
  }

  const submissionId: string = submission.id

  try {
    // ── Step 4: Generate script ──────────────────────────────────────────────
    const videoInput: VideoInput = {
      grant: {
        title: grant.title,
        funder_name: grant.funder_name ?? null,
        description: grant.description ?? null,
        award_min: grant.award_min ?? null,
        award_max: grant.award_max ?? null,
        deadline: grant.deadline ?? null,
      },
      entity: {
        name: entity.name,
        mission: entity.mission ?? null,
        focus_area: entity.focus_area ?? null,
        who_we_serve: entity.who_we_serve ?? null,
      },
      founderName: founderProfile?.owner_name ?? null,
      founderStory: founderProfile?.origin_story ?? null,
      requestedAmount: null,
    }

    const script = await generateVideoScript(videoInput)

    // Store script_content
    await db
      .from('video_submissions')
      .update({ script_content: script.spokenText })
      .eq('id', submissionId)

    // ── Step 5: Generate voice audio → update status to rendering ────────────
    await db
      .from('video_submissions')
      .update({ render_status: 'rendering' })
      .eq('id', submissionId)

    const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'default'
    const audioUrl = await generateVoiceAudio(script.spokenText, voiceId)

    // ── Step 6: Start HeyGen render ──────────────────────────────────────────
    const avatarId = process.env.HEYGEN_AVATAR_ID ?? ''
    const heygenVideoId = await startHeyGenRender(audioUrl, avatarId)

    await db
      .from('video_submissions')
      .update({ heygen_video_id: heygenVideoId, voice_id: voiceId })
      .eq('id', submissionId)

    // ── Step 7: Poll for completion ──────────────────────────────────────────
    let finalVideoUrl: string | null = null
    let pollAttempts = 0

    while (pollAttempts < MAX_POLL_ATTEMPTS) {
      const { status, videoUrl } = await pollHeyGenStatus(heygenVideoId)

      if (status === 'completed' && videoUrl) {
        finalVideoUrl = videoUrl
        break
      }

      if (status === 'failed') {
        throw new Error('[video/pipeline] HeyGen render failed')
      }

      pollAttempts++
      if (pollAttempts < MAX_POLL_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      }
    }

    if (!finalVideoUrl) {
      throw new Error('[video/pipeline] HeyGen render timed out after max poll attempts')
    }

    // ── Step 8: Upload final video to Vercel Blob ────────────────────────────
    const videoResponse = await fetch(finalVideoUrl)
    if (!videoResponse.ok) {
      throw new Error('[video/pipeline] Failed to download completed video from HeyGen')
    }
    const videoBuffer = await videoResponse.arrayBuffer()

    const blob = await put(`videos/${submissionId}/pitch.mp4`, videoBuffer, { access: 'public' })

    // ── Step 9: Update submission to ready ───────────────────────────────────
    await db
      .from('video_submissions')
      .update({
        render_status: 'ready',
        video_url: blob.url,
        duration_seconds: script.totalDurationSeconds,
      })
      .eq('id', submissionId)

    // ── Step 10: Create notification ─────────────────────────────────────────
    await db.from('notifications').insert({
      type: 'video_ready',
      title: 'Video ready for review',
      body: grant.title,
    })

    return {
      jobId: submissionId,
      videoUrl: blob.url,
      status: 'ready',
    }
  } catch (err) {
    // On any error: mark submission as rejected and re-throw (best-effort, don't mask original error)
    try {
      await db
        .from('video_submissions')
        .update({ render_status: 'rejected' })
        .eq('id', submissionId)
    } catch {
      // ignore secondary failure
    }

    throw err
  }
}
