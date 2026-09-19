CREATE TABLE IF NOT EXISTS "traveler_profiles" (
  "clerk_user_id" text PRIMARY KEY,
  "preferences" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);