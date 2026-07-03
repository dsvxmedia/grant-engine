# Grant Engine Roadmap

A living document. Check the [issue tracker](https://github.com/dsvxmedia/grant-engine/issues) for what's actively being worked on.

---

## V1 — Foundation (current)

> Goal: discover grants, score them, write applications, gate them through QA, hand off to a human.

| Area | Feature | Status |
|------|---------|--------|
| Discovery | Daily scraper run across 60+ sources (federal, state, foundation, corporate, niche) | ✅ Done |
| Discovery | Normalized `RawGrant → NormalizedGrant` pipeline | ✅ Done |
| Discovery | Dead-link detection and scraper health monitoring | ✅ Done |
| Matching | Hard eligibility filter (org type, geography, award size, deadline) | ✅ Done |
| Matching | Keyword-token fit score (mission alignment, angle match, prestige, urgency) | ✅ Done |
| Matching | Semantic fit score via pgvector + OpenAI text-embedding-3-small | ✅ Done |
| Writing | 5-pass pipeline: Draft → Critique → Revision → Humanizer → Uniqueness guard | ✅ Done |
| Writing | Multi-model QA gate (Sonnet + 2× Haiku), retry loop, manual fallback | ✅ Done |
| Writing | User revision notes wired through Pass 3 (re-draft with feedback) | ✅ Done |
| Writing | Budget builder (project budget attached to each application) | ✅ Done |
| LOI | Letter of Inquiry generation + status pipeline | ✅ Done |
| LOI | Deadline guard — blocks submit if loi_deadline or grant deadline has passed | ✅ Done |
| UI | Review dashboard — Kanban board (Queued → In Review → Approved → Rejected) | ✅ Done |
| UI | Grant explorer with score filters and deadline chips | ✅ Done |
| UI | Business entity + founder profile manager | ✅ Done |
| UI | Fit score breakdown (component-level visualization on grant cards) | ✅ Done |
| Infra | Demo mode (read-only public instance, write ops return 423) | ✅ Done |
| Infra | Cron job auth (CRON_SECRET bearer token on all cron routes) | ✅ Done |
| Infra | Supabase pgvector schema + ivfflat indexes | ✅ Done |

**Open V1 contributions wanted:**
- New scrapers — city/county portals, community foundations, international sources
- End-to-end integration tests for the writing pipeline
- Entity embedding backfill endpoint (currently runs after each scraper run)

---

## V2 — Intelligence Layer

> Goal: the system learns from outcomes and starts making smarter decisions.

| Feature | Description |
|---------|-------------|
| **Win/Loss Engine** | Track submitted vs. awarded applications. Feed results back into the 10% `win_loss` scoring weight (currently 0). |
| **Relationship Engine** | Program officer contact database. Link contacts to funders, log touchpoints, surface warm relationships before drafting. |
| **Grant Calendar** | Historical open/close date tracking (`grant_cycles` table already populated). Predict when recurring grants will reopen. |
| **Competitive Intelligence** | Scrape funder 990s and award histories. Surface which org types and project types get funded. Inject findings into Pass 1 research. |
| **Coalition Module** | Match complementary organizations across the entity portfolio for joint-application opportunities. |
| **New Program Monitor** | Detect when a funder announces a brand-new program and surface it immediately (not just in the daily cron). |

---

## V3 — AI Pitch Video Pipeline

> Goal: a 60-second AI video pitch that goes with every major application.

| Feature | Description |
|---------|-------------|
| **HeyGen Avatar** | Clone a founder avatar, generate a personalized pitch video per application |
| **ElevenLabs Voice Clone** | Generate the voiceover from the founder's voice sample |
| **Script Generation** | Claude writes a 60-second pitch script from the approved application draft |
| **Video Review** | Video goes into the same review dashboard before it can be sent |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started. The best place to pick up a task is the [good first issue](https://github.com/dsvxmedia/grant-engine/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) label — most good first issues are new scrapers, which have a step-by-step guide in CONTRIBUTING.md.
