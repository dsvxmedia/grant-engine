/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Fixture-backed stand-in for the Supabase client, used only when DEMO_MODE is on.
 *
 * Why this exists: the public demo used to point at the same database the owner's
 * real grant work lives in, with writes blocked. Read-only is not the same as
 * private, so every unauthenticated visitor could list the real organizations,
 * their profiles, and drafted applications. In demo mode the app now reads from
 * the fictional dataset in ./fixtures instead, and never opens a database
 * connection at all. Turning DEMO_MODE off restores normal behavior.
 *
 * Only the query surface this codebase actually uses is implemented. Anything
 * that writes returns a read-only error, which matches what middleware already
 * tells API callers.
 */
import entities from './fixtures/business_entities.json'
import grants from './fixtures/grants.json'
import matches from './fixtures/grant_matches.json'
import applications from './fixtures/grant_applications.json'
import notifications from './fixtures/notifications.json'

type Row = Record<string, any>

const READ_ONLY = {
  message: 'This is a read-only demo instance.',
  details: null,
  hint: null,
  code: 'DEMO_READ_ONLY',
}

function buildTables(): Record<string, Row[]> {
  const grantById = new Map((grants as Row[]).map((g) => [g.id, g]))
  const entityById = new Map((entities as Row[]).map((e) => [e.id, e]))

  // Pre-join the relations the app asks for with PostgREST embeds, so a
  // select('*, grants(...), business_entities(...)') finds them already present.
  const join = (rows: Row[]) =>
    rows.map((r) => ({
      ...r,
      grants: r.grant_id ? (grantById.get(r.grant_id) ?? null) : null,
      business_entities: r.entity_id ? (entityById.get(r.entity_id) ?? null) : null,
    }))

  return {
    business_entities: entities as Row[],
    grants: grants as Row[],
    grant_matches: join(matches as Row[]),
    grant_applications: join(applications as Row[]),
    notifications: notifications as Row[],
    founder_profile: [],
    impact_metrics: [],
    loi_submissions: [],
    grant_cycles: [],
    program_officers: [],
    partner_organizations: [],
    video_submissions: [],
    scraper_runs: [],
  }
}

let cache: Record<string, Row[]> | null = null
function tables() {
  cache ??= buildTables()
  return cache
}

function valueOf(row: Row, column: string): any {
  // PostgREST allows embedded columns like business_entities.matching_active
  if (!column.includes('.')) return row[column]
  return column.split('.').reduce<any>((acc, part) => (acc == null ? acc : acc[part]), row)
}

function coerce(raw: string): any {
  if (raw === 'null') return null
  if (raw === 'true') return true
  if (raw === 'false') return false
  const n = Number(raw)
  return raw !== '' && !Number.isNaN(n) ? n : raw
}

function likeMatch(value: any, pattern: string, caseInsensitive: boolean): boolean {
  if (value == null) return false
  const rx = new RegExp(
    '^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$',
    caseInsensitive ? 'i' : ''
  )
  return rx.test(String(value))
}

/** One `or=(...)` clause, e.g. `title.ilike.%robot%` or `application_url.is.null`. */
function orClause(row: Row, clause: string): boolean {
  const [column, op, ...rest] = clause.split('.')
  const operand = rest.join('.')
  const value = valueOf(row, column)
  switch (op) {
    case 'eq': return value === coerce(operand)
    case 'neq': return value !== coerce(operand)
    case 'is': return operand === 'null' ? value == null : value === coerce(operand)
    case 'like': return likeMatch(value, operand, false)
    case 'ilike': return likeMatch(value, operand, true)
    case 'gt': return value > coerce(operand)
    case 'gte': return value >= coerce(operand)
    case 'lt': return value < coerce(operand)
    case 'lte': return value <= coerce(operand)
    default: return false
  }
}

class DemoQuery implements PromiseLike<{ data: any; error: any; count: number | null }> {
  private rows: Row[]
  private wantsCount = false
  private headOnly = false
  private one: 'single' | 'maybe' | null = null
  private writeError: any = null

  constructor(rows: Row[]) {
    this.rows = [...rows]
  }

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    if (options?.count) this.wantsCount = true
    if (options?.head) this.headOnly = true
    return this
  }

  private where(predicate: (row: Row) => boolean) {
    this.rows = this.rows.filter(predicate)
    return this
  }

  eq(column: string, value: any) { return this.where((r) => valueOf(r, column) === value) }
  neq(column: string, value: any) { return this.where((r) => valueOf(r, column) !== value) }
  gt(column: string, value: any) { return this.where((r) => valueOf(r, column) > value) }
  gte(column: string, value: any) { return this.where((r) => valueOf(r, column) >= value) }
  lt(column: string, value: any) { return this.where((r) => valueOf(r, column) < value) }
  lte(column: string, value: any) { return this.where((r) => valueOf(r, column) <= value) }
  like(column: string, pattern: string) { return this.where((r) => likeMatch(valueOf(r, column), pattern, false)) }
  ilike(column: string, pattern: string) { return this.where((r) => likeMatch(valueOf(r, column), pattern, true)) }
  in(column: string, values: any[]) { return this.where((r) => values.includes(valueOf(r, column))) }
  contains(column: string, values: any[]) {
    return this.where((r) => {
      const v = valueOf(r, column)
      return Array.isArray(v) && values.every((x) => v.includes(x))
    })
  }
  overlaps(column: string, values: any[]) {
    return this.where((r) => {
      const v = valueOf(r, column)
      return Array.isArray(v) && values.some((x) => v.includes(x))
    })
  }
  is(column: string, value: any) {
    return this.where((r) => (value === null ? valueOf(r, column) == null : valueOf(r, column) === value))
  }
  not(column: string, op: string, value: any) {
    return this.where((r) => {
      const v = valueOf(r, column)
      if (op === 'is') return value === null ? v != null : v !== value
      if (op === 'in') return !(value as any[]).includes(v)
      if (op === 'eq') return v !== value
      return true
    })
  }
  or(filters: string) {
    const clauses = filters.split(',')
    return this.where((r) => clauses.some((c) => orClause(r, c.trim())))
  }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const asc = options?.ascending !== false
    this.rows.sort((a, b) => {
      const av = valueOf(a, column)
      const bv = valueOf(b, column)
      if (av == null && bv == null) return 0
      if (av == null) return options?.nullsFirst ? -1 : 1
      if (bv == null) return options?.nullsFirst ? 1 : -1
      if (av === bv) return 0
      return (av < bv ? -1 : 1) * (asc ? 1 : -1)
    })
    return this
  }
  limit(n: number) { this.rows = this.rows.slice(0, n); return this }
  range(from: number, to: number) { this.rows = this.rows.slice(from, to + 1); return this }
  single() { this.one = 'single'; return this }
  maybeSingle() { this.one = 'maybe'; return this }
  returns() { return this }
  throwOnError() { return this }

  private failWrite() {
    this.writeError = READ_ONLY
    this.rows = []
    return this
  }
  insert() { return this.failWrite() }
  update() { return this.failWrite() }
  upsert() { return this.failWrite() }
  delete() { return this.failWrite() }

  private settle() {
    if (this.writeError) return { data: null, error: this.writeError, count: null }
    const count = this.wantsCount ? this.rows.length : null
    if (this.headOnly) return { data: null, error: null, count }
    if (this.one === 'single') {
      if (this.rows.length !== 1) {
        return {
          data: null,
          error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' },
          count,
        }
      }
      return { data: this.rows[0], error: null, count }
    }
    if (this.one === 'maybe') return { data: this.rows[0] ?? null, error: null, count }
    return { data: this.rows, error: null, count }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.settle()).then(onfulfilled, onrejected)
  }
}

export function createDemoClient(): any {
  return {
    from(table: string) {
      return new DemoQuery(tables()[table] ?? [])
    },
    async rpc(fn: string, args?: Record<string, any>) {
      if (fn === 'match_grants_for_entity') {
        const entityId = args?.entity_id ?? args?.p_entity_id
        const rows = tables().grant_matches.filter((m) => !entityId || m.entity_id === entityId)
        return { data: rows, error: null }
      }
      return { data: null, error: READ_ONLY }
    },
    storage: {
      from() {
        return {
          async upload() { return { data: null, error: READ_ONLY } },
          async remove() { return { data: null, error: READ_ONLY } },
          getPublicUrl() { return { data: { publicUrl: '' } } },
        }
      },
    },
    auth: {
      async getUser() { return { data: { user: null }, error: null } },
      async getSession() { return { data: { session: null }, error: null } },
    },
  }
}

export const isDemoMode = () => process.env.DEMO_MODE === 'true'
