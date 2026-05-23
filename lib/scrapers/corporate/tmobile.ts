import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 't-mobile',
    sourceUrl: 'https://www.t-mobile.com/home/hometown',
    applicationUrl: 'https://hometowngrant.t-mobile.com/',
    title: 'T-Mobile Hometown Grants — Small Business & Community',
    description: 'T-Mobile Hometown Grants award $50,000 to small businesses and nonprofits in small towns and rural areas working to strengthen their local economy, connectivity, and community vitality.',
    funderName: 'T-Mobile',
    funderType: 'corporate',
    awardMax: 50000,
    categoryTags: ['community', 'small-business', 'rural', 'connectivity', 'economic-development'],
    eligibilityTags: ['small-business', 'nonprofit', 'community-serving'],
  },
  {
    source: 't-mobile',
    sourceUrl: 'https://newsroom.t-mobile.com/news-and-blogs/t-mobile-connecting-heroes.htm',
    applicationUrl: 'https://www.t-mobile.com/home/connecting-heroes',
    title: 'T-Mobile Connecting Heroes — Nonprofit & Community Grants',
    description: 'T-Mobile Connecting Heroes and community grants support nonprofits focused on first responders, digital equity, youth education, and underserved communities.',
    funderName: 'T-Mobile',
    funderType: 'corporate',
    categoryTags: ['community', 'digital-equity', 'youth', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'community-serving'],
  },
]

export async function scrapeTmobile(): Promise<RawGrant[]> {
  console.log(`[t-mobile] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
