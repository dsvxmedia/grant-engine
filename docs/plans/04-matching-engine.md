# Plan 04 — Matching & Scoring Engine

**Status: COMPLETE**

## Purpose
For every discovered grant, determine which entities in the portfolio are eligible and how strong a fit they are. Hard eligibility filter first (binary pass/fail), then semantic fit scoring (0–100). Only grants that clear both layers reach the writing pipeline.

## What Was Built

### Eligibility Filter (`lib/matching/eligibility.ts`)
Binary checks — any failure disqualifies the grant for that entity:
- Geographic: grant's required state/region must match entity's state
- Org type: grant must accept the entity's org type (LLC, nonprofit, etc.)
- Award range: entity's ideal award range must overlap grant's award range
- Deadline: grant must not be expired
- Demographic flags: additive — `true` flags unlock additional categories, `false` flags block nothing

### Fit Scorer (`lib/matching/fit-score.ts`)
```
MISSION_ALIGNMENT  30%  — keyword overlap, normalized for specificity
ANGLE_MATCH        25%  — entity pitch angles vs. grant eligibility tags
AWARD_SIZE         15%  — entity revenue band vs. grant award midpoint
DEADLINE_URGENCY   10%  — 14–60 days = 1.0 | <7 days = 0.2 | expired = 0
FUNDER_PRESTIGE    10%  — federal > foundation > state > corporate > niche
WIN_LOSS           10%  — V2 placeholder (returns 0, factored out of normalization)
```

Score routing:
- **70+** → `status: 'queued'` — auto-draft triggered
- **50–69** → `status: 'pending_review'` — manual decision required
- **< 50** → `status: 'deprioritized'` — suppressed from main views

### Orchestrator (`lib/matching/index.ts`)
Runs eligibility + scoring for every active entity against every new grant. Called after each scraper run.

### Persistence (`lib/matching/persist.ts`)
Upserts `grant_matches` rows. On rescore, updates `fit_score` and `matched_angles` without creating duplicates.

### Cron
- `POST /api/cron/match` — triggered after discovery cron completes, or manually

## Key Design Decisions
- **Eligibility before scoring**: a grant that fails eligibility never reaches the scorer. Saves ~60% of embedding compute.
- **Eligibility flags are additive unlock keys**: `is_african_american_owned: true` unlocks BIPOC-targeted grants. `is_african_american_owned: false` does NOT exclude the entity from general grants. Flags are opportunity expanders, not identity boxes.
- **pgvector for mission alignment**: entity mission description and grant description are both embedded. Cosine similarity drives the 30% mission alignment score. No separate vector DB required — Supabase handles it natively.
- **Win/Loss weight reserved**: the 10% WIN_LOSS weight exists in V1 but returns 0 for all grants. V1 fit scores are therefore effectively out of 90 points, renormalized to 100. V2 plugs in real outcome data without changing the score formula.
