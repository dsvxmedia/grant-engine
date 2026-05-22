import { scrapeGrantwatch } from './grantwatch'
import { scrapeCandid } from './candid'
import type { RawGrant } from '../types'

export async function scrapeNiche(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([
    scrapeGrantwatch(),
    scrapeCandid(),
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
