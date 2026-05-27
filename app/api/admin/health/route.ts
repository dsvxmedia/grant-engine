import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/health
// Returns system health metrics for debugging — protected by CRON_SECRET
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  // Grant quality metrics
  const [
    { count: totalActive },
    { count: hasApplicationUrl },
    { count: listingUrlGrants },
    { count: noUrl },
    { count: queuedMatches },
    { count: pendingReviewMatches },
    { count: unreadNotifications },
    { data: sampleBadUrls },
    { data: sampleQueue },
    { data: recentRuns },
  ] = await Promise.all([
    (supabase as any).from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    (supabase as any).from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active').not('application_url', 'is', null),
    (supabase as any).from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active').or('application_url.like.%grantwatch.com/cat/%,application_url.eq.https://candid.org/find-funding/,application_url.eq.https://candid.org/find-funding'),
    (supabase as any).from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active').is('source_url', null).is('application_url', null),
    (supabase as any).from('grant_matches').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
    (supabase as any).from('grant_matches').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    (supabase as any).from('notifications').select('*', { count: 'exact', head: true }).eq('read', false),
    // Sample any remaining bad application_url values
    (supabase as any).from('grants').select('id, title, source, application_url').eq('status', 'active').or('application_url.like.%grantwatch.com/cat/%,application_url.like.%candid.org/find-funding%').limit(5),
    // Sample the queued match queue
    (supabase as any).from('grant_matches').select('id, fit_score, grants(title, deadline, source, source_url, application_url)').eq('status', 'queued').order('fit_score', { ascending: false }).limit(10),
    // Recent scraper runs
    (supabase as any).from('scraper_runs').select('source, success, grants_found, grants_new, error_message, started_at').order('started_at', { ascending: false }).limit(10),
  ])

  return NextResponse.json({
    grants: {
      total_active: totalActive,
      with_application_url: hasApplicationUrl,
      listing_page_urls_remaining: listingUrlGrants,
      no_url_at_all: noUrl,
      sample_bad_urls: sampleBadUrls ?? [],
    },
    matches: {
      queued: queuedMatches,
      pending_review: pendingReviewMatches,
      sample_queue: sampleQueue ?? [],
    },
    notifications: {
      unread: unreadNotifications,
    },
    scraper_runs: recentRuns ?? [],
    timestamp: new Date().toISOString(),
  })
}
