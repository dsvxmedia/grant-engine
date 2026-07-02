# Plan 07 — QA Gate + Budget Builder

**Status: COMPLETE**

## Purpose
After the 5-pass writing pipeline completes, three AI models independently score the application on different dimensions. All three must hit 7.0/10 or the application loops back to Pass 3 for targeted revision. Maximum 2 retries before flagging for manual review.

## What Was Built

### Gate Orchestrator (`lib/qa/gate.ts`)
Runs all three scorers concurrently. Persists scores and updates application status. Returns the detailed scoring breakdown.

### Scorer A — Narrative (`lib/qa/narrative.ts`)
**Model:** Claude Sonnet 4.6  
**Scores:** Narrative strength (is the story compelling?), funder alignment (does it mirror their language and priorities?), specificity (concrete evidence vs. vague claims)  
**Why Sonnet:** Same model that wrote the draft, best positioned to evaluate narrative quality and funder language alignment

### Scorer B — Clarity (`lib/qa/clarity.ts`)
**Model:** Claude Haiku 4.5  
**Scores:** Readability (grade-level appropriate), tone (professional but not stiff), sentence variety (not robotic rhythm)  
**Why Haiku:** Cost-efficient for pattern checking. Doesn't share the author model's attachment to its own prose — tends to be a harsher clarity critic.

### Scorer C — Compliance (`lib/qa/compliance.ts`)
**Model:** Claude Haiku 4.5  
**Scores:** All required sections present, word limits respected, budget math correct, no fabricated facts (cross-checks against entity data)  
**Why Haiku:** Deterministic rule-checking. Speed and cost matter here since compliance is binary.

### Status Machine
```
drafting  →  (QA runs)  →  pending_review   (all scores ≥ 7.0)
                        →  drafting          (any score < 7.0, retry count < 2)
                        →  qa_failed         (any score < 7.0, retry count ≥ 2)
```

`qa_failed` applications appear in the Review Queue with score breakdowns visible so the user knows exactly what to fix.

### Budget Builder (`lib/writing/budget.ts`)
Generates a line-item budget table from:
- Grant's `award_max` (the ceiling)
- Entity's stated needs and headcount
- Standard rate cards for common line items (personnel, travel, indirect costs)

Budget math is cross-checked by Scorer C. If line items don't sum to the requested total, the compliance check fails.

### Webhook
- `POST /api/webhooks/qa` — async QA result callback (used when QA is offloaded to a queue)

### API
- `POST /api/applications/[id]/qa` — manually trigger QA re-run on a specific application

## Key Design Decisions
- **Three models = three perspectives**: a single model scoring its own output is biased toward leniency. Three models with distinct roles break that bias.
- **Concurrent scoring**: all three scorers run in `Promise.all()`. Total QA time ≈ slowest single scorer, not sum of all three.
- **Score threshold is 7.0, not 10**: 10/10 perfect applications don't exist. 7.0 is "this is good enough to submit with the human reviewer as the final gate."
- **Max 2 retries**: endless loops don't help. After two attempts, the application is flagged for human attention with the specific QA failure feedback visible in the UI. The reviewer makes the call.
