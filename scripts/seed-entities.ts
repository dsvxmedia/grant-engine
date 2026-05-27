/**
 * Seed script — The Louest Company entity portfolio
 * Run: npx dotenv -e .env.local -- npx tsx scripts/seed-entities.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Location ─────────────────────────────────────────────────────────────────
// TODO: Update city/state if different
const CITY = 'Birmingham'
const STATE = 'AL'

// ── Entities ──────────────────────────────────────────────────────────────────

const entities = [
  // 1. FlowTech Ventures — primary tech holding arm
  {
    name: 'FlowTech Ventures',
    type: 'parent',
    industry: 'Technology Systems / Business Modernization',
    state: STATE,
    city: CITY,
    mission:
      'To build, deploy, and scale modular technology systems that help organizations modernize, organize, and grow through a portfolio of interconnected products, subsidiaries, and ecosystem applications.',
    focus_area: 'Technology Innovation and Systems',
    who_we_serve: ['SMBs', 'Healthcare organizations', 'Growth-stage companies', 'Underserved communities'],
    is_african_american_owned: true,
    is_minority_owned: true,
    is_underserved_community_tied: true,
    is_tech_company: true,
    is_social_enterprise: false,
    is_community_serving: false,
    category_tags: ['technology', 'innovation', 'systems', 'business-modernization'],
  },

  // 2. The Clearstate System — flagship systems company
  {
    name: 'The Clearstate System',
    type: 'subsidiary',
    industry: 'Business Systems / Operational Ecosystems',
    state: STATE,
    city: CITY,
    mission:
      'To create interconnected systems that improve operational continuity, communication, opportunity capture, workflow organization, revenue performance, organizational clarity, business intelligence, and scalable growth enablement.',
    focus_area: 'Systems and Ecosystem Design for SMBs',
    who_we_serve: [
      'Small and medium-sized businesses',
      'Healthcare organizations',
      'Professional services firms',
      'Growth-stage companies',
      'Property management firms',
    ],
    is_african_american_owned: true,
    is_minority_owned: true,
    is_underserved_community_tied: false,
    is_tech_company: true,
    is_social_enterprise: false,
    is_community_serving: false,
    category_tags: ['technology', 'business-modernization', 'systems', 'operational-intelligence', 'ecosystem-design'],
  },

  // 3. SALUS — healthcare ecosystem
  {
    name: 'SALUS',
    type: 'subsidiary',
    industry: 'Healthcare Technology / Patient Communication',
    state: STATE,
    city: CITY,
    mission:
      'To improve the operational and communication infrastructure of healthcare organizations through intelligent systems that strengthen provider-patient relationships, improve health outcomes, and reduce administrative friction.',
    focus_area: 'Healthcare Systems and Patient Communication',
    who_we_serve: [
      'Private healthcare practices',
      'Community health clinics',
      'Specialty medical groups',
      'Health-focused nonprofits',
      'Behavioral health organizations',
      'Dental practices',
      'Mental health clinics',
    ],
    is_african_american_owned: true,
    is_minority_owned: true,
    is_underserved_community_tied: true,
    is_tech_company: true,
    is_social_enterprise: false,
    is_community_serving: true,
    category_tags: ['health-technology', 'patient-communication', 'clinic-intelligence', 'health-equity', 'community-health'],
  },

  // 4. BetterU Labs — education and workforce development
  {
    name: 'BetterU Labs',
    type: 'subsidiary',
    industry: 'Education / Workforce Development',
    state: STATE,
    city: CITY,
    mission:
      'To make transformative education and development resources accessible to individuals who have been underserved by traditional educational and professional development systems — giving them the practical tools, skills, and mindsets required to build careers and businesses that generate lasting wealth and impact.',
    focus_area: 'Education, Workforce Development, and Youth Empowerment',
    who_we_serve: [
      'Youth ages 16-25',
      'First-generation professionals',
      'Underrepresented entrepreneurs',
      'Career-changers seeking practical reskilling',
      'Organizations investing in workforce development',
    ],
    is_african_american_owned: true,
    is_minority_owned: true,
    is_underserved_community_tied: true,
    is_tech_company: false,
    is_social_enterprise: true,
    is_community_serving: true,
    category_tags: ['education', 'workforce-development', 'youth-empowerment', 'entrepreneurship-education', 'economic-mobility'],
  },

  // 5. Phoenix House Pictures — film and content production
  {
    name: 'Phoenix House Pictures',
    type: 'subsidiary',
    industry: 'Film / Content Production / Media',
    state: STATE,
    city: CITY,
    mission:
      'To produce compelling visual narratives that reflect the culture, values, and vision of The Louest Company — telling stories that matter through film, documentary, brand content, and narrative media.',
    focus_area: 'Film, Documentary, and Brand Storytelling',
    who_we_serve: [
      'Independent film audiences',
      'Brands and organizations seeking visual storytelling',
      'Cultural and creative communities',
    ],
    is_african_american_owned: true,
    is_minority_owned: true,
    is_underserved_community_tied: false,
    is_tech_company: false,
    is_social_enterprise: false,
    is_community_serving: false,
    category_tags: ['arts', 'film', 'media', 'cultural-production', 'creative-economy', 'documentary'],
  },

  // 6. Sounds of the City Entertainment — music and culture
  {
    name: 'Sounds of the City Entertainment',
    type: 'subsidiary',
    industry: 'Music / Entertainment / Creative Economy',
    state: STATE,
    city: CITY,
    mission:
      'To create, own, and distribute music and cultural content that gives voice to the lived experiences, ambitions, and aesthetics of The Louest Company ecosystem — while building a sustainable, owned music business through catalog development, sync licensing, and artist development.',
    focus_area: 'Music Catalog, Sync Licensing, and Cultural Production',
    who_we_serve: [
      'Music audiences',
      'Film and media production companies',
      'Brands seeking music licensing',
      'Creative entrepreneurs',
    ],
    is_african_american_owned: true,
    is_minority_owned: true,
    is_underserved_community_tied: false,
    is_tech_company: false,
    is_social_enterprise: false,
    is_community_serving: false,
    category_tags: ['music', 'arts', 'creative-economy', 'sync-licensing', 'cultural-production', 'entertainment'],
  },
]

// ── Founder profile ───────────────────────────────────────────────────────────

const founderProfile = {
  owner_name: 'D Jackson',
  origin_story: `D Jackson is an ecosystem architect, founder, and builder operating at the intersection of technology, culture, creativity, and ownership.

After years of working inside businesses and watching operational dysfunction cost organizations their potential — fragmented tools, broken workflows, missed opportunities, and disconnected systems — Jackson built The Clearstate System to solve the problem at the root level. Not with another app. With an operational ecosystem.

The central insight behind TCS is what Jackson calls the Operational Genome Theory: every business has a core operational DNA, just like biological organisms. Most businesses are operating with a broken or dormant genome — systems that aren't communicating, workflows that are mutating into chaos, and processes that were built for a version of the company that no longer exists. TCS maps, decodes, and rebuilds that genome for performance.

Jackson built FlowTech Ventures as the holding architecture for this work — a portfolio of interconnected systems companies, each solving a specific operational problem across technology, healthcare, education, media, and culture. The goal is permanence. Not exits. Not one-and-done products. Interconnected systems that get stronger over time.

The Grant Engine itself is one of those systems — built to fund the others.`,
  personal_community_ties:
    'Founded and operates businesses focused on serving underrepresented entrepreneurs, small businesses, and communities that have been underserved by traditional technology and capital systems.',
  why_i_started: {
    'The Clearstate System':
      'Watched too many businesses — particularly small and growing companies — fail not from lack of effort or vision, but from operational dysfunction. Fragmented tools. Broken workflows. Systems that fought each other instead of working together. TCS was built to fix that at the source.',
    'BetterU Labs':
      'Education and development resources are not equally distributed. The people who need practical, high-impact development the most are often the furthest from it. BetterU Labs exists to close that gap.',
    'SALUS':
      'Healthcare organizations are drowning in administrative friction and communication gaps that hurt both staff and patients. The operational genome approach — applied to healthcare — creates systems that let providers focus on care rather than paperwork.',
  },
}

// ── Pre-written grant narratives (from grant_narratives.yaml) ─────────────────
// These are the filing-ready narrative foundations the writing pipeline uses
// for every grant application. They encode the entity's voice, positioning,
// and core story. The pipeline builds around them — never over them.

const narratives: Record<string, string> = {
  'FlowTech Ventures': `FlowTech Ventures is a technology systems and innovation company focused on designing and deploying intelligent business systems, operational ecosystems, and technology infrastructure for small and medium-sized businesses and organizations across multiple sectors.

Founded by D Jackson, FlowTech Ventures builds modular technology systems that help organizations modernize, organize, and scale through a portfolio of interconnected products and subsidiaries.

Current priorities include The Clearstate System — a business modernization and systems ecosystem platform — SALUS, a healthcare communication and operational intelligence system, Synq, a consumer technology product in development, and BetterU Labs, an education and workforce development organization.

FlowTech Ventures represents a systems-forward, innovation-driven approach to business modernization with a strong focus on underserved markets and communities. The company's portfolio is designed to create interconnected impact across technology, healthcare, education, and creative industries — building systems that improve how organizations operate at every level.`,

  'The Clearstate System': `The Clearstate System is a systems and ecosystem company focused on designing, building, implementing, and optimizing intelligent business systems and operational ecosystems that help organizations grow, organize, modernize, and perform more effectively.

TCS creates interconnected operational environments where technology, communication, workflows, intelligence, growth, and continuity work together — replacing fragmented tools and disconnected processes with fully integrated business ecosystems.

The Clearstate System operates from a foundational philosophy it calls the Operational Genome Theory — the idea that every business has a core operational DNA, just like biological organisms. TCS maps, decodes, and optimizes that genome — identifying which systems are thriving, which are dormant, and which are mutating in ways that hurt performance. The result is a business that operates at full performance, not just functional baseline.

Current products and systems include Front Desk (communication ecosystem), Form & Lifecycle Operations (workflow ecosystem), Revenue Expansion & Acquisition Hub (growth ecosystem), REVOLVE (retention ecosystem), Property Logistics & Operations Technology (property ecosystem), SALUS (healthcare ecosystem), and C.O.R.E. (large-scale ecosystem architecture layer).

TCS serves small and medium-sized businesses, healthcare organizations, professional services firms, and growth-stage companies seeking to modernize their operational infrastructure and build systems that scale.`,

  'BetterU Labs': `BetterU Labs is an education and personal development company focused on providing accessible, practical, and high-impact learning experiences for individuals and organizations committed to growth, skill development, and career advancement.

The organization develops programs, courses, coaching models, and digital learning tools that help individuals — particularly young people and underrepresented professionals — access the knowledge and systems they need to build sustainable, prosperous careers and businesses.

BetterU Labs operates from the belief that transformative education should not be a privilege. The organization makes practical, actionable, and systems-based education accessible to those who have been underserved by traditional educational and professional development institutions — equipping them with the tools to build wealth, create opportunity, and establish lasting careers and businesses.

Programming includes youth-focused entrepreneurship and financial literacy programs, one-on-one and group coaching, self-paced digital courses, and organizational workshop facilitation. BetterU Labs measures success in outcomes: careers started, businesses launched, skills acquired, and economic mobility achieved.`,

  'SALUS': `SALUS is a healthcare ecosystem focused on patient communication, patient education, operational support, and clinic intelligence for healthcare organizations.

SALUS designs systems that improve the connection between healthcare providers and their patients — streamlining communication, improving health literacy, and strengthening the operational infrastructure of clinics, practices, and health-focused organizations.

The SALUS platform addresses a persistent and damaging gap in healthcare delivery: the breakdown between clinical care and the communication and operational systems that surround it. When patients don't understand their treatment, don't receive timely follow-up, and when clinics operate with fragmented administrative systems, outcomes suffer. SALUS repairs those gaps with purpose-built, intelligent systems designed specifically for the healthcare environment.

SALUS operates as a subsidiary of The Clearstate System within the FlowTech Ventures portfolio, applying the TCS Operational Genome Theory to healthcare organizations — identifying where operational DNA is breaking down and rebuilding it for performance and patient-centered care.

SALUS serves private healthcare practices, community health clinics, specialty medical groups, behavioral health organizations, and health-focused nonprofits.`,

  'Phoenix House Pictures': `Phoenix House Pictures is a film and content production company focused on developing and producing narrative media, documentary, brand storytelling, and cultural content.

The company develops visual content that reflects diverse cultural perspectives, amplifies underrepresented voices, and tells stories that matter — through film, documentary, and digital media.

Phoenix House Pictures operates at the intersection of creative excellence and community impact, using the power of visual storytelling to document journeys, explore ideas, and build the kind of media that changes how audiences understand themselves and the world around them.

Phoenix House Pictures operates as the visual storytelling arm of The Louest Company ecosystem.`,

  'Sounds of the City Entertainment': `Sounds of the City Entertainment is a music and culture company focused on catalog development, sync licensing, cultural production, and creative economy entrepreneurship.

The company creates, owns, and distributes original music that captures the cultural voice, aesthetic identity, and lived experiences of The Louest Company ecosystem — while building a sustainable, owned music business through catalog development, sync licensing, and creative industry partnerships.

Sounds of the City Entertainment operates at the intersection of music, culture, and business — treating the music catalog as a long-term asset, sync licensing as a scalable revenue model, and cultural production as a form of community impact. The company represents creative economy entrepreneurship at its most intentional: art that builds equity.`,
}

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding The Louest Company entities...\n')

  // Check existing entities
  const { data: existing } = await supabase.from('business_entities').select('name')
  const existingNames = new Set((existing ?? []).map((e: { name: string }) => e.name))
  console.log(`Existing entities: ${existingNames.size > 0 ? [...existingNames].join(', ') : 'none'}`)

  // Upsert entities
  let created = 0
  let updated = 0

  for (const entity of entities) {
    const { error } = await supabase
      .from('business_entities')
      .upsert(entity, { onConflict: 'name' })

    if (error) {
      console.error(`  ✗ ${entity.name}:`, error.message)
    } else {
      if (existingNames.has(entity.name)) {
        console.log(`  ↺ Updated: ${entity.name}`)
        updated++
      } else {
        console.log(`  + Created: ${entity.name}`)
        created++
      }
    }
  }

  // Populate grant_narrative for each entity
  console.log('\nPopulating grant narratives...')
  for (const [entityName, narrative] of Object.entries(narratives)) {
    const { error } = await supabase
      .from('business_entities')
      .update({ grant_narrative: narrative.trim() })
      .eq('name', entityName)
    if (error) {
      console.error(`  ✗ Narrative for ${entityName}:`, error.message)
    } else {
      console.log(`  ✓ Narrative set: ${entityName}`)
    }
  }

  // Upsert founder profile
  const { data: existingFounder } = await supabase.from('founder_profile').select('id').limit(1)
  if (existingFounder && existingFounder.length > 0) {
    const { error } = await supabase
      .from('founder_profile')
      .update(founderProfile)
      .eq('id', existingFounder[0].id)
    if (error) console.error('  ✗ Founder profile update:', error.message)
    else console.log('  ↺ Updated: Founder profile (D Jackson)')
  } else {
    const { error } = await supabase.from('founder_profile').insert(founderProfile)
    if (error) console.error('  ✗ Founder profile insert:', error.message)
    else console.log('  + Created: Founder profile (D Jackson)')
  }

  console.log(`\n✓ Done — ${created} created, ${updated} updated`)
  console.log('\nNext: Set parent_id relationships via Profile Manager or re-run with ID lookup.')
  console.log('NOTE: Update city/state at top of this file if Birmingham, AL is incorrect.')
}

seed().catch(console.error)
