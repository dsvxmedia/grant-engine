import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'amazon',
    sourceUrl: 'https://aws.amazon.com/activate/',
    applicationUrl: 'https://aws.amazon.com/activate/',
    title: 'AWS Activate — Startup Credits & Support',
    description: 'AWS Activate provides startups with up to $100,000 in AWS credits, technical support, and training to build and scale their businesses on AWS infrastructure.',
    funderName: 'Amazon Web Services',
    funderType: 'corporate',
    awardMax: 100000,
    categoryTags: ['technology', 'startup', 'cloud', 'credits'],
    eligibilityTags: ['startup', 'tech-company'],
  },
  {
    source: 'amazon',
    sourceUrl: 'https://www.amazon.com/b?ie=UTF8&node=17491959011',
    applicationUrl: 'https://sell.amazon.com/programs/black-business-accelerator',
    title: 'Amazon Black Business Accelerator',
    description: 'Amazon Black Business Accelerator provides Black-owned businesses with financial assistance, strategic business guidance, and educational resources to grow their business on Amazon.',
    funderName: 'Amazon',
    funderType: 'corporate',
    categoryTags: ['small-business', 'ecommerce', 'accelerator', 'diversity'],
    eligibilityTags: ['black-owned', 'small-business'],
  },
  {
    source: 'amazon',
    sourceUrl: 'https://www.amazon.com/gp/browse.html?node=17443634011',
    applicationUrl: 'https://www.amazon.com/gp/browse.html?node=17443634011',
    title: 'Amazon Launchpad — Small Business Grants',
    description: 'Amazon Launchpad supports innovative startups and small businesses with grants, marketing support, and access to millions of Amazon customers.',
    funderName: 'Amazon',
    funderType: 'corporate',
    categoryTags: ['startup', 'small-business', 'product', 'ecommerce'],
    eligibilityTags: ['small-business', 'startup'],
  },
]

export async function scrapeAmazon(): Promise<RawGrant[]> {
  console.log(`[amazon] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
