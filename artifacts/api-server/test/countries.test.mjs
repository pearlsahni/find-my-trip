import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomInt } from "node:crypto";
import { test, before, after } from "node:test";
import { readFile } from "node:fs/promises";
import pg from "pg";

const port = randomInt(32000, 39000);
const schema = `country_pages_test_${randomInt(100000, 999999)}`;
let server;
let adminPool;
const url = (path) => `http://127.0.0.1:${port}${path}`;

before(async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for country integration tests");
  adminPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  const isolatedUrl = new URL(process.env.DATABASE_URL);
  isolatedUrl.searchParams.set("options", `-c search_path=${schema}`);
  const migrations = await Promise.all(
    ["0001_country_pages.sql", "0003_country_top_dishes.sql", "0004_traveler_profiles.sql"].map((name) =>
      readFile(new URL(`../../../lib/db/migrations/${name}`, import.meta.url), "utf8"),
    ),
  );
  const isolatedPool = new pg.Pool({ connectionString: isolatedUrl.toString() });
  try {
    for (const migration of migrations) await isolatedPool.query(migration);
  } finally {
    await isolatedPool.end();
  }
  server = spawn(process.execPath, [fileURLToPath(new URL("../dist/index.mjs", import.meta.url))], {
    env: { ...process.env, DATABASE_URL: isolatedUrl.toString(), PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let startupError = "";
  server.stderr.on("data", (chunk) => { startupError += chunk.toString(); });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("API server did not start")), 10_000);
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`API server exited (${code}): ${startupError}`));
    });
    const poll = async () => {
      try {
        if ((await fetch(url("/api/healthz"))).ok) {
          clearTimeout(timer);
          resolve();
        } else setTimeout(poll, 50);
      } catch {
        setTimeout(poll, 50);
      }
    };
    poll();
  });
});

after(async () => {
  server?.kill("SIGTERM");
  if (adminPool) {
    await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await adminPool.end();
  }
});

test("a freshly migrated database serves all launch countries", async () => {
  const slugs = [
    "thailand", "indonesia", "uae", "singapore", "vietnam", "georgia",
    "azerbaijan", "nepal", "sri-lanka", "japan", "malaysia", "turkey",
  ];
  for (const slug of slugs) {
    const response = await fetch(url(`/api/countries/${slug}`));
    assert.equal(response.status, 200, `${slug} should load after a clean migration`);
    const country = await response.json();
    assert.equal(country.slug, slug);
    assert.equal(country.monthly.length, 12);
    assert.ok(country.cities.length > 0);
    assert.ok(country.daily_cost_inr.budget > 0);
    assert.ok(country.top_dishes.length >= 4);
  }
});

test("profile preferences preserve public browsing and protect account writes", async () => {
  const publicProfile = await fetch(url("/api/me/preferences"));
  assert.equal(publicProfile.status, 200);
  assert.deepEqual(await publicProfile.json(), { user_id: null, preferences: null });

  const protectedWrite = await fetch(url("/api/me/preferences"), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vibes: ["easygoing"],
      companions: "solo",
      interests: ["culture"],
      budget: "50k-1l",
      diet: ["vegetarian"],
      skipped: {},
    }),
  });
  assert.equal(protectedWrite.status, 401);
  assert.equal((await protectedWrite.json()).error.code, "UNAUTHORIZED");
});

test("country response is complete and respects caps", async () => {
  const response = await fetch(url("/api/countries/thailand"));
  assert.equal(response.status, 200);
  const country = await response.json();
  assert.equal(country.slug, "thailand");
  assert.equal(country.monthly.length, 12);
  assert.ok(country.suggested_routes.length >= 2 && country.suggested_routes.length <= 4);
  assert.ok(country.cities.length <= 20);
  assert.ok(country.known_for_summary.split(/\s+/).length <= 60);
  assert.match(country.last_verified, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(country.visa_process_notes.length <= 300);
  for (const city of country.cities) {
    assert.ok(city.best_for.length <= 5);
    assert.ok(city.identity_line.split(/\s+/).length <= 12);
    assert.match(`/c/${country.slug}/${city.slug}`, /^\/c\/thailand\/[a-z0-9-]+$/);
  }
});

test("country guides use destination-specific costs, seasons, routes, and city identities", async () => {
  const [thailand, indonesia, japan, uae] = await Promise.all(
    ["thailand", "indonesia", "japan", "uae"].map((slug) =>
      fetch(url(`/api/countries/${slug}`)).then((response) => response.json()),
    ),
  );

  assert.equal(new Set([thailand, indonesia, japan, uae].map((country) => JSON.stringify(country.daily_cost_inr))).size, 4);
  assert.notDeepEqual(thailand.monthly.map(({ score }) => score), indonesia.monthly.map(({ score }) => score));
  assert.notDeepEqual(japan.suggested_routes.map(({ name }) => name), uae.suggested_routes.map(({ name }) => name));
  assert.match(thailand.cities[0].identity_line, /temple|street food|river/i);
  assert.match(japan.cities.find(({ slug }) => slug === "tokyo").identity_line, /neon|sushi|rail|design/i);
  assert.match(thailand.top_dishes.map(({ name }) => name).join(" "), /pad thai|tom yum|som tam/i);
  assert.match(japan.top_dishes.map(({ name }) => name).join(" "), /sushi|ramen|okonomiyaki/i);
});

test("fresh reads are cached and force generation refreshes", async () => {
  const first = await (await fetch(url("/api/countries/japan"))).json();
  const cached = await (await fetch(url("/api/generate/country"), {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ countrySlug: "japan" }),
  })).json();
  assert.equal(cached.generated_at, first.generated_at);
  const refreshed = await (await fetch(url("/api/generate/country"), {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ countrySlug: "japan", force: true }),
  })).json();
  assert.notEqual(refreshed.generated_at, first.generated_at);
  assert.equal(refreshed.visa_status_in, first.visa_status_in);
  assert.equal(refreshed.currency, first.currency);
  assert.equal(refreshed.last_verified, first.last_verified);
});

test("scheduled factual refresh uses last_verified without replacing generated copy", async () => {
  const before = await (await fetch(url("/api/countries/thailand"))).json();
  const staleDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  await adminPool.query(
    `UPDATE "${schema}".countries
     SET last_verified = $1, visa_process_notes = 'preserve until approved refresh'
     WHERE slug = 'thailand'`,
    [staleDate],
  );
  const isolatedUrl = new URL(process.env.DATABASE_URL);
  isolatedUrl.searchParams.set("options", `-c search_path=${schema}`);
  const refresh = spawnSync(process.execPath, [
    fileURLToPath(new URL("../dist/refresh-country-guidance.mjs", import.meta.url)),
  ], {
    env: {
      ...process.env,
      DATABASE_URL: isolatedUrl.toString(),
    },
    encoding: "utf8",
  });
  assert.equal(refresh.status, 0, refresh.stderr);
  const after = await (await fetch(url("/api/countries/thailand"))).json();
  assert.equal(after.generated_at, before.generated_at);
  assert.notEqual(after.last_verified, staleDate.toISOString());
  assert.notEqual(after.visa_process_notes, "preserve until approved refresh");
});

test("unknown and invalid country slugs use structured errors", async () => {
  const missing = await fetch(url("/api/countries/not-a-country"));
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), {
    error: { code: "COUNTRY_NOT_FOUND", message: "Country not found" },
  });
  const invalid = await fetch(url("/api/countries/Bad%20Slug"));
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "INVALID_SLUG");
});

test("city reads are public, capped, verified, and fresh-cache aware", async () => {
  const firstResponse = await fetch(url("/api/cities/thailand/bangkok"));
  assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  assert.equal(first.slug, "bangkok");
  assert.equal(first.cached, false);
  assert.equal(first.signature_places.length, 5);
  assert.equal(first.dropped_count, 0);
  assert.ok(first.areas.length >= 3 && first.areas.length <= 5);
  assert.ok(first.activities.length <= 20);
  assert.ok(first.restaurants.length <= 8);
  assert.ok(first.day_trips.length <= 4);
  assert.ok(first.stays.length <= 6);
  assert.ok(first.traveller_notes.length <= 5);
  for (const collection of [first.signature_places, first.activities, first.restaurants, first.day_trips, first.stays]) {
    for (const place of collection) {
      assert.ok(place.google_place_id, `${place.name} must be resolved`);
      assert.notEqual(place.name, "Unresolved candidate");
    }
  }
  const second = await (await fetch(url("/api/cities/thailand/bangkok"))).json();
  assert.equal(second.cached, true);
  assert.equal(second.generated_at, first.generated_at);
});

test("city guides expose destination-specific themes", async () => {
  const tokyo = await (await fetch(url("/api/cities/japan/tokyo"))).json();
  const bali = await (await fetch(url("/api/cities/indonesia/bali"))).json();

  assert.notEqual(tokyo.known_for_summary, bali.known_for_summary);
  assert.match(tokyo.known_for_summary, /Asakusa|Senso-ji|sushi/);
  assert.match(bali.known_for_summary, /Ubud|Besakih|nasi campur/i);
  assert.deepEqual(bali.areas.map(({ name }) => name), ["Ubud", "Seminyak", "Sanur"]);
  assert.deepEqual(bali.dishes.map(({ name }) => name), ["Nasi campur Bali", "Babi guling", "Lawar"]);
  assert.equal(tokyo.activities.length, 0);
  assert.equal(bali.activities.length, 0);
  assert.deepEqual(
    tokyo.signature_places.filter((place) => tokyo.activities.some((activity) => activity.name === place.name)),
    [],
  );
});

test("every launch city returns named local content without shared placeholders", async () => {
  const countrySlugs = [
    "thailand", "indonesia", "uae", "singapore", "vietnam", "georgia",
    "azerbaijan", "nepal", "sri-lanka", "japan", "malaysia", "turkey",
  ];
  const countries = await Promise.all(
    countrySlugs.map((slug) => fetch(url(`/api/countries/${slug}`)).then((response) => response.json())),
  );
  const cityRequests = countries.flatMap((country) =>
    country.cities.map((city) => ({ country: country.slug, city: city.slug })),
  );
  const guides = await Promise.all(
    cityRequests.map(({ country, city }) =>
      fetch(url(`/api/cities/${country}/${city}`)).then((response) => response.json()),
    ),
  );
  const placeholderPattern = /"name":"(?:Old Centre|Market District|Local breakfast|Market snack|Seasonal sweet|Unresolved candidate|[^"]*Table \d|[^"]*day trip \d)"/i;

  assert.equal(guides.length, cityRequests.length);
  for (const guide of guides) {
    assert.equal(guide.signature_places.length, 5, `${guide.name} should have five signatures`);
    assert.equal(guide.activities.length, 0, `${guide.name} should not contain generated activity claims`);
    assert.equal(guide.areas.length, 3, `${guide.name} should have named areas`);
    assert.equal(guide.dishes.length, 3, `${guide.name} should have named dishes`);
    assert.equal(guide.dropped_count, 0);
    assert.doesNotMatch(JSON.stringify(guide), placeholderPattern);
    const signatureNames = new Set(guide.signature_places.map((place) => place.name));
    assert.ok(guide.activities.every((place) => !signatureNames.has(place.name)), `${guide.name} activities must not duplicate signatures`);
    assert.equal(new Set(guide.restaurants.map((place) => place.name.toLowerCase())).size, guide.restaurants.length, `${guide.name} restaurant names must be unique`);
    assert.equal(new Set(guide.restaurants.map((place) => place.google_place_id)).size, guide.restaurants.length, `${guide.name} restaurant identifiers must be unique`);
  }
});

test("generated copy does not invent venue, dish, or neighbourhood relationships", async () => {
  const [tokyo, kualaLumpur, lombok] = await Promise.all([
    fetch(url("/api/cities/japan/tokyo")).then((response) => response.json()),
    fetch(url("/api/cities/malaysia/kuala-lumpur")).then((response) => response.json()),
    fetch(url("/api/cities/indonesia/lombok")).then((response) => response.json()),
  ]);

  for (const guide of [tokyo, kualaLumpur, lombok]) {
    assert.equal(guide.activities.length, 0);
    assert.ok(guide.areas.every((area) => !/close to/i.test(area.character)));
    assert.ok(guide.dishes.every((dish) => !/ at .+ while exploring /i.test(dish.note)));
    assert.ok(guide.restaurants.every((place) => !/trying .+; check/i.test(place.description)));
    assert.ok(guide.stays.every((place) => !/suits a stay around/i.test(place.description)));
  }
  assert.ok(lombok.stays.some((stay) => stay.name === "Jati Kuta Lombok"));
  assert.ok(kualaLumpur.restaurants.some((restaurant) => restaurant.name.includes("Petaling Jaya")));
});

test("city guides use city-specific travel seasons", async () => {
  const [bali, jakarta, tokyo, bangkok] = await Promise.all([
    fetch(url("/api/cities/indonesia/bali")).then((response) => response.json()),
    fetch(url("/api/cities/indonesia/jakarta")).then((response) => response.json()),
    fetch(url("/api/cities/japan/tokyo")).then((response) => response.json()),
    fetch(url("/api/cities/thailand/bangkok")).then((response) => response.json()),
  ]);

  assert.deepEqual(bali.best_months, [5, 6, 7, 8, 9]);
  assert.deepEqual(jakarta.best_months, [6, 7, 8, 9]);
  assert.deepEqual(tokyo.best_months, [3, 4, 5, 10, 11]);
  assert.deepEqual(bangkok.best_months, [1, 2, 11, 12]);
  assert.notDeepEqual(bali.best_months, jakarta.best_months);
});

test("city generation validates input, supports force, and returns structured misses", async () => {
  const cached = await (await fetch(url("/api/generate/city"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ countrySlug: "thailand", citySlug: "bangkok" }),
  })).json();
  assert.equal(cached.cached, true);
  const forced = await (await fetch(url("/api/generate/city"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ countrySlug: "thailand", citySlug: "bangkok", force: true }),
  })).json();
  assert.equal(forced.cached, false);
  assert.equal(typeof forced.droppedCount, "number");

  const invalid = await fetch(url("/api/cities/Thailand/Bad%20Slug"));
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "INVALID_SLUG");
  const missing = await fetch(url("/api/cities/thailand/unknown-city"));
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, "CITY_NOT_FOUND");
});