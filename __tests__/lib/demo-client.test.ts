/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { createDemoClient } from '@/lib/demo/client'
import entities from '@/lib/demo/fixtures/business_entities.json'
import grants from '@/lib/demo/fixtures/grants.json'
import matches from '@/lib/demo/fixtures/grant_matches.json'
import applications from '@/lib/demo/fixtures/grant_applications.json'
import notifications from '@/lib/demo/fixtures/notifications.json'

// The public demo used to read the owner's real database. These fixtures are the
// replacement, so the test that matters most is that nothing real is in them.
const OWNER_STRINGS = [
  'Clear State',
  'Clearstate',
  'Donameche',
  'FlowTech',
  'Louest',
  'SALUS',
  'NeuroFlow',
  'HoloHaus',
  'CreatorOS',
  'Phoenix House',
  'Motherbox',
  'BetterU',
  'V8 Network',
  'Sounds of the City',
  'LegalFlow',
]

describe('demo fixtures', () => {
  const everything = JSON.stringify({ entities, matches, applications, notifications }).toLowerCase()

  it.each(OWNER_STRINGS)('contains no reference to %s', (needle) => {
    expect(everything).not.toContain(needle.toLowerCase())
  })

  it('has fictional organizations only', () => {
    expect((entities as any[]).map((e) => e.name)).toEqual([
      'Meridian Technical Institute',
      'Halcyon Bio Devices',
      'Cedar Commons Health Collective',
    ])
  })

  it('carries no owner demographics', () => {
    for (const e of entities as any[]) {
      expect(e.owner_demographics).toBeNull()
      expect(e.sam_uei).toBeNull()
      expect(e.cage_code).toBeNull()
    }
  })

  it('keeps real grant listings, with live deadlines', () => {
    expect((grants as any[]).length).toBeGreaterThan(50)
    const past = (grants as any[]).filter((g) => new Date(g.deadline) < new Date())
    // Real listings age out over time; the fixture should start with none expired.
    expect(past.length).toBeLessThan((grants as any[]).length / 2)
  })

  it('never invents a program for a real funder', () => {
    // Seed grants with 00000000 ids were fictional programs attributed to real
    // funders (Microsoft, Gates Foundation). They must stay out of the fixture.
    for (const g of grants as any[]) {
      expect(g.id.startsWith('00000000')).toBe(false)
    }
  })

  it('points every match and application at a real fixture row', () => {
    const grantIds = new Set((grants as any[]).map((g) => g.id))
    const entityIds = new Set((entities as any[]).map((e) => e.id))
    for (const m of matches as any[]) {
      expect(grantIds.has(m.grant_id)).toBe(true)
      expect(entityIds.has(m.entity_id)).toBe(true)
    }
    for (const a of applications as any[]) {
      expect(grantIds.has(a.grant_id)).toBe(true)
      expect(entityIds.has(a.entity_id)).toBe(true)
    }
  })
})

describe('demo client query surface', () => {
  const db = createDemoClient()

  it('filters with eq', async () => {
    const { data } = await db.from('business_entities').select('*').eq('state', 'OH')
    expect(data.map((r: any) => r.name)).toEqual([
      'Meridian Technical Institute',
      'Cedar Commons Health Collective',
    ])
  })

  it('returns a row with maybeSingle and null when absent', async () => {
    const id = (entities as any[])[0].id
    const hit = await db.from('business_entities').select('*').eq('id', id).maybeSingle()
    expect(hit.data.name).toBe('Meridian Technical Institute')
    const miss = await db.from('business_entities').select('*').eq('id', 'nope').maybeSingle()
    expect(miss.data).toBeNull()
    expect(miss.error).toBeNull()
  })

  it('errors on single when the row is missing, like PostgREST', async () => {
    const { data, error } = await db.from('grants').select('*').eq('id', 'nope').single()
    expect(data).toBeNull()
    expect(error.code).toBe('PGRST116')
  })

  it('counts with head', async () => {
    const { data, count } = await db
      .from('grant_matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review')
    expect(data).toBeNull()
    expect(count).toBe((matches as any[]).filter((m) => m.status === 'pending_review').length)
  })

  it('handles or, is and not filters', async () => {
    const { data: ored } = await db
      .from('grant_matches')
      .select('*')
      .or('status.eq.queued,status.eq.archived')
    expect(ored.every((m: any) => ['queued', 'archived'].includes(m.status))).toBe(true)

    const { data: notNull } = await db.from('grants').select('*').not('deadline', 'is', null)
    expect(notNull.length).toBe((grants as any[]).length)

    const { data: isNull } = await db.from('grant_applications').select('*').is('submitted_at', null)
    expect(isNull.length).toBe((applications as any[]).length)
  })

  it('orders and limits', async () => {
    const { data } = await db
      .from('grant_matches')
      .select('*')
      .order('fit_score', { ascending: false })
      .limit(3)
    expect(data).toHaveLength(3)
    expect(data[0].fit_score).toBeGreaterThanOrEqual(data[2].fit_score)
  })

  it('resolves embedded relations the app selects', async () => {
    const { data } = await db.from('grant_applications').select('*, grants(title), business_entities(name)')
    expect(data[0].grants.title).toBeTruthy()
    expect(data[0].business_entities.name).toBeTruthy()
  })

  it('refuses every write', async () => {
    for (const op of ['insert', 'update', 'upsert', 'delete'] as const) {
      const { data, error } = await (db.from('grant_matches') as any)[op]({ status: 'queued' })
      expect(data).toBeNull()
      expect(error.code).toBe('DEMO_READ_ONLY')
    }
  })
})
