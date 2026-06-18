import { scrapeGrantwatch } from './grantwatch'
import { scrapeCandid } from './candid'
import { scrapeGoogleSearch } from './google-search'
import { scrapeHelloAlice } from './hello-alice'
import { scrapeOsvFellowships } from './osv-fellowships'
import { scrapeHelloSkip } from './helloskip'
import { scrapeGrantfind } from './grantfind'
import { scrapeMonthlyPrograms } from './monthly-programs'
import { scrapeMbda } from './mbda'
import { scrapePhilanthropyNewsDigest } from './philanthropy-news-digest'
import { scrapeNaacp } from './naacp'
import { scrapeSkysTheLimit } from './skysthelimit'
import { scrapeToryBurchFoundation } from './tory-burch-foundation'
import { scrapeDreamMakers } from './dream-makers'
import { scrapeFreedFellowship } from './freed-fellowship'
import { scrapeAtomicVc } from './atomic-vc'
import { scrapeKirabo } from './kirabo'
import { scrapeCamelback } from './camelback'
import { scrapeEchoingGreen } from './echoing-green'
import { scrapeDigitalUndivided } from './digitalundivided'
import { scrapeFoundersFirst } from './founders-first'
import { scrapeNea } from './nea'
import { scrapeCaliforniaArts } from './california-arts'
import { scrapeRwjf } from './rwjf'
import { scrapeLisc } from './lisc'
import { scrapeUrbanLeague } from './urban-league'
import { scrapeBlackEnterprise } from './black-enterprise'
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
    scrapeMonthlyPrograms(),
    scrapeMbda(),
    scrapePhilanthropyNewsDigest(),
    scrapeNaacp(),
    scrapeSkysTheLimit(),
    scrapeToryBurchFoundation(),
    scrapeDreamMakers(),
    scrapeFreedFellowship(),
    scrapeAtomicVc(),
    scrapeKirabo(),
    scrapeCamelback(),
    scrapeEchoingGreen(),
    scrapeDigitalUndivided(),
    scrapeFoundersFirst(),
    scrapeNea(),
    scrapeCaliforniaArts(),
    scrapeRwjf(),
    scrapeLisc(),
    scrapeUrbanLeague(),
    scrapeBlackEnterprise(),
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
