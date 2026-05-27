-- Add matching_active flag to business_entities
-- Allows the matching engine to focus on specific entities without deleting others.
-- Only entities with matching_active = true are included in matching runs.

alter table business_entities
  add column if not exists matching_active boolean not null default false;

-- Set TCS and FlowTech as the active matching entities
update business_entities
  set matching_active = true
  where name in ('The Clearstate System', 'FlowTech Ventures');
