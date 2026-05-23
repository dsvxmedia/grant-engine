import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'meta',
    sourceUrl: 'https://www.meta.com/impact/',
    applicationUrl: 'https://www.meta.com/impact/',
    title: 'Meta AI Impact Grant — Ray-Ban Meta Smart Glasses',
    description: 'Meta\'s AI Impact Grant funds organizations and entrepreneurs building real-world applications using Meta AI and Ray-Ban Meta Smart Glasses to create measurable social impact. Awards support innovative use cases in health, education, community, and accessibility.',
    funderName: 'Meta',
    funderType: 'corporate',
    categoryTags: ['technology', 'ai', 'innovation', 'social-impact', 'wearable-tech'],
    eligibilityTags: ['tech-company', 'startup', 'entrepreneur', 'innovator'],
  },
  {
    source: 'meta',
    sourceUrl: 'https://www.facebook.com/business/news/facebook-small-business-grants-program',
    applicationUrl: 'https://www.facebook.com/business/learn/meta-small-business-grants',
    title: 'Meta Small Business Grants Program',
    description: 'Meta (formerly Facebook) provides cash grants and advertising credits to small businesses that have been impacted or are looking to grow their digital presence. Program recurs with periodic application rounds.',
    funderName: 'Meta / Facebook',
    funderType: 'corporate',
    awardMax: 25000,
    categoryTags: ['small-business', 'digital-marketing', 'technology', 'entrepreneurship'],
    eligibilityTags: ['small-business', 'for-profit'],
  },
  {
    source: 'meta',
    sourceUrl: 'https://www.facebook.com/business/m/accelerator',
    applicationUrl: 'https://www.facebook.com/business/m/accelerator',
    title: 'Meta Community Accelerator — Diverse Small Business',
    description: 'Meta Community Accelerator provides $500K+ in grants and resources to small businesses led by diverse entrepreneurs, with focus on tech adoption, community building, and digital skills.',
    funderName: 'Meta',
    funderType: 'corporate',
    awardMax: 50000,
    categoryTags: ['small-business', 'diversity', 'technology', 'accelerator', 'community'],
    eligibilityTags: ['small-business', 'minority-owned', 'community-serving'],
  },
  {
    source: 'meta',
    sourceUrl: 'https://about.meta.com/metaverse/social-presence/',
    applicationUrl: 'https://about.meta.com/',
    title: 'Meta XR Innovation Grant — AR/VR Development',
    description: 'Meta funds developers and companies building innovative augmented reality and virtual reality experiences that create meaningful social impact, with special focus on education, accessibility, and community.',
    funderName: 'Meta',
    funderType: 'corporate',
    categoryTags: ['technology', 'ar-vr', 'innovation', 'education', 'accessibility'],
    eligibilityTags: ['tech-company', 'startup', 'developer'],
  },
]

export async function scrapeMeta(): Promise<RawGrant[]> {
  console.log(`[meta] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
