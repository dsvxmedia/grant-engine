-- Store per-dimension fit score components alongside the final score.
-- Nullable so existing rows and rows where scoring failed remain valid.
ALTER TABLE grant_matches ADD COLUMN score_components JSONB;
