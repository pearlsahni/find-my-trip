import type { CountryResponse, TravelerPreferences } from '@workspace/api-client-react';

export type RankedDestination = CountryResponse['cities'][number] & {
  countryName: string;
  countrySlug: string;
  score: number;
  reason: string;
};

export function rankDestinations(
  countries: CountryResponse[],
  preferences: TravelerPreferences | null | undefined,
  limit?: number,
): RankedDestination[];