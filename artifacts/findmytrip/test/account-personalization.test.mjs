import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('profile queries and caches are isolated by Clerk user id', async () => {
  const [discover, onboarding, storage] = await Promise.all([
    read('../src/pages/discover.tsx'),
    read('../src/pages/onboarding.tsx'),
    read('../src/lib/traveler-preferences.ts'),
  ]);

  assert.match(discover, /getGetTravelerProfileQueryKey\(\), userId/);
  assert.match(onboarding, /getGetTravelerProfileQueryKey\(\), userId/);
  assert.match(storage, /ACCOUNT_CACHE_PREFIX.*userId/s);
  assert.match(onboarding, /hydratedUserId === userId/);
});

test('anonymous transfer updates the authoritative profile cache before editing', async () => {
  const [discover, onboarding] = await Promise.all([
    read('../src/pages/discover.tsx'),
    read('../src/pages/onboarding.tsx'),
  ]);

  assert.match(discover, /queryClient\.setQueryData\(profileQueryKey, savedProfile\)/);
  assert.match(onboarding, /queryClient\.setQueryData\(profileQueryKey, savedProfile\)/);
  assert.match(discover, /clearLocalPreferences\(\)/);
  assert.match(onboarding, /profile\.isSuccess.*hydratedUserId !== userId/s);
});