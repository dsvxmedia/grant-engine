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
  ])
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
