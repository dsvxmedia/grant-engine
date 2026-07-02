# Plan 06 — Writing Agent (5-Pass Pipeline)

**Status: COMPLETE**

## Purpose
Given a matched grant and a business entity, produce a tailored, human-sounding grant application through five sequential passes. The output is never auto-submitted — it sits in the review queue waiting for explicit human approval.

## What Was Built

### Pipeline Orchestrator (`lib/writing/pipeline.ts`)
Coordinates all five passes. Saves the draft before running the QA gate so a timeout never loses work.

### Pass 1 — First Draft (`passes/draft.ts`)
Claude Sonnet reads the funder's publicly available materials via `lib/writing/research.ts` (karpathy/autoresearch skill), mirrors their language, and writes all required sections. Uses `lib/writing/system-prompt.ts` to inject entity voice, mission, and matched angles.

### Pass 2 — Self-Critique (`passes/critique.ts`)
Same model reviews the draft against the grant's evaluation rubric. Produces a structured critique with specific sections to improve.

### Pass 3 — Revision (`passes/revision.ts`)
Targeted edits based on the critique. Not a full rewrite — only the identified weak sections are revised. Preserves the strong sections verbatim.

### Pass 4 — Humanizer (`passes/humanizer.ts`)
Removes AI-sounding patterns. Injects founder voice from `founder_profile.origin_story`. Varies sentence length and structure. This pass always runs — skipping it is an architecture violation, not a config option.

Patterns removed:
- Transitional filler ("Furthermore", "In conclusion", "It is worth noting")
- Passive voice (converted to active where natural)
- Consecutive sentences starting with the same word
- Vague generalities replaced with concrete specifics

### Pass 5 — Uniqueness Guard (`passes/uniqueness.ts`)
Cosine similarity check against all active applications from the last 90 days. If similarity > 0.85, triggers one revision retry (passes 3→4→5). After two retries, flags for manual review.

### Supporting Modules
- `lib/writing/research.ts` — pre-write funder research (public materials, mission, priorities)
- `lib/writing/system-prompt.ts` — builds the system prompt from entity + grant + angles
- `lib/writing/budget.ts` — Budget Builder: generates a line-item budget from the grant's max award and entity's stated needs
- `lib/writing/export.ts` — formats the final application for download (PDF/DOCX)
- `lib/writing/types.ts` — shared types for pipeline input/output

### Cron
- `POST /api/cron/draft` — triggered for every `grant_matches` row with `status: 'queued'`

## Key Design Decisions
- **Save before QA**: Vercel functions have a 300s limit. The draft is written to `grant_applications` with `status: 'drafting'` before the QA gate runs. If QA times out, the draft is safe.
- **Humanizer always runs**: no config flag. If the Anthropic API call fails, the pipeline marks `humanizer_applied: false` on the application record and flags it for extra review attention. The draft still proceeds rather than being lost.
- **Research shapes the vocabulary**: Pass 1 reads the funder's language before writing. Applications that mirror the funder's own words score better in human review.
- **Angles determine narrative**: the `matched_angles` from the matching step determine which pitch narrative is used. An entity without populated angles produces generic applications.
