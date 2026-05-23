import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

const ALLSTATE_URL = 'https://www.allstatefoundation.org/grants/'

export async function scrapeAllstate(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(ALLSTATE_URL, { waitUntil: 'networkidle', timeout: 25000 })

    const items = await page.evaluate(() => {
      const results: Array<{ title: string; description: string; url: string }> = []
      const cards = Array.from(document.querySelectorAll(
        'article, .grant-card, .program-card, [class*="grant"], [class*="program"], .entry'
      ))
      for (const card of cards) {
        const titleEl = card.querySelector('h2, h3, h4, a')
        const linkEl = card.querySelector('a[href]') as HTMLAnchorElement | null
        const descEl = card.querySelector('p, .description, .excerpt')
        const title = titleEl?.textContent?.trim() ?? ''
        if (!title || title.length < 5) continue
        results.push({
          title,
          description: descEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
        })
      }
      return results
    })

    const grants: RawGrant[] = items.map((item) => ({
      source: 'allstate-foundation',
      sourceUrl: item.url || ALLSTATE_URL,
      applicationUrl: item.url || ALLSTATE_URL,
      title: item.title,
      description: item.description || undefined,
      funderName: 'Allstate Foundation',
      funderType: 'corporate',
      categoryTags: ['community', 'nonprofit', 'safety'],
      eligibilityTags: ['nonprofit'],
    }))

    // Always include the known Neighborhood Champions program
    const hasChampions = grants.some((g) =>
      g.title.toLowerCase().includes('champion')
    )
    if (!hasChampions) {
      grants.push({
        source: 'allstate-foundation',
        sourceUrl: ALLSTATE_URL,
        applicationUrl: 'https://www.allstatefoundation.org/grants/neighborhood-champions/',
        title: 'Allstate Foundation Neighborhood Champions Grant',
        description: 'Allstate Foundation Neighborhood Champions grants fund nonprofits that empower communities through safety, financial empowerment, and youth education programs.',
        funderName: 'Allstate Foundation',
        funderType: 'corporate',
        categoryTags: ['community', 'safety', 'education', 'financial-empowerment'],
        eligibilityTags: ['nonprofit', 'community-serving'],
      })
    }

    console.log(`[allstate] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[allstate] scrape failed:', err)
    // Return the known program as fallback
    return [{
      source: 'allstate-foundation',
      sourceUrl: ALLSTATE_URL,
      applicationUrl: ALLSTATE_URL,
      title: 'Allstate Foundation Neighborhood Champions Grant',
      description: 'Allstate Foundation Neighborhood Champions grants fund nonprofits and community organizations through safety, financial empowerment, and youth education programs.',
      funderName: 'Allstate Foundation',
      funderType: 'corporate',
      categoryTags: ['community', 'safety', 'education'],
      eligibilityTags: ['nonprofit', 'community-serving'],
    }]
  } finally {
    await browser?.close()
  }
}
