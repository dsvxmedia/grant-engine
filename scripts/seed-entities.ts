/**
 * Seed script — The Louest Company entity portfolio
 * Run: npx dotenv -e .env.local -- npx tsx scripts/seed-entities.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Location ─────────────────────────────────────────────────────────────────
const CITY = 'Los Angeles'
const STATE = 'CA'

// ── Entities ──────────────────────────────────────────────────────────────────

const entities: Record<string, unknown>[] = [
  // 1. FlowTech Ventures — primary tech holding arm (The Louest Company LLC legal entity)
  {
    name: 'FlowTech Ventures',
    type: 'parent',
    industry: 'Technology Systems / Business Modernization',
    state: STATE,
    city: CITY,
    founding_date: '2021-01-01',
    employee_count: 1,
    revenue_range: 'Under $50,000',
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
  },
]

// ── Founder profile ───────────────────────────────────────────────────────────

const founderProfile = {
  owner_name: 'Donameche Jackson',
  origin_story: `Donameche Jackson is an ecosystem architect, founder, and builder operating at the intersection of technology, culture, creativity, and ownership.

After years of working inside businesses and watching operational dysfunction cost organizations their potential — fragmented tools, broken workflows, missed opportunities, and disconnected systems — Jackson built The Clearstate System to solve the problem at the root level. Not with another app. With an operational ecosystem.

The central insight behind TCS is what Jackson calls the Operational Genome Theory: every business has a core operational DNA, just like biological organisms. Most businesses are operating with a broken or dormant genome — systems that aren't communicating, workflows that are mutating into chaos, and processes that were built for a version of the company that no longer exists. TCS maps, decodes, and rebuilds that genome for performance.

Jackson built FlowTech Ventures as the holding architecture for this work — a portfolio of interconnected systems companies, each solving a specific operational problem across technology, healthcare, education, media, and culture. The goal is permanence. Not exits. Not one-and-done products. Interconnected systems that get stronger over time.`,
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
  'FlowTech Ventures': `FlowTech Ventures is a Los Angeles-based technology systems and innovation company founded by Donameche Jackson in 2021. FlowTech builds, deploys, and scales intelligent business systems and technology infrastructure through a portfolio of interconnected subsidiaries and products serving small and medium-sized businesses and underserved communities.

The company operates at the intersection of technology innovation and operational design — developing systems that solve real, costly problems for organizations that have historically been priced out of enterprise-grade technology solutions.

FlowTech's current operating portfolio includes The Clearstate System (TCS), the flagship systems and ecosystem company building operational infrastructure for SMBs and professional services organizations; BetterU Labs, an education and workforce development organization providing practical, high-impact learning for underrepresented professionals and youth; and Phoenix House Pictures, the media and visual storytelling arm of the ecosystem. Additional technology systems are in active development across healthcare and enterprise sectors.

FlowTech Ventures represents a systems-forward approach to business modernization: not single products, but interconnected ecosystems designed to grow in value and effectiveness over time. The company's philosophy — rooted in TCS's Operational Genome Theory — is that the right systems, built and integrated intelligently, create the most durable competitive advantage a business can possess. That philosophy drives every entity in the portfolio and every market it serves.`,

  'The Clearstate System': `The Clearstate System (TCS) is a Los Angeles-based systems and ecosystem company founded by Donameche Jackson in 2021. TCS designs, builds, implements, and optimizes intelligent business systems and operational ecosystems — creating interconnected environments where technology, communication, workflows, and continuity operate as a unified system rather than a collection of disconnected tools.

The problem TCS was built to solve is structural. Most small and growing businesses are not suffering from a shortage of tools. They are suffering from a shortage of integration. Fragmented systems, broken workflows, and disconnected processes quietly drain revenue, stall growth, and prevent organizations from performing at anything close to their potential. Enterprise-grade operational infrastructure has historically been inaccessible to smaller organizations — and that gap costs them every single day.

TCS closes that gap through operational ecosystems: fully integrated business environments that replace the fragmented tool stack with systems that work together, communicate, and reinforce one another.

The Clearstate System operates from a foundational philosophy called the Operational Genome Theory — the idea that every business has a core operational DNA, just like biological organisms. TCS maps, decodes, and optimizes that genome — identifying which systems are performing, which are dormant, and which are mutating in ways that damage organizational health. The result is not a business that is merely functional. It is a business operating at full performance.

TCS's current deployed product ecosystem addresses four critical operational domains:

Front Desk is TCS's communication ecosystem — ensuring every inbound contact, inquiry, and client communication is captured, routed, and followed through without gaps.

F.L.O. (Form & Lifecycle Operations) is TCS's workflow ecosystem — providing full-lifecycle management of forms, documents, signatures, and operational processes, replacing paper chaos and digital sprawl with structured, trackable systems.

REVOLVE is TCS's retention ecosystem — managing client continuity, re-engagement, and relationship maintenance to convert one-time transactions into long-term revenue relationships.

P.L.O.T. (Property Logistics & Operations Technology) is TCS's property management ecosystem — purpose-built for real estate and property management organizations navigating the unique coordination and compliance demands of the industry.

Two additional systems are in active development: SALUS, a patient communication and clinic intelligence system for healthcare organizations, and C.O.R.E., the large-scale ecosystem architecture layer that allows organizations to run multiple TCS systems simultaneously in a unified operational environment.

TCS serves small and medium-sized businesses, professional services firms, property management organizations, and growth-stage companies — with particular focus on organizations in communities that have historically lacked access to the kind of operational infrastructure that larger, better-resourced companies take for granted.`,

  'BetterU Labs': `BetterU Labs is an education and personal development company focused on providing accessible, practical, and high-impact learning experiences for individuals and organizations committed to growth, skill development, and career advancement.

The organization develops programs, courses, coaching models, and digital learning tools that help individuals — particularly young people and underrepresented professionals — access the knowledge and systems they need to build sustainable, prosperous careers and businesses.

BetterU Labs operates from the belief that transformative education should not be a privilege. The organization makes practical, actionable, and systems-based education accessible to those who have been underserved by traditional educational and professional development institutions — equipping them with the tools to build wealth, create opportunity, and establish lasting careers and businesses.

Programming includes youth-focused entrepreneurship and financial literacy programs, one-on-one and group coaching, self-paced digital courses, and organizational workshop facilitation. BetterU Labs measures success in outcomes: careers started, businesses launched, skills acquired, and economic mobility achieved.`,

  'SALUS': `SALUS is a healthcare ecosystem in development within the FlowTech Ventures portfolio, designed to address patient communication, patient education, operational support, and clinic intelligence for healthcare organizations.

SALUS is being built to close a persistent and damaging gap in healthcare delivery: the breakdown between clinical care and the communication and operational systems that surround it. When patients don't understand their treatment plan, don't receive timely follow-up, and when clinics operate on fragmented administrative infrastructure, outcomes suffer — and organizations bear the cost in compliance burden, staff time, and patient attrition. SALUS is designed to repair those gaps with purpose-built intelligent systems designed specifically for the healthcare environment.

Applying The Clearstate System's Operational Genome Theory to healthcare organizations, SALUS maps and optimizes the operational DNA of clinical environments — identifying where communication breaks down, where workflows create friction, and where technology can restore continuity and patient-centered performance.

SALUS is designed to serve private healthcare practices, community health clinics, specialty medical groups, behavioral health organizations, and health-focused nonprofits.`,

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

  // Update or insert entities
  let created = 0
  let updated = 0

  for (const entity of entities) {
    if (existingNames.has(entity.name as string)) {
      // Update existing record by name
      const { error } = await supabase
        .from('business_entities')
        .update(entity)
        .eq('name', entity.name)
      if (error) {
        console.error(`  ✗ ${entity.name}:`, error.message)
      } else {
        console.log(`  ↺ Updated: ${entity.name}`)
        updated++
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('business_entities')
        .insert(entity)
      if (error) {
        console.error(`  ✗ ${entity.name}:`, error.message)
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
    else console.log('  ↺ Updated: Founder profile (Donameche Jackson)')
  } else {
    const { error } = await supabase.from('founder_profile').insert(founderProfile)
    if (error) console.error('  ✗ Founder profile insert:', error.message)
    else console.log('  + Created: Founder profile (Donameche Jackson)')
  }

  console.log(`\n✓ Done — ${created} created, ${updated} updated`)
}

seed().catch(console.error)
