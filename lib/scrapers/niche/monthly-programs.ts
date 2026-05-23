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

  // ── ROLLING / MINORITY & TECH FOCUSED ────────────────────────────────────
  {
    required: true,
    source: 'monthly-programs',
    title: 'Google for Startups Black Founders Fund',
    description:
      'Up to $350,000 in equity-free funding for Black-founded tech companies across the US. Includes cloud credits, mentorship from Google engineers, and access to the Google for Startups network. For pre-seed through Series A companies building tech products.',
    funderName: 'Google for Startups',
    funderType: 'corporate',
    awardMax: 350000,
    sourceUrl: 'https://startup.google.com/programs/black-founders/',
    applicationUrl: 'https://startup.google.com/programs/black-founders/',
    eligibilityTags: ['african-american-owned', 'black-owned', 'tech', 'startup', 'founder'],
    categoryTags: ['rolling', 'tech', 'equity-free', 'black-founders'],
    requiresLoi: false,
    isNewProgram: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Comcast RISE Investment Fund',
    description:
      'Quarterly grant program providing $10,000+ in advertising, marketing production, and technology resources for minority-owned, Black-owned, women-owned, and veteran-owned small businesses. No repayment required. Technology makeover includes computer equipment, software, and internet upgrades.',
    funderName: 'Comcast',
    funderType: 'corporate',
    awardMin: 10000,
    awardMax: 25000,
    sourceUrl: 'https://www.comcastrise.com/',
    applicationUrl: 'https://www.comcastrise.com/apply/',
    eligibilityTags: ['minority-owned', 'african-american-owned', 'black-owned', 'small-business'],
    categoryTags: ['rolling', 'quarterly', 'marketing', 'tech-resources'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Visa Everywhere Initiative',
    description:
      '$100,000 grand prize for fintech and tech startups solving payment and commerce challenges. Open to startups at any stage. Top submissions get to pitch to Visa leadership. Also offers $50K second prize and $25K third prize.',
    funderName: 'Visa',
    funderType: 'corporate',
    awardMax: 100000,
    sourceUrl: 'https://usa.visa.com/run-your-business/visa-everywhere-initiative.html',
    applicationUrl: 'https://usa.visa.com/run-your-business/visa-everywhere-initiative.html',
    eligibilityTags: ['tech', 'startup', 'fintech', 'entrepreneur'],
    categoryTags: ['rolling', 'tech', 'fintech', 'pitch-competition'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'SBA Community Advantage Loans & Grants',
    description:
      'SBA-backed funding for underserved small businesses in low-to-moderate income communities. Includes grants from Community Development Financial Institutions (CDFIs) partnered with SBA. For businesses that cannot access traditional financing.',
    funderName: 'U.S. Small Business Administration',
    funderType: 'federal',
    awardMin: 5000,
    awardMax: 250000,
    sourceUrl: 'https://www.sba.gov/funding-programs/loans/small-business-community-advantage',
    applicationUrl: 'https://www.sba.gov/funding-programs/loans/small-business-community-advantage',
    eligibilityTags: ['small-business', 'underserved-community', 'minority-owned', 'community'],
    categoryTags: ['rolling', 'federal', 'community', 'cdfi'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'JPMorgan Chase Advancing Black Pathways',
    description:
      'Capital and business development resources for Black-owned businesses. Includes grants, affordable credit, and access to the JPMorgan Chase business network. Focus on Black entrepreneurs building scalable businesses in underserved communities.',
    funderName: 'JPMorgan Chase',
    funderType: 'corporate',
    awardMin: 5000,
    awardMax: 50000,
    sourceUrl: 'https://www.jpmorganchase.com/impact/people/advancing-black-pathways',
    applicationUrl: 'https://www.jpmorganchase.com/impact/people/advancing-black-pathways',
    eligibilityTags: ['african-american-owned', 'black-owned', 'small-business', 'underserved-community'],
    categoryTags: ['rolling', 'black-founders', 'community', 'corporate'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'National Minority Business Council Grant Program',
    description:
      'Grants and business development support for minority-owned small businesses. Provides direct financial assistance plus access to corporate procurement opportunities, mentorship, and educational programs for underrepresented entrepreneurs.',
    funderName: 'National Minority Business Council',
    funderType: 'niche',
    awardMin: 2500,
    awardMax: 25000,
    sourceUrl: 'https://www.nmbc.org',
    applicationUrl: 'https://www.nmbc.org',
    eligibilityTags: ['minority-owned', 'african-american-owned', 'small-business'],
    categoryTags: ['rolling', 'minority-business', 'community'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Wells Fargo Open for Business Fund',
    description:
      'Ongoing grant funding for small businesses in underserved communities recovering from economic challenges. Focus on Black-owned, minority-owned, and women-owned businesses. Grants administered through local CDFIs and nonprofits.',
    funderName: 'Wells Fargo',
    funderType: 'corporate',
    awardMin: 5000,
    awardMax: 100000,
    sourceUrl: 'https://www.wellsfargo.com/open-for-business-fund/',
    applicationUrl: 'https://www.wellsfargo.com/open-for-business-fund/',
    eligibilityTags: ['small-business', 'minority-owned', 'african-american-owned', 'underserved-community'],
    categoryTags: ['rolling', 'community', 'small-business', 'corporate'],
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
  {
    required: true,
    source: 'monthly-programs',
    title: 'Santander X Cultivate Small Business Grant',
    description:
      '$2,500–$20,000 for U.S. small businesses with a strong growth plan. Santander and Cultivate Small Business award multiple grants per cycle. Open to all industries; preference for businesses in underserved communities with demonstrated community impact.',
    funderName: 'Santander Bank / Cultivate Small Business',
    funderType: 'corporate',
    awardMin: 2500,
    awardMax: 20000,
    deadline: '2026-08-31T23:59:00.000Z',
    sourceUrl: 'https://www.santanderbank.com/us/about/corporate-responsibility/cultivate-small-business',
    applicationUrl: 'https://www.santanderbank.com/us/about/corporate-responsibility/cultivate-small-business',
    eligibilityTags: ['small-business', 'community', 'underserved-community', 'entrepreneur'],
    categoryTags: ['growth', 'community', 'small-business'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'FedEx Small Business Grant Contest',
    description:
      'Annual $25,000 grand prize grant for small businesses with big dreams. Open to U.S. small businesses with fewer than 99 employees and under $10M in annual revenue. Top prize includes $25,000 cash plus $1,000 in print/ship services. 2026 cycle open now.',
    funderName: 'FedEx',
    funderType: 'corporate',
    awardMin: 25000,
    awardMax: 50000,
    deadline: '2026-07-31T23:59:00.000Z',
    sourceUrl: 'https://smallbusiness.fedex.com/grant-contest.html',
    applicationUrl: 'https://smallbusiness.fedex.com/grant-contest.html',
    eligibilityTags: ['small-business', 'entrepreneur', 'under-99-employees'],
    categoryTags: ['growth', 'small-business', 'corporate'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Halstead Grant',
    description:
      '$7,500 cash grant plus $1,000 in silver products for emerging small businesses. Annual program supporting entrepreneurs with less than 5 years in business. Includes mentorship from industry professionals and business development resources.',
    funderName: 'Halstead',
    funderType: 'corporate',
    awardMax: 8500,
    deadline: '2026-08-15T23:59:00.000Z',
    sourceUrl: 'https://www.halstead.com/pages/halstead-grant',
    applicationUrl: 'https://www.halstead.com/pages/halstead-grant',
    eligibilityTags: ['small-business', 'entrepreneur', 'early-stage'],
    categoryTags: ['annual', 'small-business', 'growth'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'IFundWomen Universal Grant',
    description:
      'Rolling grant funding plus coaching for small business owners. IFundWomen partners with major brands to fund underrepresented entrepreneurs. Grants range from $500 to $50,000 depending on partnership program. Open applications reviewed monthly.',
    funderName: 'IFundWomen',
    funderType: 'foundation',
    awardMin: 500,
    awardMax: 50000,
    sourceUrl: 'https://ifundwomen.com/grants',
    applicationUrl: 'https://ifundwomen.com/grants',
    eligibilityTags: ['small-business', 'entrepreneur', 'underrepresented', 'minority-owned'],
    categoryTags: ['rolling', 'monthly', 'underrepresented', 'small-business'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'Tory Burch Foundation Small Business Grant',
    description:
      '$5,000 grant for small business owners who demonstrate entrepreneurial vision and community impact. Annual program selecting winners from a diverse pool of applicants. Includes access to the Tory Burch Foundation network and educational programming.',
    funderName: 'Tory Burch Foundation',
    funderType: 'foundation',
    awardMax: 5000,
    deadline: '2026-09-30T23:59:00.000Z',
    sourceUrl: 'https://www.toryburchfoundation.org/resources/grants/',
    applicationUrl: 'https://www.toryburchfoundation.org/resources/grants/',
    eligibilityTags: ['small-business', 'entrepreneur', 'community', 'underrepresented'],
    categoryTags: ['annual', 'small-business', 'community'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'NAACP Economic Growth Grant',
    description:
      'Grant funding for Black-owned businesses contributing to economic empowerment in their communities. Annual and rolling awards through NAACP branches and partner programs. Priority to businesses creating jobs in underserved communities.',
    funderName: 'NAACP',
    funderType: 'foundation',
    awardMin: 2500,
    awardMax: 25000,
    sourceUrl: 'https://naacp.org/economic-justice',
    applicationUrl: 'https://naacp.org/economic-justice',
    eligibilityTags: ['african-american-owned', 'black-owned', 'community', 'minority-owned'],
    categoryTags: ['rolling', 'community', 'black-founders', 'economic-empowerment'],
    requiresLoi: false,
  },
  {
    required: true,
    source: 'monthly-programs',
    title: 'T-Mobile Small Business Grant',
    description:
      '$10,000 grant for small businesses that demonstrate innovative use of technology and community impact. Part of T-Mobile\'s commitment to supporting underserved businesses. Quarterly selection process with rolling applications.',
    funderName: 'T-Mobile',
    funderType: 'corporate',
    awardMax: 10000,
    sourceUrl: 'https://www.t-mobile.com/business/small-business',
    applicationUrl: 'https://www.t-mobile.com/business/small-business',
    eligibilityTags: ['small-business', 'tech', 'entrepreneur', 'community'],
    categoryTags: ['rolling', 'tech', 'small-business', 'corporate'],
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
