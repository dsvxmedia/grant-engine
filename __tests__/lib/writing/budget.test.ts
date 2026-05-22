import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock }
  },
}))
vi.mock('@/lib/env', () => ({ env: { ANTHROPIC_API_KEY: 'test-key' } }))

function jsonResponse(obj: object) {
  return { content: [{ type: 'text', text: JSON.stringify(obj) }] }
}

function textResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

function sampleLineItems() {
  return [
    { category: 'Personnel — Program Director', description: 'Oversees project delivery.', amount: 30000 },
    { category: 'Personnel — Program Staff', description: 'Provides direct services.', amount: 20000 },
    { category: 'Supplies', description: 'Program materials and supplies.', amount: 5000 },
  ]
}

function baseInput() {
  return {
    funderType: 'foundation',
    awardMin: 40000,
    awardMax: 60000,
    projectDurationMonths: 12,
    entityName: 'Test Org',
    focusArea: 'community development',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  createMock.mockResolvedValue(
    jsonResponse({ lineItems: sampleLineItems(), narrative: 'This budget supports the project.' })
  )
})

describe('buildBudget', () => {
  describe('basic output shape', () => {
    it('returns a BudgetOutput with all required fields', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(result).toHaveProperty('lineItems')
      expect(result).toHaveProperty('totalAmount')
      expect(result).toHaveProperty('indirectCosts')
      expect(result).toHaveProperty('narrative')
      expect(result).toHaveProperty('csvRows')
    })

    it('lineItems is an array of objects with category, description, amount', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(Array.isArray(result.lineItems)).toBe(true)
      for (const item of result.lineItems) {
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('description')
        expect(item).toHaveProperty('amount')
        expect(typeof item.category).toBe('string')
        expect(typeof item.description).toBe('string')
        expect(typeof item.amount).toBe('number')
      }
    })

    it('narrative is a non-empty string', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(typeof result.narrative).toBe('string')
      expect(result.narrative.length).toBeGreaterThan(0)
    })
  })

  describe('totalAmount computation', () => {
    it('totalAmount equals the sum of all lineItem amounts', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      const expectedTotal = sampleLineItems().reduce((sum, item) => sum + item.amount, 0)
      expect(result.totalAmount).toBe(expectedTotal)
    })

    it('totalAmount is 0 when lineItems is empty', async () => {
      createMock.mockResolvedValue(
        jsonResponse({ lineItems: [], narrative: 'Empty budget.' })
      )
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(result.totalAmount).toBe(0)
    })
  })

  describe('csvRows', () => {
    it('csvRows has the same number of rows as lineItems', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(result.csvRows.length).toBe(result.lineItems.length)
    })

    it('each csvRow has 3 elements: category, description, amount', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      for (const row of result.csvRows) {
        expect(row.length).toBe(3)
      }
    })

    it('csvRows amounts match lineItem amounts as strings', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      for (let i = 0; i < result.lineItems.length; i++) {
        expect(result.csvRows[i][2]).toBe(String(result.lineItems[i].amount))
      }
    })
  })

  describe('default award target', () => {
    it('uses $50,000 default when awardMin and awardMax are both null', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      // The prompt should be called with $50,000 as target — we just verify it resolves
      // without error and returns a valid output
      const result = await buildBudget({
        ...baseInput(),
        awardMin: null,
        awardMax: null,
      })

      expect(result).toHaveProperty('lineItems')
      expect(result).toHaveProperty('totalAmount')
      // Claude was still called (mock returns valid JSON)
      expect(createMock).toHaveBeenCalledOnce()
      // The prompt should mention 50000
      const promptArg = createMock.mock.calls[0][0]
      const promptText = JSON.stringify(promptArg)
      expect(promptText).toContain('50000')
    })

    it('uses midpoint when both awardMin and awardMax are provided', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      await buildBudget({ ...baseInput(), awardMin: 40000, awardMax: 60000 })

      const promptArg = createMock.mock.calls[0][0]
      const promptText = JSON.stringify(promptArg)
      // midpoint of 40000 and 60000 is 50000
      expect(promptText).toContain('50000')
    })
  })

  describe('indirectCosts computation', () => {
    it('computes indirectCosts as a number', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(typeof result.indirectCosts).toBe('number')
    })

    it('indirectCosts is non-negative', async () => {
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(result.indirectCosts).toBeGreaterThanOrEqual(0)
    })
  })

  describe('error resilience — fallback', () => {
    it('returns fallback output and never throws when API call fails', async () => {
      createMock.mockRejectedValue(new Error('API failure'))
      const { buildBudget } = await import('@/lib/writing/budget')

      await expect(buildBudget(baseInput())).resolves.not.toThrow()

      const result = await buildBudget(baseInput())
      expect(result).toHaveProperty('lineItems')
      expect(result.lineItems.length).toBeGreaterThanOrEqual(1)
      expect(result.narrative).toBe('Budget narrative to be completed.')
    })

    it('returns fallback when Claude returns non-JSON text', async () => {
      createMock.mockResolvedValue(textResponse('This is not JSON at all.'))
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(result).toHaveProperty('lineItems')
      expect(result.lineItems.length).toBeGreaterThanOrEqual(1)
      expect(result.narrative).toBe('Budget narrative to be completed.')
    })

    it('fallback lineItem is "Program Costs" at default $50,000 when award is null', async () => {
      createMock.mockRejectedValue(new Error('API failure'))
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget({
        ...baseInput(),
        awardMin: null,
        awardMax: null,
      })

      expect(result.lineItems[0].category).toBe('Program Costs')
      expect(result.lineItems[0].amount).toBe(50000)
    })

    it('fallback lineItem amount uses award midpoint when available', async () => {
      createMock.mockRejectedValue(new Error('API failure'))
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget({ ...baseInput(), awardMin: 80000, awardMax: 100000 })

      expect(result.lineItems[0].category).toBe('Program Costs')
      expect(result.lineItems[0].amount).toBe(90000)
    })

    it('fallback csvRows length matches fallback lineItems length', async () => {
      createMock.mockRejectedValue(new Error('API failure'))
      const { buildBudget } = await import('@/lib/writing/budget')

      const result = await buildBudget(baseInput())

      expect(result.csvRows.length).toBe(result.lineItems.length)
    })
  })
})
