import { scrapeGeorgia } from './georgia'
import { scrapeCalifornia } from './california'
import { scrapeLosAngeles } from './los-angeles'
import type { RawGrant } from '../types'

export async function scrapeStates(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([
    scrapeGeorgia(),
    scrapeCalifornia(),
    scrapeLosAngeles(),
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
