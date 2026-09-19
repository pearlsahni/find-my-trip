export type PreferenceStep = 'vibes' | 'companions' | 'interests' | 'budget' | 'diet';

export type TravelerPreferences = {
  vibes: string[];
  companions: string;
  interests: string[];
  budget: string;
  diet: string[];
  skipped: Partial<Record<PreferenceStep, boolean>>;
};

export const PREFERENCES_KEY = 'findmytrip-onboarding-v4';
export const PREFERENCES_COMPLETE_KEY = 'findmytrip-onboarding-complete-v4';
const ACCOUNT_CACHE_PREFIX = 'findmytrip-account-preferences-v1:';
export const emptyPreferences: TravelerPreferences = {
  vibes: [], companions: '', interests: [], budget: '', diet: [], skipped: {},
};

export function normalizePreferences(value: unknown): TravelerPreferences {
  const source = value && typeof value === 'object' ? value as Partial<TravelerPreferences> : {};
  return {
    vibes: Array.isArray(source.vibes) ? source.vibes.filter((item): item is string => typeof item === 'string') : [],
    companions: typeof source.companions === 'string' ? source.companions : '',
    interests: Array.isArray(source.interests) ? source.interests.filter((item): item is string => typeof item === 'string') : [],
    budget: typeof source.budget === 'string' ? source.budget : '',
    diet: Array.isArray(source.diet) ? source.diet.filter((item): item is string => typeof item === 'string') : [],
    skipped: source.skipped && typeof source.skipped === 'object' ? source.skipped : {},
  };
}

export function readLocalPreferences(): TravelerPreferences {
  if (typeof window === 'undefined') return emptyPreferences;
  try {
    const saved = window.localStorage.getItem(PREFERENCES_KEY);
    return saved ? normalizePreferences(JSON.parse(saved)) : emptyPreferences;
  } catch {
    return emptyPreferences;
  }
}

export function writeLocalPreferences(preferences: TravelerPreferences, completed = true) {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  if (completed) window.localStorage.setItem(PREFERENCES_COMPLETE_KEY, 'true');
}

export function clearLocalPreferences() {
  window.localStorage.removeItem(PREFERENCES_KEY);
  window.localStorage.removeItem(PREFERENCES_COMPLETE_KEY);
}

export function readAccountPreferences(userId: string): TravelerPreferences | null {
  try {
    const value = window.localStorage.getItem(`${ACCOUNT_CACHE_PREFIX}${userId}`);
    return value ? normalizePreferences(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}

export function writeAccountPreferences(userId: string, preferences: TravelerPreferences) {
  window.localStorage.setItem(`${ACCOUNT_CACHE_PREFIX}${userId}`, JSON.stringify(preferences));
}

export function hasPreferenceSignals(preferences: TravelerPreferences | null | undefined) {
  return Boolean(preferences && (preferences.companions || preferences.budget || preferences.vibes.length || preferences.interests.length || preferences.diet.length));
}