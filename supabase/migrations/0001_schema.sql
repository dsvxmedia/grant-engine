-- Enums
create type funder_type as enum ('federal', 'state', 'foundation', 'corporate', 'niche');
create type grant_status as enum ('active', 'expired', 'archived');
create type match_status as enum ('queued', 'drafting', 'qa_review', 'pending_review', 'approved', 'submitted', 'rejected', 'archived');
create type application_status as enum ('drafting', 'qa_failed', 'pending_review', 'approved', 'submitted', 'rejected', 'withdrawn');
create type outcome_status as enum ('pending', 'awarded', 'rejected', 'withdrawn');
create type loi_status as enum ('draft', 'submitted', 'accepted', 'rejected');
create type relationship_strength as enum ('none', 'aware', 'warm', 'strong');

-- Business entities
create table business_entities (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references business_entities(id),
  name text not null, type text not null,
  industry text, naics_codes text[], founding_date date,
  state text, city text, zip_codes_served text[],
  revenue_range text, employee_count int,
  mission text, focus_area text,
  is_african_american_owned bool default false,
  is_minority_owned bool default false,
  is_underserved_community_tied bool default false,
  is_tech_company bool default false,
  is_social_enterprise bool default false,
  is_community_serving bool default false,
  owner_demographics jsonb default '{}',
  geographic_ties jsonb default '{}',
  who_we_serve text[],
  sam_registered bool default false, sam_uei varchar(12), cage_code varchar(5),
  sbir_eligible bool default false, sbir_phases text[],
  pitch_angles_generated jsonb default '[]',
  uploaded_documents text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Founder profile
create table founder_profile (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null, origin_story text,
  why_i_started jsonb default '{}',
  personal_community_ties text,
  key_milestones jsonb default '[]',
  press_recognition jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Impact metrics (V1 passive, V2 active)
create table impact_metrics (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references business_entities(id) on delete cascade,
  metric_name text not null, metric_value numeric not null,
  metric_unit text, time_period text, geography text, source text,
  updated_at timestamptz default now()
);

-- Grants
create table grants (
  id uuid primary key default gen_random_uuid(),
  source text not null, source_url text, application_url text,
  title text not null, description text,
  funder_name text, funder_type funder_type,
  award_min int, award_max int, deadline timestamptz,
  eligibility_text text, eligibility_tags text[], category_tags text[],
  geographic_restrictions jsonb default '{}',
  requires_loi bool default false, loi_deadline timestamptz,
  requires_video bool default false,
  coalition_preferred bool default false,
  competition_estimate int,
  content_hash varchar(64) unique,
  raw_html_snapshot text,
  predicted_reopen_date date,
  is_new_program bool default false,
  status grant_status default 'active',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index grants_deadline_idx on grants(deadline);
create index grants_status_idx on grants(status);
create index grants_content_hash_idx on grants(content_hash);

-- Grant cycles (for calendar engine)
create table grant_cycles (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references grants(id) on delete cascade,
  year int not null, open_date date, close_date date, award_date date,
  recipients jsonb default '[]', predicted_next_open date,
  created_at timestamptz default now()
);

-- Matching
create table grant_matches (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references grants(id) on delete cascade,
  entity_id uuid references business_entities(id) on delete cascade,
  hard_filter_passed bool not null, hard_filter_failures text[],
  fit_score numeric(4,1), competitive_density_score numeric(4,1),
  matched_angles text[],
  status match_status default 'queued',
  created_at timestamptz default now(),
  unique(grant_id, entity_id)
);
create index grant_matches_status_idx on grant_matches(status);
create index grant_matches_fit_score_idx on grant_matches(fit_score desc);

-- LOI
create table loi_submissions (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references grants(id) on delete cascade,
  entity_id uuid references business_entities(id),
  loi_content text, loi_pdf_url text,
  submitted_at timestamptz, status loi_status default 'draft',
  full_application_triggered bool default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Applications
create table grant_applications (
  id uuid primary key default gen_random_uuid(),
  grant_match_id uuid references grant_matches(id),
  loi_submission_id uuid references loi_submissions(id),
  entity_id uuid references business_entities(id) on delete cascade,
  grant_id uuid references grants(id) on delete cascade,
  draft_content jsonb default '{}',
  draft_pdf_url text, draft_docx_url text,
  research_notes jsonb default '{}',
  selected_angles text[], selected_framework text,
  humanizer_applied bool default false,
  uniqueness_score numeric(3,2),
  qa_scores jsonb default '{}', qa_passed bool, qa_retry_count int default 0,
  status application_status default 'drafting',
  submission_url text, deadline timestamptz,
  submitted_at timestamptz,
  outcome outcome_status, outcome_amount int,
  rejection_reason text, feedback_requested_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index applications_status_idx on grant_applications(status);
create index applications_deadline_idx on grant_applications(deadline);

-- Scraper health
create table scraper_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz default now(), completed_at timestamptz,
  grants_found int default 0, grants_new int default 0,
  error_message text, success bool
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null, title text not null, body text,
  metadata jsonb default '{}', read bool default false,
  created_at timestamptz default now()
);

-- V1 passive collection for V2
create table program_officers (
  id uuid primary key default gen_random_uuid(),
  funder_name text not null, funder_id uuid references grants(id),
  name text, title text, email text, linkedin_url text,
  focus_areas text[], contact_history jsonb default '[]',
  last_outreach_date date,
  relationship_strength relationship_strength default 'none',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table partner_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, mission text, type text, location text,
  contact_name text, contact_email text,
  relationship_strength relationship_strength default 'none',
  prior_collaborations jsonb default '[]',
  created_at timestamptz default now()
);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger business_entities_updated_at before update on business_entities for each row execute function set_updated_at();
create trigger grants_updated_at before update on grants for each row execute function set_updated_at();
create trigger grant_applications_updated_at before update on grant_applications for each row execute function set_updated_at();
create trigger loi_submissions_updated_at before update on loi_submissions for each row execute function set_updated_at();
create trigger program_officers_updated_at before update on program_officers for each row execute function set_updated_at();

-- Row-level security (open policies for V1 — locked down in Plan 8)
alter table business_entities enable row level security;
alter table grants enable row level security;
alter table grant_matches enable row level security;
alter table grant_applications enable row level security;
alter table loi_submissions enable row level security;
alter table notifications enable row level security;

create policy "allow authenticated" on business_entities for all using (true);
create policy "allow authenticated" on grants for all using (true);
create policy "allow authenticated" on grant_matches for all using (true);
create policy "allow authenticated" on grant_applications for all using (true);
create policy "allow authenticated" on loi_submissions for all using (true);
create policy "allow authenticated" on notifications for all using (true);
