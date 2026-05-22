import type { RawGrant } from '../types'
import {
  loadChromium,
  type PlaywrightBrowser,
} from '../playwright-loader'

const GOOGLE_URL = 'https://www.google.org/our-work/'

type ExtractedItem = {
  title: string
  description?: string
  url?: string
}

export async function scrapeGoogle(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(GOOGLE_URL, { waitUntil: 'networkidle', timeout: 30000 })

    const items: ExtractedItem[] = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll(
          'article, .project-card, .work-item, [class*="project"], [class*="initiative"]'
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
      source: 'google-org',
      sourceUrl: item.url || GOOGLE_URL,
      title: item.title,
      description: item.description,
      funderName: 'Google.org',
      funderType: 'corporate',
    }))

    console.log(`[google-org] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[google-org] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
