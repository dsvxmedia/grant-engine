-- Add nonprofit and fiscal sponsor eligibility fields.
-- Many community/equity grants require 501(c)(3) status. Without these flags
-- the eligibility filter passes nonprofit-only grants through for LLC entities.

alter table grants
  add column if not exists requires_nonprofit boolean not null default false,
  add column if not exists fiscal_sponsor_eligible boolean not null default false;

alter table business_entities
  add column if not exists has_fiscal_sponsor boolean not null default false;

comment on column grants.requires_nonprofit is 'True if the grant requires the applicant to be a registered 501(c)(3) nonprofit.';
comment on column grants.fiscal_sponsor_eligible is 'True if the grant accepts applications from for-profits/LLCs with a fiscal sponsor.';
comment on column business_entities.has_fiscal_sponsor is 'True if this entity has an active fiscal sponsorship arrangement.';
