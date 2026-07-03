# Grant Engine

**The open-source AI grant discovery and writing engine.**

Every nonprofit and small business leaves money on the table because grant research is a full-time job. The SaaS alternatives cost $300–600/month and keep their code closed. Grant Engine is the self-hostable, fully open alternative: it scrapes every major grant source daily, scores opportunities against your organization using semantic matching, and writes tailored applications through a 5-pass AI pipeline.

[![CI](https://github.com/dsvxmedia/grant-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/dsvxmedia/grant-engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**[Try it live →](https://grant-engine-snowy.vercel.app)** · [Report a bug](https://github.com/dsvxmedia/grant-engine/issues) · [Request a feature](https://github.com/dsvxmedia/grant-engine/issues)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdsvxmedia%2Fgrant-engine&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,ANTHROPIC_API_KEY,RESEND_API_KEY,RESEND_FROM_EMAIL,RESEND_ALERT_EMAIL,CRON_SECRET&envDescription=See%20.env.example%20for%20descriptions%20of%20each%20variable&envLink=https%3A%2F%2Fgithub.com%2Fdsvxmedia%2Fgrant-engine%2Fblob%2Fmain%2F.env.example&project-name=grant-engine&repository-name=grant-engine)

---

## What it does

```
                    GRANT ENGINE — DAILY PIPELINE
 ─────────────────────────────────────────────────────────────────

  6 SCRAPER CATEGORIES           MATCHING ENGINE
  ─────────────────              ───────────────
  Federal (Grants.gov,           Eligibility hard filter
  SBIR/STTR via SAM.gov, ──▶    (location, org type,
  Federal Register)              award size, deadline)
  State grant portals                    │
  Corporate CSR programs                 ▼
  Private foundations            Fit score (0–100)
  Niche / community              via keyword matching:
  sources                        Mission alignment   35%
                                 Angle match         25%
         ▼                       Award size fit      15%
                                 Deadline urgency    10%
  SCORES 70+: AUTO-DRAFT         Funder prestige     10%
  SCORES 50–69: REVIEW LIST      Win/Loss (V2)       10%
  SCORES <50: DEPRIORITIZED
                                 pgvector schema ready;
                                 semantic embeddings
                                 planned for V1.5
                                         │
                                         ▼
                             5-PASS WRITING PIPELINE
                             ────────────────────────
                             Pass 1: First draft
                                     (Claude Sonnet — mirrors
                                      funder language)
                             Pass 2: Self-critique
                                     (same model reviews
                                      against rubric)
                             Pass 3: Revision
                                     (targeted edits, not
                                      a full rewrite)
                             Pass 4: Humanizer
                                     (removes AI patterns,
                                      varies sentence structure)
                             Pass 5: Uniqueness guard
                                     (Jaccard similarity check
                                      vs. active applications)
                                         │
                                         ▼
                             MULTI-MODEL QA GATE
                             ───────────────────
                             Model A (Sonnet):
                               narrative + funder alignment
                             Model B (Haiku):
                               clarity + readability + tone
                             Model C (Haiku):
                               compliance — sections present,
                               word limits, budget math

                             All must score 7.0+
                             Failed → back to Pass 3
                             Max 2 retries → manual review
                                         │
                                         ▼
                             REVIEW DASHBOARD
                             (nothing submits without
                              your explicit approval)
```

---

## Why Grant Engine?

| Feature | Grant Engine | Granted AI | Instrumentl |
|---------|-------------|------------|-------------|
| Open source | ✅ MIT | ❌ Closed | ❌ Closed |
| Self-hostable | ✅ Vercel + Supabase | ❌ SaaS only | ❌ SaaS only |
| Monthly cost | $0 (+ API usage) | ~$179–499/mo | ~$179–399/mo |
| 5-pass AI writing pipeline | ✅ | Partial | ❌ |
| Multi-model QA gate | ✅ | ❌ | ❌ |
| Federal sources | ✅ Grants.gov, SBIR (SAM.gov API key req'd), Federal Register | ✅ | ✅ |
| State grant portals | ✅ (expanding) | ✅ | Partial |
| Custom scraper sources | ✅ Contribute your own | ❌ | ❌ |
| Humanizer pass (anti-AI-detection) | ✅ | ❌ | ❌ |

_Competitor pricing and features based on publicly available information as of June 2026._

---

## Screenshots

| Pipeline Kanban | Grant Detail | Review Queue |
|---|---|---|
| ![Kanban board showing grants moving through Queued → Drafting → Review stages](https://grant-engine-snowy.vercel.app/og-kanban.png) | ![Grant detail sheet with fit score breakdown and AI-written draft](https://grant-engine-snowy.vercel.app/og-detail.png) | ![Review queue with approve/reject controls](https://grant-engine-snowy.vercel.app/og-review.png) |

_Screenshots from the [live demo](https://grant-engine-snowy.vercel.app). Demo is read-only — all write operations return 423._

---

## Status

**V1 — Active development.** The core pipeline (discovery, matching, writing, QA gate) is implemented and functional. 511+ unit tests passing. The highest-value contribution area is adding new scrapers and writing end-to-end integration tests.

**V2** (planned): Relationship Engine, Win/Loss Learning, Competitive Intelligence, Grant Calendar.

**V3** (planned): AI pitch video pipeline (HeyGen + ElevenLabs voice clone).

See [ROADMAP.md](ROADMAP.md) for the full feature list and contribution opportunities.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router, TypeScript |
| Hosting | Vercel (Cron Jobs, Queues, Blob, 300s functions) |
| Database | Supabase — PostgreSQL + pgvector |
| Auth | Clerk |
| AI Writing | Claude Sonnet 4.6 |
| AI Classification | Claude Haiku 4.5 |
| AI QA Gate | Claude Opus 4.7 |
| Email | Resend |
| Scraping | Playwright + Cheerio |
| UI | shadcn/ui, Tailwind CSS |

---

## Quick Start

**Prerequisites:** Node.js 20+, Docker, accounts at Supabase, Clerk, and Anthropic.

```bash
# 1. Clone and install
git clone https://github.com/dsvxmedia/grant-engine.git
cd grant-engine
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in all values

# 3. Start Supabase locally (requires Docker)
npx supabase start

# 4. Apply migrations
npx supabase db reset

# 5. Generate TypeScript types
npx supabase gen types typescript --local > lib/supabase/database.types.ts

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

---

## Project Structure

```
grant-engine/
├── app/
│   ├── (auth)/                    # Clerk sign-in/sign-up
│   ├── (dashboard)/
│   │   ├── page.tsx               # Pipeline Kanban (main view)
│   │   ├── review/                # Review queue — approve/reject applications
│   │   ├── explorer/              # Grant discovery browser
│   │   ├── profile/               # Business entity + founder profile manager
│   │   ├── loi/                   # Letter of Inquiry pipeline
│   │   ├── calendar/              # Grant calendar (V2)
│   │   ├── analytics/             # Win/loss analytics (V2)
│   │   ├── relationships/         # Program officer CRM (V2)
│   │   ├── coalition/             # Coalition module (V2)
│   │   ├── notifications/         # Notification log
│   │   └── video/                 # AI pitch video pipeline (V3)
│   └── api/
│       ├── cron/                  # discover, match, draft, analyze, reminders, cleanup
│       ├── grants/                # Grant CRUD
│       ├── applications/[id]/     # approve, reject, revise, QA trigger
│       ├── matches/[id]/          # queue, archive
│       ├── loi/                   # LOI generation + status
│       ├── profile/               # entities, founder, impact-metrics, documents
│       ├── video/                 # Video pipeline
│       ├── notifications/         # Notification log
│       ├── analytics/             # Win/loss data
│       ├── relationships/         # Program officer CRM
│       ├── coalition/             # Coalition matching
│       ├── admin/                 # Health check, notify
│       └── webhooks/              # QA + video callbacks
├── components/
│   ├── ui/                        # shadcn/ui primitives (never modify)
│   ├── layout/                    # Sidebar, Header
│   ├── shared/                    # DeadlineChip, ScoreBadge, StatusBadge, GrantDetailSheet
│   ├── pipeline/                  # KanbanBoard, KanbanColumn, GrantCard
│   ├── review/                    # ReviewQueue, MatchReviewList, ApplicationDraft
│   ├── profile/                   # EntityForm, EntityList, ProfileTabs, FounderStory,
│   │                              #   EligibilityAttributes, AnglePreview, ImpactMetrics,
│   │                              #   DocumentUpload
│   ├── loi/                       # LoiCard
│   ├── notifications/             # NotificationList
│   └── video/                     # VideoActions
├── lib/
│   ├── scrapers/                  # One file per grant source (60+ sources)
│   ├── matching/                  # Eligibility filter + semantic fit scorer
│   ├── writing/
│   │   └── passes/                # draft, critique, revision, humanizer, uniqueness
│   ├── qa/                        # Multi-model QA gate (narrative, clarity, compliance)
│   ├── loi/                       # LOI generation + schema
│   ├── profile/                   # Entity schema, founder schema, angles, impact, documents
│   ├── intelligence/              # V2: win-loss, relationships, calendar, coalition, competitive
│   ├── video/                     # V3: HeyGen + ElevenLabs pipeline
│   └── supabase/                  # Database client + generated types
├── __tests__/                     # Vitest — mirrors lib/ and app/api/ structure
└── supabase/migrations/           # All schema migrations (never edit, always add)
```

---

## Hard Rules

- **Never auto-submit** — every application and every LOI requires your explicit approval
- **Never fabricate eligibility** — all entity attributes must be truthful facts
- **Never skip the humanizer** — Pass 4 always runs; AI-sounding text hurts win rates

---

## Contributing

The most valuable contributions:
- **New scrapers** for city/county portals, community foundations, international sources
- **Integration tests** for the writing pipeline and matching engine
- **Documentation** improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and the scraper extension guide.

---

## Legal Notice

Grant Engine accesses publicly available grant data from government and foundation sources. **Users are responsible for complying with each data source's terms of service.** Some sources (including SAM.gov and SBIR.gov) restrict automated access — review their ToS before running scrapers at scale in production. This software is provided for informational and research purposes; users assume all responsibility for their use of it.

---

## License

[MIT](LICENSE) — free to use, fork, modify, and self-host. Commercial use permitted.

Built by [Donameche Jackson](https://www.theclearstate.io/) / [The Clearstate System (TCS)](https://www.theclearstate.io/).
