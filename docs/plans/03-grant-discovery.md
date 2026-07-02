# Plan 03 — Grant Discovery Engine

**Status: BACKEND COMPLETE · EXPLORER UI FUNCTIONAL**

## Purpose
Scrape every major grant source daily, normalize to a common schema, deduplicate, and store in the `grants` table. Feed the matching engine immediately after each scraper run.

## What Was Built

### Scraper Infrastructure
- `lib/scrapers/types.ts` — normalized `Grant` type
- `lib/scrapers/normalize.ts` — maps raw scraper output → `Grant`
- `lib/scrapers/persist.ts` — upserts grants to Supabase, logs scraper run
- `lib/scrapers/deduplicate.ts` — cosine similarity + URL matching to avoid duplicates
- `lib/scrapers/cleanup.ts` — expires grants past deadline
- `lib/scrapers/playwright-loader.ts` — shared Playwright browser instance for JS-rendered pages
- `lib/scrapers/health.ts` — scraper run health monitoring

### Sources Scraped (60+)
**Federal:** `grants-gov.ts`, `sam-gov.ts`, `sbir.ts`, `federal-register.ts`

**State:** `states/california.ts`, `states/georgia.ts`, `states/los-angeles.ts`

**Corporate (20+):** allstate, amazon, att, bankofamerica, comcast, famous-amos, fedex, goldmansachs, google, google-black-founders, jpmorgan, jpmorgan-black-pathways, mastercard, meta, microsoft, nike, salesforce, santander, sba, tmobile, verizon, visa, walmart, wellsfargo

**Private Foundations:** ford, gates, kellogg, knight, womensnet

**Niche/Community (25+):** atomic-vc, black-enterprise, california-arts, camelback, candid, digitalundivided, dream-makers, echoing-green, founders-first, freed-fellowship, grantfind, grantwatch, hello-alice, helloskip, ifundwomen, kirabo, lisc, mbda, naacp, nea, osv-fellowships, philanthropy-news-digest, rwjf, skysthelimit, tory-burch-foundation, urban-league, plus Google grant search

### Cron Jobs
- `POST /api/cron/discover` — runs daily at 6am UTC, scrapes all sources
- `POST /api/cron/match` — triggers matching engine after discovery
- `POST /api/cron/cleanup` — expires past-deadline grants
- All protected: `Authorization: Bearer $CRON_SECRET`

### Explorer UI
- `app/(dashboard)/explorer/page.tsx` — 336-line client component
- Real-time search with debounce
- Filter by funder type (federal/foundation/corporate/state/niche)
- `GrantDetailSheet` slide-out for full grant details
- Infinite scroll / load-more pattern

## What Still Needs Work

### Scraper quality
- Some corporate scrapers are placeholders (return empty arrays) because the target sites block automated access. These need Playwright + cookie handling or manual data entry fallbacks.
- State portal coverage is thin — only CA, GA, LA. TX, NY, IL, FL would be high-value adds.
- `google-search.ts` uses a search API key — rate-limited at 100 queries/day on free tier.

### Explorer UX
- No sort controls (currently sorted by deadline ascending)
- No award range filter
- No "save to watchlist" action from the explorer
- Scraper health dashboard (from `scraper_runs` table) not exposed in UI

## Key Design Decisions
- **One file per source**: adding a source = adding one file that exports `scrape(): Promise<Grant[]>`. Contributors don't touch anything else.
- **Deduplicate before persist**: same grant from two sources gets merged. The source with the more complete record wins.
- **Passive V2 data from day 1**: `grant_cycles` table records every open/close date observed. V2 calendar engine launches with real historical data.
