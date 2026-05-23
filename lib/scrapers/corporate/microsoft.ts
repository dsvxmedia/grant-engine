import type { RawGrant } from '../types'

const PROGRAMS: RawGrant[] = [
  {
    source: 'microsoft',
    sourceUrl: 'https://www.microsoft.com/en-us/startups',
    applicationUrl: 'https://www.microsoft.com/en-us/startups',
    title: 'Microsoft for Startups Founders Hub — Credits & Support',
    description: 'Microsoft for Startups Founders Hub provides up to $150,000 in Azure cloud credits, GitHub, Microsoft 365, and LinkedIn Premium access plus technical mentorship for startups building with AI or cloud technology.',
    funderName: 'Microsoft',
    funderType: 'corporate',
    awardMax: 150000,
    categoryTags: ['technology', 'startup', 'ai', 'cloud', 'credits'],
    eligibilityTags: ['startup', 'tech-company'],
  },
  {
    source: 'microsoft',
    sourceUrl: 'https://www.microsoft.com/en-us/corporate-responsibility/philanthropies',
    applicationUrl: 'https://www.microsoft.com/en-us/corporate-responsibility/philanthropies/grants',
    title: 'Microsoft Philanthropies — Nonprofit Technology Grants',
    description: 'Microsoft Philanthropies provides software donations, cloud services, and cash grants to nonprofits and social enterprises using technology to drive social impact. Focus on digital skills, accessibility, and economic opportunity.',
    funderName: 'Microsoft Philanthropies',
    funderType: 'corporate',
    categoryTags: ['nonprofit', 'technology', 'digital-skills', 'accessibility', 'education'],
    eligibilityTags: ['nonprofit', 'social-enterprise', 'community-serving'],
  },
  {
    source: 'microsoft',
    sourceUrl: 'https://www.microsoft.com/en-us/ai/ai-for-good',
    applicationUrl: 'https://www.microsoft.com/en-us/ai/ai-for-good',
    title: 'Microsoft AI for Good — Research & Impact Grants',
    description: 'Microsoft AI for Good program funds organizations using artificial intelligence to solve humanitarian challenges in health, sustainability, accessibility, and cultural heritage. Includes Azure credits and technical support.',
    funderName: 'Microsoft',
    funderType: 'corporate',
    categoryTags: ['technology', 'ai', 'social-impact', 'research', 'health', 'sustainability'],
    eligibilityTags: ['nonprofit', 'research-org', 'tech-company', 'social-enterprise'],
  },
]

export async function scrapeMicrosoft(): Promise<RawGrant[]> {
  console.log(`[microsoft] returning ${PROGRAMS.length} known programs`)
  return PROGRAMS
}
