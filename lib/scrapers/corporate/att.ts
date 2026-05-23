import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'att',
    sourceUrl: 'https://about.att.com/csr/home/philanthropy.html',
    applicationUrl: 'https://about.att.com/csr/home/philanthropy.html',
    title: 'AT&T Believes — Digital Inclusion & Community Grants',
    description: 'AT&T Believes initiative funds nonprofits and social enterprises focused on digital inclusion, education, workforce development, and closing the digital divide in underserved communities.',
    funderName: 'AT&T Foundation',
    funderType: 'corporate',
    categoryTags: ['digital-inclusion', 'community', 'education', 'workforce', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'community-serving', 'social-enterprise'],
  },
  {
    source: 'att',
    sourceUrl: 'https://about.att.com/pages/career-intelligence.html',
    applicationUrl: 'https://about.att.com/csr/home/philanthropy.html',
    title: 'AT&T Future Ready — Workforce & STEM Education Grants',
    description: 'AT&T Future Ready grants fund organizations building STEM education, digital skills training, and workforce development programs that prepare people for technology careers.',
    funderName: 'AT&T',
    funderType: 'corporate',
    categoryTags: ['education', 'stem', 'workforce', 'technology', 'youth'],
    eligibilityTags: ['nonprofit', 'workforce-org', 'youth-serving'],
  },
]

export async function scrapeAtt(): Promise<RawGrant[]> {
  console.log(`[att] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
