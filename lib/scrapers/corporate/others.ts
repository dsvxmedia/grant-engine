import type { RawGrant } from '../types'

// Batch file for well-documented corporate grant programs
export const OTHER_CORPORATE_PROGRAMS: RawGrant[] = [
  // Starbucks
  {
    source: 'starbucks',
    sourceUrl: 'https://stories.starbucks.com/stories/starbucks-social-impact/',
    applicationUrl: 'https://stories.starbucks.com/stories/starbucks-social-impact/',
    title: 'Starbucks Community Impact Grants',
    description: 'Starbucks funds nonprofits and community organizations tackling hunger relief, economic opportunity, and environmental sustainability, with emphasis on communities near Starbucks locations.',
    funderName: 'Starbucks Foundation',
    funderType: 'corporate',
    categoryTags: ['community', 'food-security', 'economic-development', 'sustainability', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'community-serving'],
  },
  // Capital One
  {
    source: 'capital-one',
    sourceUrl: 'https://www.capitalone.com/about/corporate-responsibility/',
    applicationUrl: 'https://www.capitalone.com/about/corporate-responsibility/community/',
    title: 'Capital One Future Edge — Small Business & Workforce Grants',
    description: 'Capital One Future Edge funds organizations expanding financial and digital literacy, workforce skills, and entrepreneurship for low-income and minority communities.',
    funderName: 'Capital One',
    funderType: 'corporate',
    categoryTags: ['financial-literacy', 'workforce', 'entrepreneurship', 'technology', 'community'],
    eligibilityTags: ['nonprofit', 'small-business', 'community-serving'],
  },
  // PayPal
  {
    source: 'paypal',
    sourceUrl: 'https://www.paypal.com/us/brc/article/paypal-small-business-grants',
    applicationUrl: 'https://www.paypal.com/us/brc/article/paypal-small-business-grants',
    title: 'PayPal Small Business Grants & Entrepreneur Accelerator',
    description: 'PayPal funds small business entrepreneurs through grants, low-cost credit, and the PayPal Bootcamp for Business. Special programs for Black-owned and minority-owned businesses through the Empowerment Fund.',
    funderName: 'PayPal',
    funderType: 'corporate',
    awardMax: 10000,
    categoryTags: ['small-business', 'entrepreneurship', 'financial-inclusion', 'ecommerce'],
    eligibilityTags: ['small-business', 'minority-owned', 'for-profit'],
  },
  // Shopify
  {
    source: 'shopify',
    sourceUrl: 'https://www.shopify.com/blog/build-black',
    applicationUrl: 'https://www.shopify.com/free-trial/build-black',
    title: 'Shopify Build Black — Grants for Black Entrepreneurs',
    description: 'Shopify Build Black provides cash grants, free Shopify subscriptions, and business education to Black entrepreneurs building ecommerce businesses.',
    funderName: 'Shopify',
    funderType: 'corporate',
    awardMax: 10000,
    categoryTags: ['entrepreneurship', 'ecommerce', 'technology', 'small-business'],
    eligibilityTags: ['small-business', 'entrepreneur', 'for-profit'],
  },
  // Intuit
  {
    source: 'intuit',
    sourceUrl: 'https://www.intuit.com/company/intuit-for-education/',
    applicationUrl: 'https://www.intuit.com/company/social-responsibility/',
    title: 'Intuit Prosperity Hub — Small Business Grants & Resources',
    description: 'Intuit funds nonprofits and community organizations expanding financial literacy, tax education, and small business development for low-income individuals and communities.',
    funderName: 'Intuit',
    funderType: 'corporate',
    categoryTags: ['financial-literacy', 'small-business', 'education', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'small-business', 'community-serving'],
  },
  // Coca-Cola
  {
    source: 'coca-cola-foundation',
    sourceUrl: 'https://www.coca-colacompany.com/social-impact/coca-cola-foundation',
    applicationUrl: 'https://www.coca-colacompany.com/social-impact/coca-cola-foundation',
    title: 'Coca-Cola Foundation — Community & Sustainability Grants',
    description: 'The Coca-Cola Foundation funds water stewardship, economic empowerment for women, community recycling, and active healthy living programs globally and in the US.',
    funderName: 'Coca-Cola Foundation',
    funderType: 'corporate',
    categoryTags: ['community', 'sustainability', 'economic-empowerment', 'health', 'youth'],
    eligibilityTags: ['nonprofit', 'community-serving'],
  },
  // Citi
  {
    source: 'citi-foundation',
    sourceUrl: 'https://www.citifoundation.com/philanthropy/',
    applicationUrl: 'https://www.citifoundation.com/philanthropy/initiatives/',
    title: 'Citi Foundation — Economic Progress & Community Grants',
    description: 'Citi Foundation invests in economic progress for low-income communities through grants to CDFIs, nonprofits, and social enterprises focused on financial inclusion, workforce, and small business development.',
    funderName: 'Citi Foundation',
    funderType: 'corporate',
    awardMax: 500000,
    categoryTags: ['economic-development', 'financial-inclusion', 'community', 'workforce', 'small-business'],
    eligibilityTags: ['nonprofit', 'cdfi', 'community-serving', 'social-enterprise'],
  },
  // Google.org (separate from the scraping Google.org scraper)
  {
    source: 'google-org',
    sourceUrl: 'https://www.google.org/',
    applicationUrl: 'https://www.google.org/impact-challenge/',
    title: 'Google.org Impact Challenge — AI & Technology for Good',
    description: 'Google.org Impact Challenge awards $15M+ in grants to nonprofits and social enterprises using AI and technology to address major social challenges. Challenge rounds open periodically for specific themes.',
    funderName: 'Google.org',
    funderType: 'corporate',
    awardMax: 2000000,
    categoryTags: ['technology', 'ai', 'social-impact', 'innovation', 'nonprofit'],
    eligibilityTags: ['nonprofit', 'social-enterprise', 'tech-company'],
  },
  // HubSpot
  {
    source: 'hubspot',
    sourceUrl: 'https://www.hubspot.com/startups',
    applicationUrl: 'https://www.hubspot.com/startups',
    title: 'HubSpot for Startups — Credits & Resources',
    description: 'HubSpot for Startups provides up to 90% off HubSpot software for qualifying startups, plus free training and resources for early-stage companies building their marketing and sales operations.',
    funderName: 'HubSpot',
    funderType: 'corporate',
    categoryTags: ['startup', 'technology', 'marketing', 'software', 'credits'],
    eligibilityTags: ['startup', 'for-profit'],
  },
  // Square / Block
  {
    source: 'square-block',
    sourceUrl: 'https://squareup.com/us/en/press/square-roots',
    applicationUrl: 'https://squareup.com/us/en/press/square-roots',
    title: 'Square (Block) — Square Roots Small Business Grants',
    description: 'Square and Block provide grants and tools to small business owners, with a focus on minority-owned businesses and entrepreneurs in underserved communities who use Square payments.',
    funderName: 'Block / Square',
    funderType: 'corporate',
    awardMax: 10000,
    categoryTags: ['small-business', 'payments', 'entrepreneurship', 'minority-owned'],
    eligibilityTags: ['small-business', 'for-profit', 'minority-owned'],
  },
]

export async function scrapeOtherCorporate(): Promise<RawGrant[]> {
  console.log(`[other-corporate] returning ${OTHER_CORPORATE_PROGRAMS.length} known programs`)
  return OTHER_CORPORATE_PROGRAMS
}
