# Plan 01 — Foundation

**Status: COMPLETE**

## What Was Built

### Project Scaffold
- Next.js 15 App Router, TypeScript strict mode
- Vercel deployment with `vercel.json` cron config
- `proxy.ts` for demo mode — blocks all writes when `DEMO_MODE=true`
- `lib/env.ts` — typed env validation at startup

### Database
- Supabase (PostgreSQL + pgvector)
- 10 migrations in `supabase/migrations/` covering full V1 + V2 schema
- Tables: `grants`, `grant_matches`, `grant_applications`, `loi_submissions`, `business_entities`, `founder_profile`, `impact_metrics`, `program_officers`, `grant_cycles`, `scraper_runs`, `notifications`
- pgvector enabled (migration 0002) for semantic matching
- RLS enabled on all tables (migration 0008)

### Auth
- Clerk — sign-in/sign-up at `app/(auth)/`
- Service client (`lib/supabase/server.ts`) used in all Server Components and API routes

### Design System
- shadcn/ui with Slate base color
- CSS variables for theming
- Installed primitives: badge, button, card, dialog, input, label, scroll-area, select, separator, sheet, skeleton, sonner, tabs, textarea
- Shared components: `DeadlineChip`, `ScoreBadge`, `StatusBadge`, `GrantDetailSheet`
- Layout: `Sidebar`, `Header`

### CI
- `.github/workflows/ci.yml` — type check + tests on every PR

### Open Source Setup
- `README.md` — full story, pipeline diagram, comparison table, setup guide
- `LICENSE` — MIT, Donameche Jackson / The Clearstate System (TCS)
- `CONTRIBUTING.md` — scraper extension guide
- `.env.example` — all 11 env vars documented
- Live demo at https://grant-engine-snowy.vercel.app (`DEMO_MODE=true`, seeded data)

## Nothing Remaining
Foundation is complete. All subsequent plans build on this layer.
