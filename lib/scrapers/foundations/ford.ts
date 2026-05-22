import type { RawGrant } from '../types'
import {
  loadChromium,
  type PlaywrightBrowser,
} from '../playwright-loader'

const FORD_URL = 'https://www.fordfoundation.org/work/our-grants/'

type ExtractedItem = {
  title: string
  description?: string
  url?: string
}

export async function scrapeFord(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(FORD_URL, { waitUntil: 'networkidle', timeout: 30000 })

    const items: ExtractedItem[] = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll(
          'article, .grant-card, .grantee-card, [class*="grant"]'
        )
      )
      return nodes
        .map((node) => {
          const titleEl = node.querySelector('h2, h3, .title, a')
          const linkEl = node.querySelector('a') as HTMLAnchorElement | null
          const descEl = node.querySelector('p, .description, .excerpt')
          return {
            title: titleEl?.textContent?.trim() ?? '',
            description: descEl?.textContent?.trim() ?? '',
            url: linkEl?.href ?? '',
          }
        })
        .filter((item) => item.title.length > 0)
    })

    const grants: RawGrant[] = items.map((item) => ({
      source: 'ford-foundation',
      sourceUrl: item.url || FORD_URL,
      title: item.title,
      description: item.description,
      funderName: 'Ford Foundation',
      funderType: 'foundation',
    }))

    console.log(`[ford] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[ford] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
