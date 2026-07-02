# Plan 08 — Review Dashboard

**Status: LARGELY COMPLETE · DETAIL VIEWS NEED POLISH**

## Purpose
The human-in-the-loop layer. Every grant application and LOI sits here waiting for explicit approval before anything is submitted. The dashboard gives the user full visibility into the pipeline at every stage — what was discovered, what was scored, what's being written, what needs a decision.

## What Was Built

### Pipeline Kanban (`app/(dashboard)/page.tsx`)
The main dashboard view. Six columns representing the full lifecycle:

| Column | Data Source | What Goes Here |
|---|---|---|
| Discovered | `grants` count | Total active grants in DB |
| LOI Queue | `loi_submissions` | LOIs awaiting draft/approval |
| Matched | `grant_matches` (50–100 score) | Grants awaiting draft decision |
| QA Review | `grant_applications` (drafting/qa_review/qa_failed) | Applications in the pipeline |
| Review | `grant_applications` (pending_review) | Applications ready for approval |
| Submitted | `grant_applications` (submitted/approved) | Completed submissions |

Cards are deduped by `grant_id` — the same grant appears once even if it matched multiple entities.

### Review Queue (`app/(dashboard)/review/page.tsx`)
Two sections:
1. **Ready to Submit** — QA-passed applications. Each shows the full draft, QA scores, approve/reject buttons.
2. **Matched Grants** — Grants scored 50–69 (manual review tier). User decides whether to queue for drafting.

Components:
- `ReviewQueue` — list of `pending_review` applications with approve/reject controls
- `MatchReviewList` — list of manual-tier matches with "Draft this" / "Archive" actions
- `ApplicationDraft` — full application text viewer with QA score breakdown

### Grant Explorer (`app/(dashboard)/explorer/page.tsx`)
Full-text search across all discovered grants. Filter by funder type. Click any grant to open `GrantDetailSheet` with full details, eligibility tags, and source URL.

### Shared Components
- `GrantCard` — used in Kanban columns. Shows title, funder, award range, deadline chip, fit score, entity name.
- `GrantDetailSheet` — slide-out panel with full grant details
- `DeadlineChip` — red for ≤7 days, normal slate for everything else
- `ScoreBadge` — color-coded: green ≥70, yellow 50–69, slate <50
- `StatusBadge` — pill for application status

### API Actions
- `POST /api/applications/[id]/approve` — marks application `approved`, triggers submission prep
- `POST /api/applications/[id]/reject` — marks application `rejected`
- `POST /api/applications/[id]/revise` — sends back to Pass 3 with reviewer notes
- `POST /api/matches/[id]/queue` — queues a manual-tier match for drafting
- `POST /api/matches/[id]/archive` — deprioritizes a match

## What Still Needs Work

### Application detail page (`/review/[id]`)
The route exists but needs a richer layout:
- Full application text with section headers
- QA score breakdown with per-dimension detail
- Inline editing before approval (textarea that POSTs to `/revise`)
- Budget table viewer
- Approve/reject button persistent in a sticky footer

### Notifications
- `app/(dashboard)/notifications/page.tsx` exists but is not wired to real-time
- Toast notifications on key events (new match, QA pass, QA fail) should fire via Sonner

### Analytics stub
- `app/(dashboard)/analytics/page.tsx` route exists — data is passively collected in V1 but the page is empty. Wire it up to `/api/analytics` which returns win/loss aggregate data.

## Key Design Rules
- **Every number is clickable**: grant counts in the Kanban header link to the filtered explorer view
- **No action without confirmation**: approve/reject require explicit button clicks — no swipe-to-delete patterns
- **Deadlines always visible**: `DeadlineChip` appears on every card. Red = urgent (≤7 days).
- **Never auto-submit**: the Review column is a hard gate. Nothing exits it without `POST /api/applications/[id]/approve`.
