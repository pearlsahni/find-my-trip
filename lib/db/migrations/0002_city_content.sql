CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  character text,
  good_for text[],
  cost_band text
);

CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  area_id uuid REFERENCES areas(id),
  google_place_id text UNIQUE,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  address text,
  opening_hours jsonb,
  cost_band_inr text,
  price_inr integer,
  avg_duration_mins smallint,
  physical_intensity smallint,
  best_time_of_day text,
  suits_solo boolean DEFAULT true,
  suits_couples boolean DEFAULT true,
  suits_friends boolean DEFAULT true,
  suits_family boolean DEFAULT true,
  suits_parents boolean DEFAULT true,
  veg_friendly boolean,
  indoor_outdoor text,
  vibe_tags text[],
  is_signature boolean DEFAULT false,
  booking_url text,
  affiliate_partner text,
  travel_time_mins smallint,
  transport_mode text,
  overnight_recommended boolean,
  last_verified timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  note text,
  veg boolean
);

CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  scope_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  priority smallint DEFAULT 3,
  last_verified timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS traveller_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  attribution text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  model text,
  dropped_count integer DEFAULT 0,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS areas_city_id_idx ON areas(city_id);
CREATE INDEX IF NOT EXISTS places_city_type_idx ON places(city_id, type);
CREATE INDEX IF NOT EXISTS places_city_signature_idx ON places(city_id, is_signature);
CREATE INDEX IF NOT EXISTS tips_scope_idx ON tips(scope, scope_id);