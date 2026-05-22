import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetLineItem = {
  category: string        // e.g. "Personnel — Program Director"
  description: string     // justification sentence
  amount: number
}

export type BudgetOutput = {
  lineItems: BudgetLineItem[]
  totalAmount: number
  indirectCosts: number
  narrative: string       // 1-2 paragraph budget narrative
  csvRows: string[][]     // [ [category, description, amount], ... ] for export
}

export type BudgetInput = {
  funderType: string | null
  awardMin: number | null
  awardMax: number | null
  projectDurationMonths: number  // estimated from grant info, default 12
  entityName: string
  focusArea: string | null
}

// ─── Budget rules per grant type ──────────────────────────────────────────────

type GrantTypeRules = {
  label: string
  rules: string
  indirectRateLabel: string
  /** compute indirect costs from the direct cost total */
  computeIndirect: (directTotal: number) => number
}

const BUDGET_RULES: Record<string, GrantTypeRules> = {
  federal: {
    label: 'Federal (non-SBIR)',
    rules: `
- Indirect cost rate: 10% de minimis (note "negotiated rate if applicable").
- Fringe benefits: 30% of personnel costs.
- Include travel, supplies, and equipment line items.
- All costs must be allowable, allocable, and reasonable per 2 CFR 200.
    `.trim(),
    indirectRateLabel: '10% de minimis',
    computeIndirect: (direct) => Math.round(direct * 0.10),
  },
  sbir: {
    label: 'SBIR Phase I',
    rules: `
- Phase I total budget cap: $275,000.
- Required cost categories: Labor (PI + staff), Fringe (30% of labor), Materials, Equipment, Overhead (20% of direct labor), Profit (7% of total costs).
- Do not exceed $275,000 total.
    `.trim(),
    indirectRateLabel: '20% overhead of direct labor',
    computeIndirect: (direct) => Math.round(direct * 0.20),
  },
  foundation: {
    label: 'Foundation',
    rules: `
- Prefer direct program costs.
- Overhead maximum: 20% of total budget.
- No single equipment line item may exceed $5,000 without a written justification.
    `.trim(),
    indirectRateLabel: '20% overhead cap',
    computeIndirect: (direct) => Math.round(direct * 0.20),
  },
  corporate: {
    label: 'Corporate',
    rules: `
- Frame every cost as ROI: cost per output, scalability cost curve.
- Tie every line item to a specific measurable deliverable.
- Show how the investment scales efficiently over time.
    `.trim(),
    indirectRateLabel: 'N/A (ROI-framed)',
    computeIndirect: (_direct) => 0,
  },
  state: {
    label: 'State',
    rules: `
- Similar to federal allowability rules.
- Add a matching requirement note (commonly 1:1 or 1:2 match).
- Clearly identify the source and nature of any match funds.
    `.trim(),
    indirectRateLabel: '10% de minimis (state)',
    computeIndirect: (direct) => Math.round(direct * 0.10),
  },
  niche: {
    label: 'Niche / Other',
    rules: `
- Keep it simple: personnel, program costs, and overhead only.
- Overhead must be less than 15% of total budget.
    `.trim(),
    indirectRateLabel: '<15% overhead',
    computeIndirect: (direct) => Math.round(direct * 0.15),
  },
}

const DEFAULT_RULES: GrantTypeRules = BUDGET_RULES.niche

function getRules(funderType: string | null): GrantTypeRules {
  if (!funderType) return DEFAULT_RULES
  return BUDGET_RULES[funderType.toLowerCase()] ?? DEFAULT_RULES
}

// ─── Award target ─────────────────────────────────────────────────────────────

const DEFAULT_AWARD_TARGET = 50000

function computeTarget(awardMin: number | null, awardMax: number | null): number {
  if (awardMin === null && awardMax === null) return DEFAULT_AWARD_TARGET
  if (awardMin !== null && awardMax !== null) return Math.round((awardMin + awardMax) / 2)
  if (awardMin !== null) return awardMin
  return awardMax as number
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildFallback(target: number): BudgetOutput {
  const lineItems: BudgetLineItem[] = [
    {
      category: 'Program Costs',
      description: 'Direct program costs for project implementation.',
      amount: target,
    },
  ]
  const totalAmount = target
  const csvRows = lineItems.map((item) => [item.category, item.description, String(item.amount)])
  return {
    lineItems,
    totalAmount,
    indirectCosts: 0,
    narrative: 'Budget narrative to be completed.',
    csvRows,
  }
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function buildBudget(input: BudgetInput): Promise<BudgetOutput> {
  const {
    funderType,
    awardMin,
    awardMax,
    projectDurationMonths,
    entityName,
    focusArea,
  } = input

  const target = computeTarget(awardMin, awardMax)
  const rules = getRules(funderType)

  const prompt = `You are a professional grant budget specialist. Generate a compliant, detailed budget for the following grant application.

## Grant Type
${rules.label}

## Applicable Budget Rules
${rules.rules}

## Award Target
$${target} total (use this as your target total budget)

## Project Details
- Organization: ${entityName}
- Focus area: ${focusArea ?? 'general programming'}
- Project duration: ${projectDurationMonths} months
- Indirect cost rate: ${rules.indirectRateLabel}

## Instructions
1. Generate realistic, specific line items that comply with the budget rules above.
2. Ensure line item amounts sum to approximately $${target}.
3. Write a 1-2 paragraph budget narrative that justifies each cost category clearly.
4. Respond ONLY with valid JSON in this exact shape:

{
  "lineItems": [
    {"category": "Personnel — Program Director", "description": "Justification sentence.", "amount": 12000}
  ],
  "narrative": "1-2 paragraph budget narrative here."
}

Do not include any text outside the JSON.`

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let raw: string
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content.find((b) => b.type === 'text')
    raw = block && block.type === 'text' ? block.text.trim() : ''
  } catch {
    return buildFallback(target)
  }

  // Parse JSON — strip any markdown fences if present
  let parsed: { lineItems: BudgetLineItem[]; narrative: string }
  try {
    const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    return buildFallback(target)
  }

  // Validate shape
  if (
    !parsed ||
    !Array.isArray(parsed.lineItems) ||
    typeof parsed.narrative !== 'string'
  ) {
    return buildFallback(target)
  }

  // Coerce amounts to numbers and ensure required fields exist
  const lineItems: BudgetLineItem[] = parsed.lineItems.map((item) => ({
    category: String(item.category ?? ''),
    description: String(item.description ?? ''),
    amount: Number(item.amount ?? 0),
  }))

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const indirectCosts = rules.computeIndirect(totalAmount)
  const narrative = parsed.narrative
  const csvRows: string[][] = lineItems.map((item) => [
    item.category,
    item.description,
    String(item.amount),
  ])

  return {
    lineItems,
    totalAmount,
    indirectCosts,
    narrative,
    csvRows,
  }
}
