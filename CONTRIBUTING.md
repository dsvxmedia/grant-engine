# Contributing to Grant Engine

Thanks for your interest. Grant Engine is the most contribution-friendly in three areas: adding new grant scrapers, improving the writing pipeline, and documentation. Here's how to get started.

## Local Setup

**Prerequisites:** Node.js 20+, Docker (for Supabase), a Supabase account, a Clerk account, an Anthropic API key.

```bash
# 1. Clone and install
git clone https://github.com/dsvxmedia/grant-engine.git
cd grant-engine
npm install

# 2. Copy the environment template
cp .env.example .env.local
# Fill in all values — see .env.example for instructions

# 3. Start Supabase locally
npx supabase start
# This spins up PostgreSQL + pgvector locally via Docker

# 4. Apply all migrations
npx supabase db reset

# 5. Generate TypeScript types
npx supabase gen types typescript --local > lib/supabase/database.types.ts

# 6. Start the dev server
npm run dev
# Open http://localhost:3000
```

## Running Tests

```bash
npm run test:run        # Run all tests once
npm run test            # Watch mode
npx tsc --noEmit        # Type check only
```

Note: Tests use stubs for external services (Supabase, Anthropic, Resend). You don't need real API keys to run tests.

## Adding a New Grant Scraper

Scrapers live in `lib/scrapers/`. Each scraper is a single file that returns normalized `Grant` objects.

1. **Create the file:** `lib/scrapers/{source-name}.ts`
2. **Implement the interface:**

```typescript
import type { RawGrant } from '@/lib/scrapers/types'

export async function scrape{SourceName}(): Promise<RawGrant[]> {
  // Fetch and parse grants from the source
  // Return normalized RawGrant objects
}
```

3. **Register the scraper** in `app/api/cron/discover/route.ts`
4. **Add tests** in `__tests__/lib/scrapers/{source-name}.test.ts`

See `lib/scrapers/grants-gov.ts` as a reference implementation.

**Legal note:** Make sure the data source allows automated access. Check the site's `robots.txt` and Terms of Service before adding a scraper. See the Legal Notice section of the README.

## Adding Grant Sources

The highest-value contributions are scrapers for:
- City/county grant portals (currently no coverage)
- Community foundation portals
- Corporate CSR grant programs
- International sources (currently US-only)

## Code Style

- TypeScript strict mode — no `any` without a comment explaining why
- One file per responsibility — if you're unsure what a file does, it's doing too much
- No auto-submission code — the hard rule is users must approve every application

## Pull Requests

1. Fork the repo and create a branch: `git checkout -b feat/your-scraper-name`
2. Make your changes with tests
3. Run `npm run test:run` and `npx tsc --noEmit` — both must pass
4. Open a PR against `main` with a clear description of what source you added and why

CI runs automatically on every PR (type check + tests).

## Questions?

Open a GitHub Issue. For larger ideas (new subsystems, architecture changes), open an Issue first to discuss before building.
