import { scrapeGeorgia } from './georgia'
import type { RawGrant } from '../types'

export async function scrapeStates(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([scrapeGeorgia()])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
