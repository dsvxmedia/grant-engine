# Plan 05 — LOI Pipeline

**Status: BACKEND COMPLETE · UI FUNCTIONAL (BASIC)**

## Purpose
Some grants require a Letter of Inquiry before a full application is invited. The LOI pipeline detects these grants, generates a tailored letter, and manages the submission workflow separately from full applications.

## What Was Built

### Data Layer
- `lib/loi/schema.ts` — Zod schema for `loi_submissions`
- `lib/loi/generate.ts` — LOI generation using Claude Sonnet; mirrors funder language, respects LOI-specific word limits

### API Routes
- `GET/POST /api/loi` — list LOIs and create new LOI for a grant
- `GET/PUT /api/loi/[id]` — read and update LOI status

### UI Components
- `LoiCard` — card displaying LOI title, funder, deadline, status, and approve/reject actions

### Dashboard Page
- `app/(dashboard)/loi/page.tsx` — LOI queue

### Pipeline Integration
- Grants with `requires_loi: true` are routed to the LOI column on the Pipeline Kanban before the full application column
- LOI approval triggers a flag that allows the full application pipeline to begin

## What Still Needs Work

### UI
- LOI page is thin — needs full LOI text preview (like `ApplicationDraft` component for full applications)
- No inline edit before approval — user can only approve or reject, not edit the generated LOI
- Status badges on `LoiCard` need color-coding consistent with the rest of the app

### Functional
- LOI deadline is tracked separately (`loi_deadline` column) from the full application deadline — the calendar view needs to surface both
- No notification when an LOI is auto-generated for a new `requires_loi: true` match

## Key Design Decisions
- **LOI ≠ application**: LOI submissions live in `loi_submissions`, not `grant_applications`. They have their own approval workflow, word limits, and deadline tracking.
- **Never auto-submit**: same rule as full applications — every LOI sits at `status: 'draft'` until explicit user approval.
- **LOI approval ≠ application start**: approving the LOI just sends it. The user decides separately when to trigger the full application pipeline after an invitation is received.
