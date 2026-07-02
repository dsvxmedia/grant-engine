# Plan 10 — V3 Video Pipeline

**Status: STUB ONLY · BUILD AFTER V2**

## Purpose
Some grants accept or prefer a short video pitch alongside the written application. V3 auto-generates a 60–90 second AI pitch video using a HeyGen avatar (visual) and ElevenLabs voice clone (audio). The video is reviewed and approved by the user before submission — same hard rule as written applications.

## What Exists

### Stub Modules
- `lib/video/pipeline.ts` — orchestrator stub
- `lib/video/script.ts` — video script generator (60-second distillation of the written application)
- `lib/video/voice.ts` — ElevenLabs voice clone integration stub
- `lib/video/render.ts` — HeyGen avatar render job stub
- `lib/video/types.ts` — shared types

### API Routes (exist, not functional)
- `GET/POST /api/video` — list and create video jobs
- `GET /api/video/[id]` — video status
- `POST /api/video/[id]/approve` — approve video for submission
- `POST /api/video/[id]/reject` — reject video
- `POST /api/webhooks/video` — HeyGen render completion callback
- `POST /api/cron/video` — batch trigger video generation for queued applications

### Dashboard Page
- `app/(dashboard)/video/page.tsx` — video pipeline dashboard
- `app/(dashboard)/video/[id]/page.tsx` — individual video review
- `components/video/VideoActions.tsx` — approve/reject actions

### DB
- `video_submissions` table — `0004_video_submissions.sql` migration already applied

## V3 Build Plan (When Ready)

### Script Generation
The video script is a 60-second distillation of the written application:
- 10s: Hook (the problem this grant helps solve)
- 20s: Solution (what the entity does, specific and concrete)
- 15s: Impact (metrics, traction, credibility signals from `impact_metrics`)
- 10s: Ask (specific dollar amount and what it funds)
- 5s: CTA (call to action, website)

Script runs through the Humanizer pass — same as written applications. AI-sounding scripts deliver AI-sounding videos.

### Voice Clone
ElevenLabs API: upload 30+ seconds of clean founder audio to generate a voice clone. The clone narrates the video script. Setup is one-time; thereafter the voice is available for every video.

### Avatar
HeyGen API: configure a digital avatar (photo or video-based). Avatar lip-syncs to the ElevenLabs narration. The render job is async — webhook fires when the video is ready.

### Review Gate
Video sits at `status: 'pending_review'` until the user watches it and approves. Never auto-attaches to an application submission.

## Key Design Decision
**V3 is a differentiator, not a requirement.** Most grants don't accept video pitches. Build V3 only after V2 is running and the win rate data shows that video-accepting grants are worth the investment. The infrastructure is stubbed so V3 can be activated grant-by-grant without re-architecting anything.
