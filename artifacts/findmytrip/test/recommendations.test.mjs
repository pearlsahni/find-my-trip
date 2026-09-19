import test from 'node:test';
import assert from 'node:assert/strict';
import { rankDestinations } from '../src/lib/recommendations.mjs';

const countries = [
  { slug: 'alpha', name: 'Alpha', region: 'Coast', known_for_summary: 'beaches and food markets', cities: [
    { slug: 'surf', name: 'Surf Town', identity_line: 'island beaches', best_for: ['beaches', 'food'], suggested_days_min: 2, suggested_days_max: 4 },
  ] },
  { slug: 'beta', name: 'Beta', region: 'North', known_for_summary: 'museums and heritage', cities: [
    { slug: 'old-city', name: 'Old City', identity_line: 'historic architecture', best_for: ['culture'], suggested_days_min: 2, suggested_days_max: 4 },
  ] },
];

test('ranks matching interests ahead of generic destinations', () => {
  const ranked = rankDestinations(countries, { interests: ['culture'], vibes: [], diet: [], companions: '', budget: '', skipped: {} });
  assert.equal(ranked[0].slug, 'old-city');
  assert.match(ranked[0].reason, /culture/);
});

test('uses stable slug ordering when scores tie', () => {
  const ranked = rankDestinations(countries, { interests: [], vibes: [], diet: [], companions: '', budget: '', skipped: {} });
  assert.deepEqual(ranked.map((item) => item.countrySlug), ['alpha', 'beta']);
});