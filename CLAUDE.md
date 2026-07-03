# Grant Engine — Claude Code Context

## What This Is
An AI-powered grant discovery and writing engine. Scrapes every major grant source daily, scores grants against a portfolio of businesses using semantic matching, writes tailored applications through a 5-pass AI pipeline, and manages the full submission workflow.

## Key Commands
```bash
npm run dev                    # Dev server at localhost:3000
npm run test                   # Tests in watch mode (Vitest)
npm run test:run               # Tests once
npx tsc --noEmit               # Type check
npx supabase start             # Start local Supabase
npx supabase db reset          # Reset DB + re-apply all migrations
npx supabase gen types typescript --local > lib/supabase/database.types.ts
vercel env pull .env.local     # Pull env vars from Vercel
```

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Hosting | Vercel Pro (Cron Jobs, Queues, Blob, 300s functions) |
| Database | Supabase — PostgreSQL + pgvector |
| Auth | Clerk |
| AI Writing | Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| AI Classification | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| AI QA Gate | Claude Opus 4.7 (`claude-opus-4-7`) |
| Email | Resend |
| Scraping | Playwright + Cheerio in Vercel Functions |
| UI | shadcn/ui, Tailwind CSS (Slate base, minimalist) |

## Project Structure
```
grant-engine/
├── app/
│   ├── (auth)/                 # Clerk sign-in/sign-up pages
│   ├── (dashboard)/            # All protected dashboard pages
│   └── api/
│       ├── cron/discover/      # Daily discovery (CRON_SECRET protected)
│       ├── grants/             # Grant CRUD
│       └── applications/       # Application management
├── components/
│   ├── ui/                     # shadcn/ui primitives (never modify)
│   ├── layout/                 # Sidebar, Header
│   └── shared/                 # DeadlineChip, ScoreBadge, StatusBadge
├── lib/
│   ├── supabase/               # client.ts, server.ts, database.types.ts
│   ├── claude/                 # AI agent modules
│   ├── scrapers/               # One file per grant source
│   ├── matching/               # Eligibility filter + fit scorer
│   ├── writing/                # 5-pass pipeline + budget builder
│   └── queue/                  # Vercel Queues client
├── supabase/migrations/        # All SQL — never edit, always add new
└── __tests__/                  # Vitest — mirrors lib/ structure
```

## Architecture Principles
1. **Draft + Review only** — nothing auto-submits without user approval. Ever.
2. **5-pass writing minimum** — Draft → Self-critique → Revision → Humanizer → Uniqueness guard. Then QA gate.
3. **Eligibility before scoring** — hard filter first, semantic scoring second.
4. **One responsibility per file** — if you're unsure what a file does, it's doing too much.
5. **TDD** — write the failing test before writing any implementation code.
6. **Humanizer always runs** — AI-sounding text hurts win rates. Never skip Pass 4.

## Scoring Weights (lib/matching/fit-score.ts)
- Mission alignment (keyword overlap): 35%
- Angle match strength: 25%
- Award size fit: 15%
- Deadline urgency: 10%
- Funder prestige: 10%
- Win/Loss Engine (V2): 10% (currently 0 — not yet implemented)

Note: pgvector schema is ready but embeddings are not yet populated. Mission alignment currently uses keyword-token Jaccard similarity. Implementing real semantic embeddings is the highest-value V1.5 contribution.

## Writing Pipeline
Every application runs exactly 5 passes before QA:
1. **First draft** — Claude Sonnet researches the funder, mirrors their language, writes all sections
2. **Self-critique** — same model reviews its draft against the grant's evaluation rubric
3. **Revision** — targeted edits based on critique, not a full rewrite
4. **Humanizer** — removes AI patterns, varies sentence structure, injects natural voice
5. **Uniqueness guard** — Jaccard similarity check vs. all active applications (last 90 days), flags if >0.85 similar

Then: **Multi-Model QA Gate** — 3 models, each scoring a different dimension. All must hit 7.0+.

## Hard Rules — Never Break
- **Never auto-submit** — user must approve every application and every LOI before it goes out
- **Never fabricate eligibility** — all eligibility attributes must be truthful facts
- **Never submit past deadline** — check before every submission action
- **Never skip the humanizer** — applications that sound AI-generated hurt win rates
- **Never edit existing migrations** — always create a new migration file
- **Never commit `.env.local`** — it is gitignored and must stay that way

## Database Quick Reference
| Table | Purpose |
|---|---|
| `grants` | All discovered grants |
| `grant_matches` | Per-entity scoring results |
| `loi_submissions` | Letter of Inquiry pipeline |
| `grant_applications` | Full applications (5-pass output + outcomes) |
| `business_entities` | Portfolio companies |
| `founder_profile` | Personal narrative module |
| `impact_metrics` | Impact data library |
| `program_officers` | Relationship engine (V2) |
| `grant_cycles` | Historical open/close dates |
| `scraper_runs` | Scraper health monitoring |
| `notifications` | In-app notification log |

After any schema change: `npx supabase gen types typescript --local > lib/supabase/database.types.ts`

## Cron Jobs (all protected with CRON_SECRET)
| Endpoint | Schedule | Purpose |
|---|---|---|
| `GET /api/cron/discover` | Daily 6am UTC | All grant sources |
| `GET /api/cron/draft` | After discover | Draft queued applications |

## Adding a New Scraper
1. Create `lib/scrapers/<category>/<source-name>.ts` exporting `async function scrapeXxx(): Promise<RawGrant[]>`
2. Import and add it to `lib/scrapers/<category>/index.ts`
3. Return `RawGrant[]` — `normalizeGrant()` in `normalize.ts` handles the rest
4. Write a test in `__tests__/lib/scrapers/<source-name>.test.ts`
