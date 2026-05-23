import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

// Hello Alice is one of the biggest small business grant aggregators
const HELLO_ALICE_URL = 'https://helloalice.com/grants/'
const FALLBACK_URLS = [
  'https://helloalice.com/resources/category/grants/',
  'https://helloalice.com/grants',
]

export async function scrapeHelloAlice(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    let loaded = false
    for (const url of [HELLO_ALICE_URL, ...FALLBACK_URLS]) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        loaded = true
        break
      } catch {
        continue
      }
    }
    if (!loaded) return []

    const items = await page.evaluate(() => {
      const results: Array<{
        title: string
        description: string
        url: string
        deadline: string
        amount: string
      }> = []

      const selectors = [
        '[class*="grant-card"]',
        '[class*="GrantCard"]',
        '[class*="opportunity-card"]',
        '[class*="resource-card"]',
        'article',
        '[class*="card"]',
      ]

      let nodes: Element[] = []
      for (const sel of selectors) {
        nodes = Array.from(document.querySelectorAll(sel))
        if (nodes.length > 2) break
      }

      for (const node of nodes) {
        const titleEl = node.querySelector('h2, h3, h4, [class*="title"], a')
        const linkEl = node.querySelector('a[href]') as HTMLAnchorElement | null
        const descEl = node.querySelector('p, [class*="description"], [class*="desc"]')
        const deadlineEl = node.querySelector('[class*="deadline"], [class*="date"], time')
        const amountEl = node.querySelector('[class*="amount"], [class*="award"], [class*="prize"]')

        const title = titleEl?.textContent?.trim() ?? ''
        if (!title || title.length < 5) continue

        results.push({
          title,
          description: descEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
          deadline: deadlineEl?.textContent?.trim() ?? '',
          amount: amountEl?.textContent?.trim() ?? '',
        })
      }
      return results
    })

    const grants: RawGrant[] = items.map((item) => ({
      source: 'hello-alice',
      sourceUrl: item.url || HELLO_ALICE_URL,
      applicationUrl: item.url || HELLO_ALICE_URL,
      title: item.title,
      description: item.description || undefined,
      funderName: 'Hello Alice',
      funderType: 'niche',
      deadline: item.deadline || undefined,
      categoryTags: ['small-business', 'aggregator'],
      eligibilityTags: ['small-business'],
    }))

    console.log(`[hello-alice] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[hello-alice] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
