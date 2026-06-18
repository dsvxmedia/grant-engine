import { scrapeGoogle } from './google'
import { scrapeSba } from './sba'
import { scrapeComcast } from './comcast'
import { scrapeVerizon } from './verizon'
import { scrapeAllstate } from './allstate'
import { scrapeFedex } from './fedex'
import { scrapeWellsFargo } from './wellsfargo'
import { scrapeAmazon } from './amazon'
import { scrapeMastercard } from './mastercard'
import { scrapeWalmart } from './walmart'
import { scrapeBankOfAmerica } from './bankofamerica'
import { scrapeFamousAmos } from './famous-amos'
import { scrapeMeta } from './meta'
import { scrapeNike } from './nike'
import { scrapeMicrosoft } from './microsoft'
import { scrapeTmobile } from './tmobile'
import { scrapeAtt } from './att'
import { scrapeGoldmanSachs } from './goldmansachs'
import { scrapeJpmorgan } from './jpmorgan'
import { scrapeSalesforce } from './salesforce'
import { scrapeOtherCorporate } from './others'
import { scrapeVisa } from './visa'
import { scrapeSantander } from './santander'
import { scrapeGoogleBlackFounders } from './google-black-founders'
import { scrapeJPMorganBlackPathways } from './jpmorgan-black-pathways'
import type { RawGrant } from '../types'

export async function scrapeCorporate(): Promise<RawGrant[]> {
  const results = await Promise.allSettled([
    scrapeGoogle(),
    scrapeSba(),
    scrapeComcast(),
    scrapeVerizon(),
    scrapeAllstate(),
    scrapeFedex(),
    scrapeWellsFargo(),
    scrapeAmazon(),
    scrapeMastercard(),
    scrapeWalmart(),
    scrapeBankOfAmerica(),
    scrapeFamousAmos(),
    scrapeMeta(),
    scrapeNike(),
    scrapeMicrosoft(),
    scrapeTmobile(),
    scrapeAtt(),
    scrapeGoldmanSachs(),
    scrapeJpmorgan(),
    scrapeSalesforce(),
    scrapeOtherCorporate(),
    scrapeVisa(),
    scrapeSantander(),
    scrapeGoogleBlackFounders(),
    scrapeJPMorganBlackPathways(),
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
