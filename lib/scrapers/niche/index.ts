import { scrapeGrantwatch } from './grantwatch'
import { scrapeCandid } from './candid'
import { scrapeGoogleSearch } from './google-search'
import { scrapeHelloAlice } from './hello-alice'
import { scrapeOsvFellowships } from './osv-fellowships'
import { scrapeHelloSkip } from './helloskip'
import { scrapeGrantfind } from './grantfind'
import type { RawGrant } from '../types'

export async function scrapeNiche(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([
    scrapeGrantwatch(),
    scrapeCandid(),
    scrapeGoogleSearch(),
    scrapeHelloAlice(),
    scrapeOsvFellowships(),
    scrapeHelloSkip(),
    scrapeGrantfind(),
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
