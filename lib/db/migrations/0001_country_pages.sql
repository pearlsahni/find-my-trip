CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  region text,
  known_for_summary text,
  visa_status_in text,
  visa_cost_inr integer,
  visa_process_notes text,
  currency text,
  daily_cost_inr jsonb,
  best_months smallint[],
  domestic_transport text,
  safety_score smallint,
  suggested_routes jsonb,
  when_to_go jsonb,
  guidance_source text,
  guidance_refresh_error text,
  last_verified timestamptz NOT NULL DEFAULT now(),
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  identity_line text,
  known_for_summary text,
  ideal_days_min smallint,
  ideal_days_max smallint,
  daily_cost_inr jsonb,
  best_months smallint[],
  crowd_by_month smallint[],
  flight_time_from jsonb,
  direct_flight boolean,
  safety_score smallint,
  solo_female_score smallint,
  veg_food_score smallint,
  getting_around jsonb,
  vibe_tags text[],
  last_verified timestamptz NOT NULL DEFAULT now(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_id, slug)
);
-- Curated factual launch index. Generated copy is deliberately kept in the
-- application seed/service separate from visa, cost, transport and coordinates.
INSERT INTO countries (slug, name, region, currency, visa_status_in, visa_cost_inr, best_months, safety_score)
VALUES
 ('thailand','Thailand','Southeast Asia','Thai baht (THB)','visa_free',0,ARRAY[1,2,3,10,11,12],4),
 ('indonesia','Indonesia','Southeast Asia','Indonesian rupiah (IDR)','voa',2500,ARRAY[4,5,6,7,8,9],4),
 ('uae','United Arab Emirates','West Asia','UAE dirham (AED)','embassy',7500,ARRAY[1,2,3,10,11,12],4),
 ('singapore','Singapore','Southeast Asia','Singapore dollar (SGD)','e_visa',2500,ARRAY[1,2,3,6,7,8,11,12],5),
 ('vietnam','Vietnam','Southeast Asia','Vietnamese dong (VND)','e_visa',2100,ARRAY[2,3,4,10,11,12],4),
 ('georgia','Georgia','Caucasus','Georgian lari (GEL)','visa_free',0,ARRAY[5,6,7,8,9,10],4),
 ('azerbaijan','Azerbaijan','Caucasus','Azerbaijani manat (AZN)','e_visa',2100,ARRAY[4,5,6,9,10],4),
 ('nepal','Nepal','South Asia','Nepalese rupee (NPR)','voa',2500,ARRAY[3,4,5,10,11],4),
 ('sri-lanka','Sri Lanka','South Asia','Sri Lankan rupee (LKR)','e_visa',2500,ARRAY[1,2,3,12],4),
 ('japan','Japan','East Asia','Japanese yen (JPY)','embassy',0,ARRAY[3,4,5,10,11],5),
 ('malaysia','Malaysia','Southeast Asia','Malaysian ringgit (MYR)','visa_free',0,ARRAY[1,2,6,7,8,12],4),
 ('turkey','Turkey','Europe and West Asia','Turkish lira (TRY)','e_visa',4200,ARRAY[4,5,6,9,10],4)
ON CONFLICT (slug) DO NOTHING;

UPDATE countries SET when_to_go = jsonb_build_array(
  jsonb_build_object('month',1,'label','Jan','score',4), jsonb_build_object('month',2,'label','Feb','score',4),
  jsonb_build_object('month',3,'label','Mar','score',4), jsonb_build_object('month',4,'label','Apr','score',3),
  jsonb_build_object('month',5,'label','May','score',3), jsonb_build_object('month',6,'label','Jun','score',2),
  jsonb_build_object('month',7,'label','Jul','score',2), jsonb_build_object('month',8,'label','Aug','score',2),
  jsonb_build_object('month',9,'label','Sep','score',3), jsonb_build_object('month',10,'label','Oct','score',4),
  jsonb_build_object('month',11,'label','Nov','score',4), jsonb_build_object('month',12,'label','Dec','score',4)
) WHERE when_to_go IS NULL;

UPDATE countries
SET visa_process_notes = COALESCE(visa_process_notes, CASE visa_status_in
  WHEN 'visa_free' THEN 'Verify the current short-stay entry allowance before departure.'
  WHEN 'voa' THEN 'Use the designated arrival counter and carry passport validity and onward-ticket evidence.'
  WHEN 'e_visa' THEN 'Apply online before departure and verify the permitted entry port.'
  ELSE 'Apply through the relevant embassy or authorised visa centre before booking.'
END),
guidance_source = COALESCE(guidance_source, 'curated_launch_guidance'),
domestic_transport = COALESCE(domestic_transport, 'Domestic flights, trains and licensed taxis connect the main visitor hubs.'),
suggested_routes = COALESCE(suggested_routes, jsonb_build_array(
  jsonb_build_object('name', name || ' highlights', 'cities', jsonb_build_array(name), 'days', 7),
  jsonb_build_object('name', name || ' slower route', 'cities', jsonb_build_array(name), 'days', 6)
));

INSERT INTO cities (country_id, slug, name, lat, lng, ideal_days_min, ideal_days_max, vibe_tags)
SELECT c.id, v.slug, v.name, v.lat, v.lng, 2, 4, v.tags
FROM countries c
JOIN (VALUES
 ('thailand','bangkok','Bangkok',13.7563,100.5018,ARRAY['food','first trips']::text[]),
 ('thailand','chiang-mai','Chiang Mai',18.7883,98.9853,ARRAY['culture','slow travel']::text[]),
 ('thailand','phuket','Phuket',7.8804,98.3923,ARRAY['beaches','islands']::text[]),
 ('indonesia','bali','Bali',-8.4095,115.1889,ARRAY['beaches','wellness']::text[]),
 ('indonesia','jakarta','Jakarta',-6.2088,106.8456,ARRAY['food','city breaks']::text[]),
 ('uae','dubai','Dubai',25.2048,55.2708,ARRAY['shopping','architecture']::text[]),
 ('uae','abu-dhabi','Abu Dhabi',24.4539,54.3773,ARRAY['museums','family']::text[]),
 ('singapore','singapore','Singapore',1.3521,103.8198,ARRAY['food','family']::text[]),
 ('vietnam','hanoi','Hanoi',21.0278,105.8342,ARRAY['food','culture']::text[]),
 ('vietnam','da-nang','Da Nang',16.0544,108.2022,ARRAY['beaches','food']::text[]),
 ('vietnam','ho-chi-minh-city','Ho Chi Minh City',10.8231,106.6297,ARRAY['food','city breaks']::text[]),
 ('georgia','tbilisi','Tbilisi',41.7151,44.8271,ARRAY['food','culture']::text[]),
 ('georgia','batumi','Batumi',41.6168,41.6367,ARRAY['coast','slow travel']::text[]),
 ('azerbaijan','baku','Baku',40.4093,49.8671,ARRAY['architecture','food']::text[]),
 ('nepal','kathmandu','Kathmandu',27.7172,85.3240,ARRAY['culture','mountains']::text[]),
 ('nepal','pokhara','Pokhara',28.2096,83.9856,ARRAY['mountains','slow travel']::text[]),
 ('sri-lanka','colombo','Colombo',6.9271,79.8612,ARRAY['food','city breaks']::text[]),
 ('sri-lanka','kandy','Kandy',7.2906,80.6337,ARRAY['culture','mountains']::text[]),
 ('japan','tokyo','Tokyo',35.6762,139.6503,ARRAY['food','city breaks']::text[]),
 ('japan','kyoto','Kyoto',35.0116,135.7681,ARRAY['culture','slow travel']::text[]),
 ('japan','osaka','Osaka',34.6937,135.5023,ARRAY['food','city breaks']::text[]),
 ('malaysia','kuala-lumpur','Kuala Lumpur',3.1390,101.6869,ARRAY['food','shopping']::text[]),
 ('malaysia','langkawi','Langkawi',6.3500,99.8000,ARRAY['beaches','islands']::text[]),
 ('turkey','istanbul','Istanbul',41.0082,28.9784,ARRAY['history','food']::text[]),
 ('turkey','cappadocia','Cappadocia',38.6431,34.8289,ARRAY['landscapes','adventure']::text[])
) AS v(country_slug, slug, name, lat, lng, tags) ON c.slug = v.country_slug
ON CONFLICT (country_id, slug) DO NOTHING;