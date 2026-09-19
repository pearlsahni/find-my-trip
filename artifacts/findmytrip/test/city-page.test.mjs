import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/pages/city-page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

test("canonical city route is public and uses the generated city hook", () => {
  assert.match(app, /path="\/c\/:countrySlug\/:citySlug"/);
  assert.match(page, /useGetCity\(countrySlug, citySlug\)/);
  assert.doesNotMatch(page, /ProtectedRoute|requireAuth/);
  assert.match(page, /link\[rel="canonical"\]/);
  assert.match(page, /City not found/);
});

test("city page includes required capped sections and logged-out actions", () => {
  assert.match(page, /Plan my days/);
  assert.match(page, /Save city/);
  assert.match(page, /Best months/);
  assert.match(page, /signature_places/);
  for (const id of ["areas", "activities", "food", "day-trips", "transport", "tips", "stays", "notes"]) {
    assert.match(page, new RegExp(`id="${id}"|id=\\{id\\}`));
  }
  assert.match(page, /const limit = 10/);
  assert.doesNotMatch(page, /alert\(/);
});

test("all city filters persist in URL state and analytics are instrumented", () => {
  for (const key of ["budget", "companion", "interest", "intensity", "duration", "indoor_outdoor", "vegetarian", "bookable"]) {
    assert.match(page, new RegExp(`['"]${key}['"]`));
  }
  for (const event of ["city_page_viewed", "section_expanded", "filter_applied", "signature_card_clicked", "affiliate_click"]) {
    assert.match(page, new RegExp(event));
  }
  assert.match(page, /history\.pushState/);
});

test("filters float outside the page layout and use city-specific options", () => {
  assert.match(styles, /\.filter-widget \{ position: fixed/);
  assert.doesNotMatch(page, /city-filter-bar/);
  assert.match(page, /getCityFilterOptions\(city\)/);
  assert.match(page, /options\.interests\.map/);
  assert.match(page, /Options reflect what \{city\.name\} is known for/);
  assert.match(page, /CityKnownForInsights/);
});

test("390px critical layout is explicit", () => {
  assert.match(styles, /@media \(max-width: 390px\)/);
  assert.match(styles, /\.city-page-wrapper \.practical-grid/);
  assert.match(styles, /\.signature-grid, \.places-grid/);
  assert.match(styles, /\.city-actions/);
});