import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Search, MapPin, ChevronRight, Globe2, AlertCircle, RefreshCw, Route as RouteIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetTravelerProfileQueryKey, useGetTravelerProfile, useListCountries, useUpdateTravelerPreferences, type CountryResponse } from '@workspace/api-client-react';
import { cityImage, countryHeroImage, fallbackCountryImage } from '@/lib/country-images';
import { BrandLogo } from '@/components/brand-logo';
import { AccountMenu } from '@/components/account-menu';
import { clearLocalPreferences, hasPreferenceSignals, readAccountPreferences, readLocalPreferences, writeAccountPreferences } from '@/lib/traveler-preferences';
// The recommender is plain ESM so the same implementation runs in Node's focused tests.
// @ts-expect-error TypeScript does not associate declarations with local .mjs modules under this bundler setup.
import { rankDestinations } from '@/lib/recommendations.mjs';

function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b border-[#e6e0d7] bg-[#f8f6f1]/90 px-5 backdrop-blur-md sm:px-8">
      <BrandLogo />
      <nav aria-label="Primary navigation" className="flex items-center gap-5">
        <Link href="/discover" className="hidden rounded-md px-1 text-sm font-semibold text-[#68717c] hover:text-[#27313e] sm:block">Discover</Link>
        <AccountMenu />
      </nav>
    </header>
  );
}

function LoadingState() {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">{[1,2,3,4,5,6].map((n) => <div key={n} className="h-[300px] animate-pulse rounded-[20px] bg-[#e6e0d7]" />)}</div>;
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#ffe6e6] text-[#e56a48]"><AlertCircle size={32} /></span>
      <h2 className="text-2xl font-bold text-[#283341]">Unable to load destinations</h2>
      <p className="mt-2 max-w-sm text-[#68717c]">We hit a bump while fetching the destination list.</p>
      <button onClick={retry} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e56a48] px-6 py-3 font-bold text-white"><RefreshCw size={18} />Try again</button>
    </div>
  );
}

type CityCardData = {
  slug: string; name: string; identity_line: string; best_for: string[];
  countryName: string; countrySlug: string; reason?: string;
};

function CityCard({ city, personalized = false }: { city: CityCardData; personalized?: boolean }) {
  return (
    <Link href={`/c/${city.countrySlug}/${city.slug}`} className="group overflow-hidden rounded-[18px] border border-[#e6dfd6] bg-white transition hover:-translate-y-1 hover:shadow-xl" data-testid={`card-city-${city.countrySlug}-${city.slug}`}>
      <div className="relative h-40 overflow-hidden">
        <img src={cityImage(city.name, city.countryName)} alt={`${city.name}, ${city.countryName}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackCountryImage(); }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#173b3b]/70 to-transparent" />
        <MapPin size={20} className="absolute bottom-4 left-4 text-white" />
      </div>
      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#357464]">{city.countryName}</p>
        <h3 className="mt-1 font-serif text-2xl font-bold text-[#283341]">{city.name}</h3>
        {personalized && city.reason && <p className="mt-2 min-h-10 text-sm leading-5 text-[#68717c]">{city.reason}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">{city.best_for.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-[#f0ede6] px-2.5 py-1 text-[10px] font-bold text-[#68717c]">{tag}</span>)}</div>
      </div>
    </Link>
  );
}

export default function Discover() {
  const { isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const { data: countries, isLoading, error, refetch } = useListCountries();
  const profileQueryKey = useMemo(() => [...getGetTravelerProfileQueryKey(), userId ?? 'signed-out'] as const, [userId]);
  const profile = useGetTravelerProfile({ query: { queryKey: profileQueryKey, enabled: Boolean(isSignedIn && userId), retry: false } });
  const saveProfile = useUpdateTravelerPreferences();
  const syncedLocalForUser = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const localPreferences = useMemo(readLocalPreferences, []);
  const accountCache = useMemo(() => userId ? readAccountPreferences(userId) : null, [userId]);
  const preferences = isSignedIn
    ? profile.data?.preferences ?? accountCache ?? (profile.isSuccess ? localPreferences : null)
    : localPreferences;

  useEffect(() => {
    if (!isSignedIn || !userId || !profile.isSuccess || !profile.data || syncedLocalForUser.current === userId) return;
    syncedLocalForUser.current = userId;
    if (profile.data.preferences) {
      writeAccountPreferences(userId, profile.data.preferences);
      return;
    }
    if (hasPreferenceSignals(localPreferences)) {
      saveProfile.mutate(
        { data: localPreferences },
        {
          onSuccess: (savedProfile) => {
            queryClient.setQueryData(profileQueryKey, savedProfile);
            const saved = savedProfile.preferences;
            if (saved) writeAccountPreferences(userId, saved);
            clearLocalPreferences();
          },
          onError: () => {
            if (syncedLocalForUser.current === userId) syncedLocalForUser.current = null;
          },
        },
      );
    }
  }, [isSignedIn, localPreferences, profile.data, profile.isSuccess, profileQueryKey, queryClient, userId]);

  const searchResults = useMemo(() => {
    if (!countries) return { countries: [], cities: [] };
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { countries: [], cities: [] };
    return {
      countries: countries.filter((country) => `${country.name} ${country.region} ${country.known_for_summary}`.toLowerCase().includes(query)),
      cities: countries.flatMap((country) => country.cities.filter((city) => `${city.name} ${city.identity_line} ${city.best_for.join(' ')}`.toLowerCase().includes(query)).map((city) => ({ ...city, countryName: country.name, countrySlug: country.slug }))),
    };
  }, [countries, searchQuery]);

  const recommendations = useMemo<CityCardData[]>(() => countries ? rankDestinations(countries, preferences, 4) : [], [countries, preferences]);
  const featuredCountries = countries?.slice(0, 6) ?? [];
  const featuredTrips = useMemo(() => (countries ?? []).flatMap((country) => country.suggested_routes.slice(0, 1).map((route) => ({ ...route, country }))).slice(0, 6), [countries]);
  const searching = Boolean(searchQuery.trim());

  return (
    <div className="min-h-[100dvh] bg-[#f8f6f1] text-[#27313e]">
      <Header />
      <main className="mx-auto w-full max-w-[1180px] px-5 py-10 sm:px-8 md:py-14">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[620px]">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#e56a48]">Discovery hub</p>
            <h1 className="font-serif text-4xl font-extrabold leading-none text-[#283341] sm:text-6xl">Where to next?</h1>
            <p className="mt-4 text-[17px] font-medium text-[#68717c]">Personal picks when you want them. Every destination when you don’t.</p>
          </div>
          <label className="relative w-full md:max-w-[420px]">
            <span className="sr-only">Search destinations</span><Search size={20} className="pointer-events-none absolute left-5 top-[18px] text-[#a4aaa8]" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search country, city, or vibe…" className="h-14 w-full rounded-full border-2 border-[#e6dfd6] bg-white pl-12 pr-6 font-medium outline-none focus:border-[#FF9F1C] focus:ring-4 focus:ring-[#FF9F1C]/15" data-testid="input-destination-search" />
          </label>
        </div>
        {isLoading && <LoadingState />}
        {error && <ErrorState retry={() => refetch()} />}
        {!isLoading && !error && countries && searching && (
          <div className="space-y-14 pb-20">
            {!searchResults.countries.length && !searchResults.cities.length && <div className="py-20 text-center"><Globe2 className="mx-auto text-[#a4aaa8]" size={42} /><h2 className="mt-4 text-2xl font-bold">No horizons found</h2><button onClick={() => setSearchQuery('')} className="mt-4 font-bold text-[#e56a48]">Clear search</button></div>}
            {!!searchResults.countries.length && <section><h2 className="mb-6 font-serif text-3xl font-bold">Matching countries</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{searchResults.countries.map((country) => <CountryCard key={country.slug} country={country} />)}</div></section>}
            {!!searchResults.cities.length && <section><h2 className="mb-6 font-serif text-3xl font-bold">Matching cities</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{searchResults.cities.map((city) => <CityCard key={`${city.countrySlug}-${city.slug}`} city={city} />)}</div></section>}
          </div>
        )}
        {!isLoading && !error && countries && !searching && (
          <div className="space-y-16 pb-20">
            <section aria-labelledby="best-spots-heading">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#357464]">Personalized discovery</p><h2 id="best-spots-heading" className="mt-1 font-serif text-3xl font-bold">Best spots for you</h2></div>
                <Link href="/onboarding" className="text-sm font-bold text-[#b76400]">{hasPreferenceSignals(preferences) ? 'Tune your preferences' : 'Tell us what you like'} →</Link>
              </div>
              {!hasPreferenceSignals(preferences) && <div className="mb-5 rounded-2xl border border-[#ffd394] bg-[#fff8e9] p-4 text-sm font-semibold text-[#74511d]"><Sparkles className="mr-2 inline" size={17} />These are strong starter picks. Add your preferences to make them personal.</div>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recommendations.map((city) => <CityCard key={`${city.countrySlug}-${city.slug}`} city={city} personalized />)}</div>
            </section>
            <section aria-labelledby="featured-countries-heading"><h2 id="featured-countries-heading" className="mb-6 font-serif text-3xl font-bold">Featured countries</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredCountries.map((country) => <CountryCard key={country.slug} country={country} />)}</div></section>
            <section aria-labelledby="featured-trips-heading">
              <h2 id="featured-trips-heading" className="mb-6 font-serif text-3xl font-bold">Featured trips</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featuredTrips.map(({ country, ...route }) => <Link key={`${country.slug}-${route.name}`} href={`/c/${country.slug}`} className="group rounded-2xl border border-[#e6dfd6] bg-[#fffdf8] p-5 hover:border-[#2EC4B6] hover:shadow-lg"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f2ec] text-[#357464]"><RouteIcon size={19} /></span><span className="text-xs font-bold text-[#68717c]">{route.days} days</span></div><h3 className="mt-5 text-xl font-bold">{route.name}</h3><p className="mt-2 text-sm text-[#68717c]">{country.name} · {route.cities.join(' → ')}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#b76400]">Open trip <ChevronRight size={16} /></span></Link>)}</div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function CountryCard({ country }: { country: CountryResponse }) {
  return (
    <Link href={`/c/${country.slug}`} className="group overflow-hidden rounded-[20px] border border-[#e6dfd6] bg-white hover:-translate-y-1 hover:shadow-xl" data-testid={`card-country-${country.slug}`}>
      <div className="relative h-44 overflow-hidden"><img src={countryHeroImage(country.slug)} alt={`${country.name} travel landscape`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackCountryImage(); }} /><div className="absolute inset-0 bg-gradient-to-t from-[#173b3b]/75 to-transparent" /><span className="absolute bottom-4 left-4 rounded-full bg-black/25 px-3 py-1 text-xs font-bold text-white backdrop-blur">{country.region}</span></div>
      <div className="p-5"><h3 className="font-serif text-2xl font-bold">{country.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#68717c]">{country.known_for_summary}</p><div className="mt-5 flex items-center justify-between border-t border-[#f0ede6] pt-4"><span className="text-sm font-bold text-[#357d69]">{country.safety_score}/5 safety</span><ChevronRight size={18} /></div></div>
    </Link>
  );
}