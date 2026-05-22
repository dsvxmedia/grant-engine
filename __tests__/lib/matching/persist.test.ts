import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildMatchRecord,
  persistMatches,
  type MatchRecord,
} from '@/lib/matching/persist'
import { createServiceClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

const mockedCreateServiceClient = vi.mocked(createServiceClient)

function baseBuildInput() {
  return {
    grant_id: 'grant-1',
    entity_id: 'entity-1',
    hard_filter_passed: true,
    hard_filter_failures: [],
    fit_score: 80 as number | null,
    matched_angles: ['minority_owned'],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildMatchRecord', () => {
  it('failed filter sets status to rejected', () => {
    const record = buildMatchRecord({
      ...baseBuildInput(),
      hard_filter_passed: false,
      hard_filter_failures: ['deadline_passed'],
      fit_score: 92,
    })
    expect(record.status).toBe('rejected')
    expect(record.hard_filter_passed).toBe(false)
    expect(record.hard_filter_failures).toEqual(['deadline_passed'])
  })

  it('score >= 70 sets status to queued', () => {
    const record = buildMatchRecord({
      ...baseBuildInput(),
      hard_filter_passed: true,
      fit_score: 75.5,
    })
    expect(record.status).toBe('queued')
    expect(record.fit_score).toBe(75.5)
  })

  it('score < 70 sets status to archived', () => {
    const record = buildMatchRecord({
      ...baseBuildInput(),
      hard_filter_passed: true,
      fit_score: 65.0,
    })
    expect(record.status).toBe('archived')
    expect(record.fit_score).toBe(65.0)
  })

  it('null score with passed filter sets status to rejected', () => {
    const record = buildMatchRecord({
      ...baseBuildInput(),
      hard_filter_passed: true,
      fit_score: null,
    })
    expect(record.status).toBe('rejected')
    expect(record.fit_score).toBeNull()
  })

  it('competitive_density_score is always null', () => {
    const passed = buildMatchRecord({ ...baseBuildInput(), fit_score: 80 })
    const archived = buildMatchRecord({ ...baseBuildInput(), fit_score: 50 })
    const rejected = buildMatchRecord({
      ...baseBuildInput(),
      hard_filter_passed: false,
    })
    expect(passed.competitive_density_score).toBeNull()
    expect(archived.competitive_density_score).toBeNull()
    expect(rejected.competitive_density_score).toBeNull()
  })
})

describe('persistMatches', () => {
  it('returns early without DB call when array is empty', async () => {
    const result = await persistMatches([])
    expect(result).toEqual({ upserted: 0, errors: 0 })
    expect(mockedCreateServiceClient).not.toHaveBeenCalled()
  })

  it('upserts records and returns count on success', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock })
    mockedCreateServiceClient.mockResolvedValue({ from: fromMock } as never)

    const records: MatchRecord[] = [
      buildMatchRecord({ ...baseBuildInput(), grant_id: 'g1', fit_score: 80 }),
      buildMatchRecord({ ...baseBuildInput(), grant_id: 'g2', fit_score: 60 }),
      buildMatchRecord({
        ...baseBuildInput(),
        grant_id: 'g3',
        hard_filter_passed: false,
      }),
    ]

    const result = await persistMatches(records)
    expect(result).toEqual({ upserted: 3, errors: 0 })
    expect(mockedCreateServiceClient).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledWith('grant_matches')
    expect(upsertMock).toHaveBeenCalledWith(records, {
      onConflict: 'grant_id,entity_id',
    })
  })

  it('returns errors count on DB failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const upsertMock = vi
      .fn()
      .mockResolvedValue({ error: { message: 'boom' } })
    const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock })
    mockedCreateServiceClient.mockResolvedValue({ from: fromMock } as never)

    const records: MatchRecord[] = [
      buildMatchRecord({ ...baseBuildInput(), grant_id: 'g1' }),
      buildMatchRecord({ ...baseBuildInput(), grant_id: 'g2' }),
      buildMatchRecord({ ...baseBuildInput(), grant_id: 'g3' }),
    ]

    const result = await persistMatches(records)
    expect(result).toEqual({ upserted: 0, errors: 3 })
    expect(consoleSpy).toHaveBeenCalledWith(
      '[matching/persist] upsert failed',
      { message: 'boom' },
    )
    consoleSpy.mockRestore()
  })
})
