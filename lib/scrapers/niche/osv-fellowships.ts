import type { RawGrant } from '../types'
import { loadChromium, type PlaywrightBrowser } from '../playwright-loader'

const OSV_URL = 'https://www.osv.llc/fellowships'

export async function scrapeOsvFellowships(): Promise<RawGrant[]> {
  let browser: PlaywrightBrowser | undefined
  try {
    const chromium = await loadChromium()
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(OSV_URL, { waitUntil: 'networkidle', timeout: 25000 })

    const items = await page.evaluate(() => {
      const results: Array<{ title: string; description: string; url: string; amount: string }> = []

      const selectors = [
        '[class*="fellowship"]', '[class*="grant"]', '[class*="program"]',
        'article', '.card', '[class*="card"]', 'section',
      ]
      let nodes: Element[] = []
      for (const sel of selectors) {
        nodes = Array.from(document.querySelectorAll(sel))
        if (nodes.length > 1) break
      }

      for (const node of nodes) {
        const titleEl = node.querySelector('h2, h3, h4, [class*="title"]')
        const linkEl = node.querySelector('a[href]') as HTMLAnchorElement | null
        const descEl = node.querySelector('p, [class*="description"], [class*="desc"]')
        const amountEl = node.querySelector('[class*="amount"], [class*="award"]')
        const title = titleEl?.textContent?.trim() ?? ''
        if (!title || title.length < 5) continue
        results.push({
          title,
          description: descEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
          amount: amountEl?.textContent?.trim() ?? '',
        })
      }
      return results
    })

    const grants: RawGrant[] = items.length > 0
      ? items.map((item) => ({
          source: 'osv-fellowships',
          sourceUrl: item.url || OSV_URL,
          applicationUrl: item.url || OSV_URL,
          title: item.title,
          description: item.description || undefined,
          funderName: 'OSV',
          funderType: 'foundation' as const,
          categoryTags: ['fellowship', 'entrepreneurship', 'innovation'],
          eligibilityTags: ['entrepreneur', 'innovator'],
        }))
      : [{
          source: 'osv-fellowships',
          sourceUrl: OSV_URL,
          applicationUrl: OSV_URL,
          title: 'OSV Fellowships — Entrepreneurship & Innovation Programs',
          description: 'OSV offers fellowships and funding for entrepreneurs, innovators, and changemakers building solutions to important problems.',
          funderName: 'OSV',
          funderType: 'foundation' as const,
          categoryTags: ['fellowship', 'entrepreneurship', 'innovation', 'startup'],
          eligibilityTags: ['entrepreneur', 'innovator', 'founder'],
        }]

    console.log(`[osv-fellowships] fetched ${grants.length} programs`)
    return grants
  } catch (err) {
    console.error('[osv-fellowships] scrape failed:', err)
    return []
  } finally {
    await browser?.close()
  }
}
