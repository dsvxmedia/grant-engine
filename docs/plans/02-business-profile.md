# Plan 02 — Business Profile System

**Status: BACKEND COMPLETE · UI NEEDS POLISH**

## Purpose
Every grant application is written from the perspective of a specific business entity. The profile system stores the entities, their eligibility attributes, their pitch angles, the founder's personal narrative, and supporting documents. The matching engine and writing pipeline both read from this data.

## What Was Built

### Data Layer
- `lib/profile/entity-schema.ts` — Zod schema for `business_entities`
- `lib/profile/founder-schema.ts` — Zod schema for `founder_profile`
- `lib/profile/impact-schema.ts` — Zod schema for `impact_metrics`
- `lib/profile/angles.ts` — pitch angle generation and management
- `lib/profile/documents.ts` — supporting document handling

### API Routes
- `GET/POST /api/profile/entities` — list and create entities
- `GET/PUT/DELETE /api/profile/entities/[id]` — read, update, delete entity
- `POST /api/profile/entities/[id]/angles` — generate/update pitch angles
- `GET/PUT /api/profile/founder` — read and update founder profile
- `GET/POST /api/profile/impact-metrics` — impact data library
- `POST /api/profile/documents` — document upload to Vercel Blob

### UI Components
- `ProfileTabs` — top-level tab container (Entities, Founder, Impact, Documents)
- `EntityList` — list of all entities with status chips
- `EntityForm` — create/edit form for a business entity
- `EligibilityAttributes` — boolean flag matrix (minority-owned, tech company, etc.)
- `AnglePreview` — display generated pitch angles per entity
- `FounderStory` — rich text editor for origin story + voice sample
- `ImpactMetrics` — table of impact data points (jobs, revenue, people served, etc.)
- `DocumentUpload` — drag-and-drop for supporting documents

### Dashboard Page
- `app/(dashboard)/profile/page.tsx` — renders `ProfileTabs`

## What Still Needs Work

### UX gaps
- No empty state when user has no entities — first-time onboarding flow missing
- Angle generation has no loading indicator
- EligibilityAttributes form needs a save confirmation toast
- No validation feedback on EntityForm required fields before API call

### Functional gaps
- Document upload stores to Vercel Blob but doesn't link documents to specific entities in the UI
- Impact metrics are stored but not yet displayed on grant cards as credibility signals

## Key Design Decisions
- **One LLC, multiple entities**: The Louest Company LLC operates multiple brands. Each brand is a separate row in `business_entities` with its own angles, eligibility flags, and narrative. The parent entity relationship is tracked via `parent_entity_id`.
- **Eligibility flags are additive**: A flag being `true` unlocks additional grant categories. A flag being `false` does not block anything — it just doesn't unlock those categories. Never use flags as exclusion filters.
- **Angles drive the writing pipeline**: The `matched_angles` field on `grant_matches` determines which pitch narrative the writing agent uses. Angles must be populated before the pipeline can produce tailored applications.
