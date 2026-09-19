import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const pageSource = await readFile(
  new URL("../src/pages/country-page.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

test("country pages are public and use the generated API contract", () => {
  assert.match(appSource, /path="\/c\/:countrySlug"/);
  assert.doesNotMatch(appSource + pageSource, /ProtectedRoute|requireAuth|useAuth/);
  assert.match(pageSource, /useGetCountry\(slug\)/);
  assert.match(pageSource, /country\.known_for_summary/);
  assert.match(pageSource, /country\.top_dishes/);
  assert.match(pageSource, /Top dishes to try/);
});

test("city cards keep canonical country and city slugs", () => {
  const canonicalLinks = pageSource.match(/href=\{`\/c\/\$\{country\.slug\}\/\$\{city\.slug\}`\}/g) ?? [];
  assert.equal(canonicalLinks.length, 1);
  assert.match(pageSource, /country\.cities\.map/);
  assert.doesNotMatch(pageSource, /link-bottom-city-/);
  assert.match(pageSource, /city\.suggested_days_min/);
  assert.match(pageSource, /city\.best_for/);
});

test("city-state countries embed their city guide instead of linking to a duplicate city page", () => {
  assert.match(pageSource, /country\.cities\.length === 1/);
  assert.match(pageSource, /country\.cities\[0\]\?\.slug === country\.slug/);
  assert.match(pageSource, /<SingleCityCountryGuide/);
  assert.match(pageSource, /<EmbeddedCityGuide/);
});

test("mobile and successful-view behavior remain explicit", () => {
  assert.match(styles, /@media \(max-width: 390px\)/);
  assert.match(pageSource, /trackedSlug\.current !== country\.slug/);
  assert.match(pageSource, /country_page_viewed/);
  assert.match(pageSource, /Country not found/);
  assert.match(pageSource, /Something went wrong/);
  assert.match(pageSource, /No country information yet/);
});