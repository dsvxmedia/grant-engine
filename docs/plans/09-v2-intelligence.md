# Plan 09 — V2 Intelligence Layer

**Status: DATA COLLECTION ACTIVE · UI/LOGIC NOT YET BUILT**

## Purpose
Turn Grant Engine from a grant-finding tool into a grant-winning tool. Use historical outcome data (collected passively in V1) to predict which grants are actually winnable, which program officers to cultivate, and which competitors to watch. Launches with real data because V1 has been collecting it since day one.

## What Exists (Passive Collection in V1)

### Tables Ready for V2
- `program_officers` — populated when scrapers find PO contact info; relationship scores start at 0
- `grant_cycles` — every open/close date observed by scrapers; cycle prediction model can train immediately
- `grant_applications` — every application outcome (approved/rejected) feeds win/loss learning
- `impact_metrics` — credibility signals that sharpen matching over time

### Stub Modules (API complete, logic not activated)
- `lib/intelligence/win-loss.ts` — schema and types; actual ML model not built
- `lib/intelligence/relationships.ts` — PO contact graph; scoring not active
- `lib/intelligence/calendar.ts` — cycle prediction; not active
- `lib/intelligence/coalition.ts` — coalition matching; not active
- `lib/intelligence/competitive.ts` — competitive intelligence; not active
- `lib/intelligence/new-programs.ts` — new program monitor; not active

### API Routes (exist, return stub data)
- `GET /api/relationships`
- `GET /api/coalition`
- `GET /api/analytics`
- `POST /api/cron/analyze`
- `POST /api/cron/new-programs`

### Dashboard Pages (exist, not wired)
- `app/(dashboard)/calendar/page.tsx`
- `app/(dashboard)/analytics/page.tsx`
- `app/(dashboard)/relationships/page.tsx`
- `app/(dashboard)/coalition/page.tsx`

## V2 Build Plan (When Ready)

### Win/Loss Engine
Connect historical `grant_applications` outcomes to fit scores. Train a simple scoring adjustment: grants from funders where the entity has won before get a bonus. Grants from funders where the entity has consistently lost get a penalty. Feed back into the 10% WIN_LOSS weight in the fit scorer.

### Relationship Engine
Track every interaction with a program officer (application submitted, response received, meeting booked). Score relationship warmth 0–100. Surface high-value PO contacts in the dashboard. Warm outreach before submission measurably improves win rates.

### Grant Calendar
Use `grant_cycles` data to predict when recurring grants will reopen. Show a 12-month calendar of predicted open dates so grant applications can be prepared in advance rather than reactively.

### Competitive Intelligence
If two entities in the same portfolio apply to the same grant, flag it. If historical data shows other orgs consistently winning a grant the portfolio keeps losing, flag it with the suspected competitive advantage.

### Coalition Module
Some grants prefer or require coalition applications. The coalition module identifies grant opportunities where a partnership with another org in the database would strengthen the application. `coalition_preferred: true` grants are already flagged in the scraper output.

### New Program Monitor
`POST /api/cron/new-programs` runs on a schedule watching for grants with `is_new_program: true`. New programs favor early applicants — these should be surfaced immediately, not held for the daily discovery run.

## Key Design Decision
**V1 is already collecting V2 data.** The intelligence layer was designed to launch with real historical data rather than cold. Don't activate V2 until there are at least 6 months of V1 outcome data — the models need volume to be meaningful.
