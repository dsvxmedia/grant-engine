-- Clean up application_url values that are listing/category pages rather than actual grant application URLs.
-- These were stored by scraper runs before URL sanitization was added.

-- GrantWatch category listing pages (e.g. grantwatch.com/cat/13/small-business-grants.html)
UPDATE grants
SET application_url = NULL
WHERE application_url LIKE '%grantwatch.com/cat/%';

-- Candid generic find-funding listing page
UPDATE grants
SET application_url = NULL
WHERE application_url IN (
  'https://candid.org/find-funding/',
  'https://candid.org/find-funding'
);

-- After nulling bad application URLs, archive grants that now have no URL at all
-- (both source_url and application_url are null) — no way for anyone to find or apply to these.
-- Preserve any that have application history.
DELETE FROM grant_matches
WHERE grant_id IN (
  SELECT id FROM grants
  WHERE source_url IS NULL
    AND application_url IS NULL
    AND status = 'active'
    AND id NOT IN (SELECT DISTINCT grant_id FROM grant_applications WHERE grant_id IS NOT NULL)
    AND id NOT IN (SELECT DISTINCT grant_id FROM loi_submissions WHERE grant_id IS NOT NULL)
);

DELETE FROM grants
WHERE source_url IS NULL
  AND application_url IS NULL
  AND status = 'active'
  AND id NOT IN (SELECT DISTINCT grant_id FROM grant_applications WHERE grant_id IS NOT NULL)
  AND id NOT IN (SELECT DISTINCT grant_id FROM loi_submissions WHERE grant_id IS NOT NULL);
