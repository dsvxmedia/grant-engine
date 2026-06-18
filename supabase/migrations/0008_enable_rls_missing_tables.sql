-- Enable RLS on tables that were missing it (flagged by Supabase security advisor)
-- Matches the V1 open-policy pattern from 0001_schema.sql; locked down in Plan 8.

alter table founder_profile enable row level security;
alter table impact_metrics enable row level security;
alter table grant_cycles enable row level security;
alter table scraper_runs enable row level security;
alter table program_officers enable row level security;
alter table partner_organizations enable row level security;
alter table video_submissions enable row level security;

create policy "allow authenticated" on founder_profile for all using (true);
create policy "allow authenticated" on impact_metrics for all using (true);
create policy "allow authenticated" on grant_cycles for all using (true);
create policy "allow authenticated" on scraper_runs for all using (true);
create policy "allow authenticated" on program_officers for all using (true);
create policy "allow authenticated" on partner_organizations for all using (true);
create policy "allow authenticated" on video_submissions for all using (true);
