import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

const BASE_URL = 'https://grantfind.io'

export async function scrapeGrantfind(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 })

    const items = await page.evaluate(() => {
      const results: Array<{
        title: string
        description: string
        url: string
        amount: string
        deadline: string
        funder: string
      }> = []

      const cards = Array.from(
        document.querySelectorAll(
          '[class*="grant"], [class*="Grant"], article, [class*="card"], [class*="Card"], li'
        )
      )

      const pool = cards.length > 3 ? cards : Array.from(document.querySelectorAll('a[href]'))

      for (const node of pool) {
        const titleEl = node.querySelector('h2, h3, h4, [class*="title"], [class*="name"]') ?? (node.tagName === 'A' ? node : null)
        const linkEl = (node.querySelector('a[href]') ?? (node.tagName === 'A' ? node : null)) as HTMLAnchorElement | null
        const descEl = node.querySelector('p, [class*="desc"], [class*="summary"]')
        const amountEl = node.querySelector('[class*="amount"], [class*="award"], [class*="fund"]')
        const deadlineEl = node.querySelector('[class*="deadline"], time, [class*="date"]')
        const funderEl = node.querySelector('[class*="funder"], [class*="org"], [class*="sponsor"]')

        const title = titleEl?.textContent?.trim() ?? ''
        if (!title || title.length < 5 || title.length > 200) continue

        results.push({
          title,
          description: descEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
          amount: amountEl?.textContent?.trim() ?? '',
          deadline: deadlineEl?.textContent?.trim() ?? '',
          funder: funderEl?.textContent?.trim() ?? '',
        })
      }
      return results
    })

    const unique = items
      .filter((item, i, arr) => arr.findIndex((x) => x.title === item.title) === i)
      .filter((item) => item.title.toLowerCase() !== 'grantfind')

    const grants: RawGrant[] = unique.length > 0
      ? unique.map((item) => ({
          source: 'grantfind',
          sourceUrl: item.url || BASE_URL,
          applicationUrl: item.url || BASE_URL,
          title: item.title,
          description: item.description || undefined,
          funderName: item.funder || 'GrantFind',
          funderType: 'niche' as const,
          categoryTags: ['small-business', 'aggregator'],
          eligibilityTags: ['small-business'],
        }))
      : [{
          source: 'grantfind',
          sourceUrl: BASE_URL,
          applicationUrl: BASE_URL,
          title: 'GrantFind — Grant Discovery Database',
          description: 'GrantFind aggregates grant opportunities across federal, state, foundation, and corporate sources for small businesses and nonprofits.',
          funderName: 'GrantFind',
          funderType: 'niche' as const,
          categoryTags: ['small-business', 'aggregator'],
          eligibilityTags: ['small-business'],
        }]

    console.log(`[grantfind] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[grantfind] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
