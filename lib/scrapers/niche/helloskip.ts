import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

const SKIP_URLS = [
  'https://helloskip.com/grants/',
  'https://helloskip.com/grants',
  'https://helloskip.com/',
]

export async function scrapeHelloSkip(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    let loaded = false
    for (const url of SKIP_URLS) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 })
        loaded = true
        break
      } catch { continue }
    }
    if (!loaded) throw new Error('All Skip URLs failed')

    const items = await page.evaluate(() => {
      const results: Array<{ title: string; description: string; url: string; amount: string; deadline: string }> = []

      const selectors = [
        '[class*="grant"]', '[class*="Grant"]', '[class*="opportunity"]',
        '[class*="card"]', '[class*="Card"]', 'article', 'li',
      ]

      let nodes: Element[] = []
      for (const sel of selectors) {
        const found = Array.from(document.querySelectorAll(sel))
        if (found.length > 3) { nodes = found; break }
      }

      for (const node of nodes) {
        const titleEl = node.querySelector('h2, h3, h4, [class*="title"], [class*="name"], a')
        const linkEl = node.querySelector('a[href]') as HTMLAnchorElement | null
        const descEl = node.querySelector('p, [class*="desc"], [class*="summary"]')
        const amountEl = node.querySelector('[class*="amount"], [class*="award"], [class*="prize"]')
        const deadlineEl = node.querySelector('[class*="deadline"], time, [class*="date"]')

        const title = titleEl?.textContent?.trim() ?? ''
        if (!title || title.length < 5 || title.length > 200) continue

        results.push({
          title,
          description: descEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
          amount: amountEl?.textContent?.trim() ?? '',
          deadline: deadlineEl?.textContent?.trim() ?? '',
        })
      }
      return results
    })

    const unique = items.filter((item, i, arr) =>
      arr.findIndex((x) => x.title === item.title) === i
    )

    const grants: RawGrant[] = unique.length > 0
      ? unique.map((item) => ({
          source: 'helloskip',
          sourceUrl: item.url || SKIP_URLS[0],
          applicationUrl: item.url || SKIP_URLS[0],
          title: item.title,
          description: item.description || undefined,
          funderName: 'Hello Skip',
          funderType: 'niche' as const,
          deadline: item.deadline || undefined,
          categoryTags: ['small-business', 'aggregator'],
          eligibilityTags: ['small-business'],
        }))
      : [{
          source: 'helloskip',
          sourceUrl: SKIP_URLS[0],
          applicationUrl: SKIP_URLS[0],
          title: 'Hello Skip — Small Business Grants & Resources',
          description: 'Hello Skip aggregates grants, loans, and resources for small businesses, with a curated database updated regularly.',
          funderName: 'Hello Skip',
          funderType: 'niche' as const,
          categoryTags: ['small-business', 'aggregator'],
          eligibilityTags: ['small-business'],
        }]

    console.log(`[helloskip] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[helloskip] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
