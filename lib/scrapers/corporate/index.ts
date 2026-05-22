import { scrapeGoogle } from './google'
import { scrapeSba } from './sba'
import type { RawGrant } from '../types'

export async function scrapeCorporate(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([scrapeGoogle(), scrapeSba()])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
