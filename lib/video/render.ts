type HeyGenStatus = 'pending' | 'processing' | 'completed' | 'failed'

type OurStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Submits a HeyGen video generation job using a pre-generated audio URL
 * and a configured avatar. Returns the HeyGen video_id for polling.
 *
 * Throws on API failure — the pipeline orchestrator handles retries.
 */
export async function startHeyGenRender(
  audioUrl: string,
  avatarId: string
): Promise<string> {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey) {
    throw new Error('[render] HEYGEN_API_KEY is not set')
  }

  const response = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: 'avatar', avatar_id: avatarId },
          voice: { type: 'audio', audio_url: audioUrl },
        },
      ],
      dimension: { width: 1280, height: 720 },
      caption: true,
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(`[render] HeyGen generate API failed: ${message}`)
  }

  const json = (await response.json()) as { data?: { video_id?: string } }
  const videoId = json.data?.video_id
  if (!videoId) {
    throw new Error('[render] HeyGen response did not include video_id')
  }

  return videoId
}

/**
 * Polls the HeyGen video status endpoint for the given video_id.
 * Maps HeyGen statuses to our internal status enum.
 *
 * Throws on API failure — the pipeline orchestrator handles retries.
 */
export async function pollHeyGenStatus(videoId: string): Promise<{
  status: OurStatus
  videoUrl: string | null
}> {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey) {
    throw new Error('[render] HEYGEN_API_KEY is not set')
  }

  const response = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
    {
      headers: {
        'X-Api-Key': apiKey,
      },
    }
  )

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(`[render] HeyGen status API failed: ${message}`)
  }

  const json = (await response.json()) as {
    data?: { status?: HeyGenStatus; video_url?: string | null }
  }

  const heygenStatus = json.data?.status ?? 'pending'
  const videoUrl = json.data?.video_url ?? null

  // Map HeyGen status strings to our internal status
  const statusMap: Record<HeyGenStatus, OurStatus> = {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed',
  }

  const status: OurStatus = statusMap[heygenStatus] ?? 'pending'

  return { status, videoUrl }
}
