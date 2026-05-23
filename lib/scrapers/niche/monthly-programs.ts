/**
 * Monthly & Recurring Grant Programs
 *
 * Curated list of well-known monthly, rolling, and recurring grant programs
 * that should always be in the pipeline. These are the most consistent
 * opportunities — they reset every month or cycle continuously.
 *
 * Strategy: hardcoded baseline so we always have them, plus a live fetch
 * for deadline/status verification where the sites allow it.
 */

import type { RawGrant } from '../types'

type KnownProgram = RawGrant & { required: true }

// These are always in the pipeline — no scraping required.
const KNOWN_MONTHLY_PROGRAMS: KnownProgram[] = [
  // ── MONTHLY ROTATING ──────────────────────────────────────────────────────
  {
    required: true,
    source: 'monthly-programs',
    title: 'Atomic Grant',
    description:
      'Monthly $1,500 micro-grant for entrepreneurs with a clear mission or project that needs a push. Rolling monthly applications. No equity taken.',
    funderName: 'Atomic',
    funderType: 'corporate',
    awardMax: 1500,
    sourceUrl: 'https://atomic.vc/grants',
    applicationUrl: 'https://atomic.vc/grants',
    eligibilityTags: ['entrepreneur', 'small-business', 'early-stage'],
    categoryTags: ['monthly', 'micro-grant', 'startup'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: "Sky's the Limit Startup Grant",
    description:
      'Monthly $2,500 grant for early-stage entrepreneurs who need support to launch or scale. Community of mentors included. Applications open monthly.',
    funderName: "Sky's the Limit",
    funderType: 'foundation',
    awardMin: 2500,
    awardMax: 2500,
    sourceUrl: 'https://www.skysthelimit.org',
    applicationUrl: 'https://www.skysthelimit.org/apply',
    eligibilityTags: ['early-stage', 'entrepreneur', 'startup'],
    categoryTags: ['monthly', 'startup', 'mentorship'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Freed Fellowship Grant',
    description:
      'Monthly $500 grant that also comes with mentorship to help small business owners level up. Designed for underrepresented entrepreneurs.',
    funderName: 'Freed Fellowship',
    funderType: 'foundation',
    awardMax: 500,
    sourceUrl: 'https://www.freedfellowship.com',
    applicationUrl: 'https://www.freedfellowship.com/apply',
    eligibilityTags: ['small-business', 'underrepresented', 'entrepreneur'],
    categoryTags: ['monthly', 'fellowship', 'mentorship', 'micro-grant'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Awesome Foundation Microgrant',
    description:
      'Monthly $1,000 no-strings-attached grants for awesome projects. Chapters worldwide. Each chapter runs its own monthly grant cycle. Tech, arts, community, social good.',
    funderName: 'Awesome Foundation',
    funderType: 'foundation',
    awardMax: 1000,
    sourceUrl: 'https://www.awesomefoundation.org',
    applicationUrl: 'https://www.awesomefoundation.org/en/submissions/new',
    eligibilityTags: ['open', 'community', 'tech', 'arts'],
    categoryTags: ['monthly', 'micro-grant', 'community'],
    requiresLoi: false,
  },

  // ── ROLLING / ALWAYS OPEN ─────────────────────────────────────────────────
  {
    required: true,
    source: 'monthly-programs',
    title: 'Kickstarter × Google Next Wave Fund',
    description:
      'Backed by Kickstarter and Google. Funds early-stage tech startups and small businesses building bold ideas across hardware, software, gaming, and connected technology. $10,000 award plus tools and visibility. Fewer than 20 FTE required.',
    funderName: 'Kickstarter / Google',
    funderType: 'corporate',
    awardMax: 10000,
    sourceUrl: 'https://www.kickstarter.com/blog/kickstarter-google-next-wave-fund',
    applicationUrl: 'https://www.kickstarter.com/blog/kickstarter-google-next-wave-fund',
    eligibilityTags: ['tech', 'startup', 'small-business', 'under-20-employees'],
    categoryTags: ['rolling', 'tech', 'startup', 'corporate'],
    requiresLoi: false,
    isNewProgram: true,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Hello Alice Small Business Growth Fund',
    description:
      'Rolling cycles throughout 2026. $5,000–$25,000 for for-profit U.S. small businesses under $1M in annual revenue with a clear growth plan.',
    funderName: 'Hello Alice',
    funderType: 'corporate',
    awardMin: 5000,
    awardMax: 25000,
    sourceUrl: 'https://helloalice.com/grants/',
    applicationUrl: 'https://helloalice.com/grants/small-business-growth-fund/',
    eligibilityTags: ['small-business', 'under-1m-revenue', 'for-profit'],
    categoryTags: ['rolling', 'small-business', 'growth'],
    requiresLoi: false,
  },

  // ── SPECIFIC 2026 PROGRAMS ─────────────────────────────────────────────────
  {
    required: true,
    source: 'monthly-programs',
    title: 'Dream Makers Founders Grant',
    description:
      '$25,000 grant for entrepreneurs and founders. Competitive program supporting business growth and community impact.',
    funderName: 'Dream Makers',
    funderType: 'foundation',
    awardMax: 25000,
    deadline: '2026-05-30T23:59:00.000Z',
    sourceUrl: 'https://www.dreammakersgrant.com',
    applicationUrl: 'https://www.dreammakersgrant.com/apply',
    eligibilityTags: ['entrepreneur', 'founder', 'small-business'],
    categoryTags: ['founder', 'growth'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Kirabo Grant',
    description:
      '$5,000 cash grant plus complimentary Kirabo membership and a business coaching session. Open to founders and small business owners from historically under-resourced communities and anyone facing systemic barriers to economic opportunity.',
    funderName: 'Kirabo',
    funderType: 'foundation',
    awardMax: 5000,
    deadline: '2026-06-28T23:59:00.000Z',
    sourceUrl: 'https://kirabo.co/grant',
    applicationUrl: 'https://kirabo.co/grant/apply',
    eligibilityTags: ['under-resourced-community', 'small-business', 'founder', 'systemic-barriers'],
    categoryTags: ['community', 'coaching', 'underrepresented'],
    requiresLoi: false,
  },
]

export async function scrapeMonthlyPrograms(): Promise<RawGrant[]> {
  // Return the known programs directly — these are curated and always valid
  // Future enhancement: attempt live scraping for deadline verification
  const grants = KNOWN_MONTHLY_PROGRAMS.map(({ required: _, ...g }) => g)
  console.log(`[monthly-programs] returning ${grants.length} known monthly/recurring grants`)
  return grants
}
