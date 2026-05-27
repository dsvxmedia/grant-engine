-- Add grant_narrative column to business_entities
-- This stores the pre-written, filing-ready narrative from grant_narratives.yaml
-- The writing pipeline uses it as the foundational context for Pass 1 (first draft)
alter table business_entities
  add column if not exists grant_narrative text;
