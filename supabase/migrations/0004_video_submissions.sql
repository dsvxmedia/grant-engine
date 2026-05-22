create type render_status as enum ('pending', 'rendering', 'ready', 'approved', 'rejected', 'submitted');

create table video_submissions (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references grants(id) on delete cascade,
  grant_match_id uuid references grant_matches(id),
  entity_id uuid references business_entities(id),
  script_content text,
  video_url text,
  heygen_video_id text,
  voice_id text,
  render_status render_status default 'pending',
  ai_disclosure_included bool default true,
  duration_seconds int,
  approved_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger video_submissions_updated_at
  before update on video_submissions
  for each row execute function set_updated_at();
