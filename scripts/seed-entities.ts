/**
 * Example seed script — replace this data with your own organization's profile.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/seed-entities.ts
 *
 * This script populates business_entities and founder_profile with your data so
 * the matching engine and writing pipeline have context to work from.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Entities ──────────────────────────────────────────────────────────────────
// Replace these with your own organization(s).

const entities: Record<string, unknown>[] = [
  {
    name: 'Acme Community Tech',
    type: 'parent',
    industry: 'Technology / Workforce Development',
    state: 'CA',
    city: 'Los Angeles',
    founding_date: '2020-01-01',
    employee_count: 5,
    revenue_range: 'under_100k',
    mission:
      'To make technology accessible to underserved communities through training, tools, and direct services.',
    focus_area: 'Digital Equity / Workforce Development',
    who_we_serve: ['youth 16-24', 'adults seeking reskilling', 'low-income households'],
    is_african_american_owned: false,
    is_minority_owned: true,
    is_underserved_community_tied: true,
    is_tech_company: true,
    is_social_enterprise: true,
    is_community_serving: true,
    grant_narrative:
      'Acme Community Tech is a Los Angeles-based nonprofit technology organization founded in 2020. We provide digital skills training, device access, and technology services to underserved communities in the greater LA area. Our workforce development programs have trained over 200 adults in the past two years, with 70% securing employment in tech-adjacent roles within six months of program completion.',
  },
]

// ── Founder profile ───────────────────────────────────────────────────────────
// Replace with your own founder's story.

const founderProfile = {
  owner_name: 'Jane Doe',
  origin_story: `Jane Doe founded Acme Community Tech after a decade working in corporate technology and watching the digital divide widen in her own neighborhood. She launched the organization with a $10,000 personal investment and a donated office space, building the first cohort of 12 trainees in 2020.`,
  personal_community_ties:
    'Jane grew up in South LA and continues to live and work in the communities the organization serves.',
  why_i_started: {
    'Acme Community Tech':
      'I watched neighbors get left behind as the economy went digital. That gap is solvable — but only if someone builds the bridge.',
  },
}

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding entities...\n')

  const { data: existing } = await supabase.from('business_entities').select('name')
  const existingNames = new Set((existing ?? []).map((e: { name: string }) => e.name))

  let created = 0
  let updated = 0

  for (const entity of entities) {
    if (existingNames.has(entity.name as string)) {
      const { error } = await supabase
        .from('business_entities')
        .update(entity)
        .eq('name', entity.name)
      if (error) {
        console.error(`  x ${entity.name}:`, error.message)
      } else {
        console.log(`  updated: ${entity.name}`)
        updated++
      }
    } else {
      const { error } = await supabase.from('business_entities').insert(entity)
      if (error) {
        console.error(`  x ${entity.name}:`, error.message)
      } else {
        console.log(`  created: ${entity.name}`)
        created++
      }
    }
  }

  const { data: existingFounder } = await supabase.from('founder_profile').select('id').limit(1)
  if (existingFounder && existingFounder.length > 0) {
    const { error } = await supabase
      .from('founder_profile')
      .update(founderProfile)
      .eq('id', existingFounder[0].id)
    if (error) console.error('  x Founder profile update:', error.message)
    else console.log('  updated: Founder profile')
  } else {
    const { error } = await supabase.from('founder_profile').insert(founderProfile)
    if (error) console.error('  x Founder profile insert:', error.message)
    else console.log('  created: Founder profile')
  }

  console.log(`\nDone — ${created} created, ${updated} updated`)
}

seed().catch(console.error)
