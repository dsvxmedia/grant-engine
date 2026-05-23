import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

const FEDEX_URL = 'https://www.fedex.com/en-us/small-business/grant-contest.html'

export async function scrapeFedex(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(FEDEX_URL, { waitUntil: 'networkidle', timeout: 25000 })
    const bodyText = await page.evaluate(() => document.body.innerText)

    const isOpen = /apply|submit|enter|deadline|2026|open/i.test(bodyText)

    const grants: RawGrant[] = [{
      source: 'fedex',
      sourceUrl: FEDEX_URL,
      applicationUrl: FEDEX_URL,
      title: `FedEx Small Business Grant Contest${isOpen ? '' : ' (Check for Current Round)'}`,
      description: 'FedEx awards $50,000 in grants to small businesses annually through its Small Business Grant Contest. Businesses submit a short entry about their company and vote from the public determines finalists.',
      funderName: 'FedEx',
      funderType: 'corporate',
      awardMax: 50000,
      categoryTags: ['small-business', 'contest', 'entrepreneurship'],
      eligibilityTags: ['small-business', 'for-profit'],
    }]

    console.log(`[fedex] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[fedex] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
