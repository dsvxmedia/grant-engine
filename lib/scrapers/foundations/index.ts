import { scrapeFord } from './ford'
import { scrapeGates } from './gates'
import { scrapeKellogg } from './kellogg'
import { scrapeKnightFoundation } from './knight'
import type { RawGrant } from '../types'

export async function scrapeFoundations(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([
    scrapeFord(),
    scrapeGates(),
    scrapeKellogg(),
    scrapeKnightFoundation(),
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
