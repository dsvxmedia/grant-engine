import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

// Comcast RISE — ongoing grants for diverse small businesses
const RISE_URL = 'https://www.xfinity.com/comcastrise'
const FALLBACK_URL = 'https://corporate.comcast.com/impact/comcast-rise'

export async function scrapeComcast(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    let loaded = false
    for (const url of [RISE_URL, FALLBACK_URL]) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 })
        loaded = true
        break
      } catch { continue }
    }
    if (!loaded) throw new Error('All URLs failed')

    const pageText = await page.evaluate(() => document.body.innerText)
    const hasGrant = /grant|award|funding|apply|application/i.test(pageText)

    const grants: RawGrant[] = hasGrant
      ? [{
          source: 'comcast-rise',
          sourceUrl: RISE_URL,
          applicationUrl: RISE_URL,
          title: 'Comcast RISE Grant Program',
          description: 'Comcast RISE (Representation, Investment, Strength, and Empowerment) provides grants and technology makeovers to small businesses owned by people of color, women, veterans, and LGBTQ+ individuals.',
          funderName: 'Comcast NBCUniversal',
          funderType: 'corporate',
          categoryTags: ['small-business', 'diversity', 'technology', 'community'],
          eligibilityTags: ['small-business', 'minority-owned', 'women-owned', 'veteran-owned', 'lgbtq-owned'],
        }]
      : []

    console.log(`[comcast-rise] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[comcast-rise] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
