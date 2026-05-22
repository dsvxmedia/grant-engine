import { put } from '@vercel/blob'

/**
 * Generates voice audio for the given script text using the ElevenLabs API,
 * uploads the resulting MP3 to Vercel Blob, and returns the public blob URL.
 *
 * Throws on API failure — the pipeline orchestrator handles retries.
 */
export async function generateVoiceAudio(
  scriptText: string,
  voiceId: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('[voice] ELEVENLABS_API_KEY is not set')
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: scriptText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    }
  )

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(`[voice] ElevenLabs API failed: ${message}`)
  }

  const audioBuffer = await response.arrayBuffer()

  const blob = await put(
    `videos/audio-${Date.now()}.mp3`,
    audioBuffer,
    { access: 'public' }
  )

  return blob.url
}
