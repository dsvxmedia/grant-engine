import type { RawGrant } from '../types'
import {
  loadChromium,
  type PlaywrightBrowser,
} from '../playwright-loader'

const GATES_URL = 'https://www.gatesfoundation.org/about/committed-grants'

type ExtractedItem = {
  title: string
  description?: string
  url?: string
}

export async function scrapeGates(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(GATES_URL, { waitUntil: 'networkidle', timeout: 30000 })

    const items: ExtractedItem[] = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll(
          'article, .grant-card, .commitment-card, [class*="grant"], [class*="commitment"]'
        )
      )
      return nodes
        .map((node) => {
          const titleEl = node.querySelector('h2, h3, .title, a')
          const linkEl = node.querySelector('a') as HTMLAnchorElement | null
          const descEl = node.querySelector('p, .description, .summary')
          return {
            title: titleEl?.textContent?.trim() ?? '',
            description: descEl?.textContent?.trim() ?? '',
            url: linkEl?.href ?? '',
          }
        })
        .filter((item) => item.title.length > 0)
    })

    const grants: RawGrant[] = items.map((item) => ({
      source: 'gates-foundation',
      sourceUrl: item.url || GATES_URL,
      title: item.title,
      description: item.description,
      funderName: 'Bill & Melinda Gates Foundation',
      funderType: 'foundation',
    }))

    console.log(`[gates] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[gates] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
