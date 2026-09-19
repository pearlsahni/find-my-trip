ALTER TABLE countries
  ADD COLUMN IF NOT EXISTS guidance_source text,
  ADD COLUMN IF NOT EXISTS guidance_refresh_error text;

UPDATE countries
SET guidance_source = 'curated_launch_guidance'
WHERE guidance_source IS NULL;