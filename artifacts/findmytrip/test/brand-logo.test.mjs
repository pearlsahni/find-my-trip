import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const brandSource = await readFile(new URL("../src/components/brand-logo.tsx", import.meta.url), "utf8");
const pageSources = await Promise.all(
  ["country-page.tsx", "city-page.tsx", "discover.tsx", "onboarding.tsx"].map((name) =>
    readFile(new URL(`../src/pages/${name}`, import.meta.url), "utf8"),
  ),
);

test("all primary pages use the shared FindMyTrip logo", () => {
  for (const source of pageSources) assert.match(source, /<BrandLogo/);
  assert.match(brandSource, /<Compass/);
  assert.match(brandSource, /<span>findmytrip<\/span>/);
  assert.match(brandSource, /h-9 w-9/);
});