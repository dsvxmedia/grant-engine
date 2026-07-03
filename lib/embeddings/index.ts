const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings'
const MODEL = 'text-embedding-3-small'
const MAX_BATCH = 2048
const MAX_CHARS = 8000 // ~2K tokens; grant descriptions stay well under this

export function isEmbeddingEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

/**
 * Returns one 1536-dim vector per input string, or null for the entire batch on failure.
 * Never throws — embedding is always best-effort.
 */
export async function embedBatch(texts: string[]): Promise<number[][] | null> {
  if (!isEmbeddingEnabled() || texts.length === 0) return null
  const input = texts.slice(0, MAX_BATCH).map((t) => t.slice(0, MAX_CHARS) || ' ')
  try {
    const res = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, input }),
    })
    if (!res.ok) {
      console.error('[embeddings] OpenAI error', res.status, await res.text())
      return null
    }
    const json = (await res.json()) as { data: { index: number; embedding: number[] }[] }
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
  } catch (err) {
    console.error('[embeddings] request failed', err)
    return null
  }
}

export async function embedText(text: string): Promise<number[] | null> {
  const result = await embedBatch([text])
  return result?.[0] ?? null
}

export function grantEmbeddingText(g: {
  title?: string | null
  funder_name?: string | null
  description?: string | null
}): string {
  return [g.title, g.funder_name, g.description].filter(Boolean).join('\n')
}

export function entityEmbeddingText(e: {
  mission?: string | null
  focus_area?: string | null
  grant_narrative?: string | null
}): string {
  return [e.mission, e.focus_area, e.grant_narrative].filter(Boolean).join('\n')
}
