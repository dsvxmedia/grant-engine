import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

const IFW_URL = 'https://ifundwomen.com/grants'

export async function scrapeIFundWomen(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(IFW_URL, { waitUntil: 'networkidle', timeout: 25000 })

    const items = await page.evaluate(() => {
      const results: Array<{ title: string; description: string; url: string }> = []
      const selectors = [
        '[class*="grant-card"]', '[class*="GrantCard"]', '[class*="opportunity"]',
        'article', '[class*="card"]',
      ]
      let nodes: Element[] = []
      for (const sel of selectors) {
        nodes = Array.from(document.querySelectorAll(sel))
        if (nodes.length > 2) break
      }
      for (const node of nodes) {
        const titleEl = node.querySelector('h2, h3, h4, [class*="title"], a')
        const linkEl = node.querySelector('a[href]') as HTMLAnchorElement | null
        const descEl = node.querySelector('p, [class*="desc"]')
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

    const grants: RawGrant[] = items.length > 0
      ? items.map((item) => ({
          source: 'ifundwomen',
          sourceUrl: item.url || IFW_URL,
          applicationUrl: item.url || IFW_URL,
          title: item.title,
          description: item.description || undefined,
          funderName: 'IFundWomen',
          funderType: 'niche' as const,
          categoryTags: ['women-owned', 'small-business', 'entrepreneurship'],
          eligibilityTags: ['women-owned', 'small-business'],
        }))
      : [{
          source: 'ifundwomen',
          sourceUrl: IFW_URL,
          applicationUrl: IFW_URL,
          title: 'IFundWomen — Grants for Women-Owned Businesses',
          description: 'IFundWomen connects women entrepreneurs with grants, coaching, and resources. Partners include Google, Walmart, and other corporate sponsors funding women-owned small businesses.',
          funderName: 'IFundWomen',
          funderType: 'niche' as const,
          categoryTags: ['women-owned', 'small-business', 'entrepreneurship'],
          eligibilityTags: ['women-owned', 'small-business'],
        }]

    console.log(`[ifundwomen] fetched ${grants.length} grants`)
    return grants
  } catch (err) {
    console.error('[ifundwomen] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
