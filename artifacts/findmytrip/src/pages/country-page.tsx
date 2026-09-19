import { type SyntheticEvent, useEffect, useRef } from 'react';
import { Link, useRoute } from 'wouter';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  IndianRupee,
  Landmark,
  MapPin,
  Plane,
  Route as RouteIcon,
  ShieldCheck,
  TrainFront,
  Utensils,
  Waves,
} from 'lucide-react';
import { useGetCity, useGetCountry } from '@workspace/api-client-react';
import { trackEvent } from '@/lib/analytics';
import { cityImage, companionImage, countryHeroImage, fallbackCountryImage } from '@/lib/country-images';
import { EmbeddedCityGuide } from '@/pages/city-page';
import { BrandLogo } from '@/components/brand-logo';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const prettyVisa: Record<string, string> = { visa_free: 'Visa-free', voa: 'Visa on arrival', e_visa: 'e-Visa', embassy: 'Embassy visa' };
const companionMap: Record<string, Array<{ slug: string; name: string; note: string }>> = {
  thailand: [
    { slug: 'singapore', name: 'Singapore', note: 'clean lines, hawker nights' },
    { slug: 'malaysia', name: 'Malaysia', note: 'street food and islands' },
    { slug: 'vietnam', name: 'Vietnam', note: 'slow mornings, bold bowls' },
  ],
  indonesia: [
    { slug: 'singapore', name: 'Singapore', note: 'a polished city reset' },
    { slug: 'malaysia', name: 'Malaysia', note: 'food-first, easy to connect' },
    { slug: 'thailand', name: 'Thailand', note: 'more beaches, same warmth' },
  ],
  uae: [
    { slug: 'turkey', name: 'Turkey', note: 'history with a long table' },
    { slug: 'azerbaijan', name: 'Azerbaijan', note: 'Caspian city, strange landscapes' },
    { slug: 'georgia', name: 'Georgia', note: 'wine country and mountains' },
  ],
  singapore: [
    { slug: 'malaysia', name: 'Malaysia', note: 'the easiest next stop' },
    { slug: 'thailand', name: 'Thailand', note: 'beaches after the city' },
    { slug: 'indonesia', name: 'Indonesia', note: 'island time starts here' },
  ],
  vietnam: [
    { slug: 'thailand', name: 'Thailand', note: 'beach days made simple' },
    { slug: 'singapore', name: 'Singapore', note: 'a neat urban bookend' },
    { slug: 'malaysia', name: 'Malaysia', note: 'markets, islands, night trains' },
  ],
  georgia: [
    { slug: 'azerbaijan', name: 'Azerbaijan', note: 'Caspian contrast' },
    { slug: 'turkey', name: 'Turkey', note: 'the westward continuation' },
    { slug: 'uae', name: 'United Arab Emirates', note: 'a sharp modern contrast' },
  ],
  azerbaijan: [
    { slug: 'georgia', name: 'Georgia', note: 'mountains and old towns' },
    { slug: 'turkey', name: 'Turkey', note: 'a bigger history loop' },
    { slug: 'uae', name: 'United Arab Emirates', note: 'another sharp city break' },
  ],
  nepal: [
    { slug: 'sri-lanka', name: 'Sri Lanka', note: 'from peaks to palms' },
    { slug: 'thailand', name: 'Thailand', note: 'soft landing by the sea' },
    { slug: 'vietnam', name: 'Vietnam', note: 'food and highland energy' },
  ],
  'sri-lanka': [
    { slug: 'nepal', name: 'Nepal', note: 'trade the coast for clouds' },
    { slug: 'malaysia', name: 'Malaysia', note: 'another easy island pairing' },
    { slug: 'thailand', name: 'Thailand', note: 'keep the beach story going' },
  ],
  japan: [
    { slug: 'singapore', name: 'Singapore', note: 'a compact city counterpoint' },
    { slug: 'vietnam', name: 'Vietnam', note: 'different rhythm, same appetite' },
    { slug: 'thailand', name: 'Thailand', note: 'finish somewhere warmer' },
  ],
  malaysia: [
    { slug: 'singapore', name: 'Singapore', note: 'the natural city pairing' },
    { slug: 'thailand', name: 'Thailand', note: 'more sea, more sunshine' },
    { slug: 'indonesia', name: 'Indonesia', note: 'one more island story' },
  ],
  turkey: [
    { slug: 'georgia', name: 'Georgia', note: 'wine, hills and old stone' },
    { slug: 'azerbaijan', name: 'Azerbaijan', note: 'Caspian contrasts' },
    { slug: 'uae', name: 'United Arab Emirates', note: 'a modern final act' },
  ],
};

const knownForSignals: Array<{ match: string[]; label: string; icon: typeof Waves }> = [
  { match: ['beach', 'coast', 'island', 'sea'], label: 'Coastal escapes', icon: Waves },
  { match: ['food', 'eat', 'culinary', 'hawker'], label: 'A serious food scene', icon: Utensils },
  { match: ['city', 'architecture', 'modern'], label: 'Big-city energy', icon: Landmark },
  { match: ['mountain', 'himalaya', 'landscape', 'scenery'], label: 'Wide-open scenery', icon: RouteIcon },
];

function getRequestError(error: unknown): { status?: number; message: string } {
  if (!error || typeof error !== 'object') return { message: 'We couldn’t load this country right now.' };
  const requestError = error as { status?: number; data?: { error?: { message?: string } }; message?: string };
  return {
    status: requestError.status,
    message: requestError.data?.error?.message ?? requestError.message ?? 'We couldn’t load this country right now.',
  };
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e4ddd1]/80 bg-[#f8f6f1]/90 px-5 backdrop-blur-md md:px-10">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between">
        <BrandLogo />
        <nav aria-label="Primary navigation" className="flex items-center gap-5">
          <Link href="/discover" className="hidden text-[13px] font-semibold text-[#69746f] transition-colors hover:text-[#ed704f] sm:block" data-testid="link-explore">
            Explore
          </Link>
          <span className="hidden h-5 w-px bg-[#ded8ce] sm:block" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#89918b]">India → everywhere</span>
        </nav>
      </div>
    </header>
  );
}

function Loading() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-5 pb-20 pt-5 md:px-10" aria-busy="true">
        <div className="h-[58vh] min-h-[420px] animate-pulse rounded-[28px] bg-[#e8e1d5]" />
        <div className="mt-14 h-8 w-64 animate-pulse rounded-full bg-[#e8e1d5]" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((n) => <div className="h-72 animate-pulse rounded-[22px] bg-[#e8e1d5]" key={n} />)}</div>
      </main>
    </>
  );
}

function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = fallbackCountryImage();
}

function getKnownForTags(summary: string, region: string) {
  const text = summary.toLowerCase();
  const tags = knownForSignals.filter(({ match }) => match.some((word) => text.includes(word))).slice(0, 3);
  if (tags.length < 3) tags.push({ label: region, icon: Landmark, match: [] });
  return tags.slice(0, 3);
}

function SingleCityCountryGuide({ countrySlug, citySlug }: { countrySlug: string; citySlug: string }) {
  const { data: city, isPending } = useGetCity(countrySlug, citySlug);
  if (isPending) return <div className="skeleton card-skeleton my-14" aria-label="Loading detailed destination guide" />;
  return city ? <EmbeddedCityGuide city={city} /> : null;
}

function CountryPage({ slug }: { slug: string }) {
  const { data: country, error, isPending } = useGetCountry(slug);
  const trackedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (!country) return;
    document.title = `${country.name} Travel Guide for Indians | FindMyTrip`;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = country.known_for_summary;
    if (trackedSlug.current !== country.slug) {
      trackedSlug.current = country.slug;
      trackEvent('country_page_viewed', { countrySlug: country.slug });
    }
  }, [country]);
  if (isPending) return <Loading />;
  if (error) {
    const requestError = getRequestError(error);
    const notFound = requestError.status === 404;
    return <><Header /><main className="state-page"><div className="state-icon"><CircleAlert /></div><h1>{notFound ? 'Country not found' : 'Something went wrong'}</h1><p>{requestError.message}</p><Link href="/" className="button-primary">Back to explore</Link></main></>;
  }
  if (!country) return <><Header /><main className="state-page"><h1>No country information yet</h1><p>Please try another destination.</p><Link href="/" className="button-primary">Back to explore</Link></main></>;
  const months = country.best_months;
  const verified = country.last_verified;
  const tags = getKnownForTags(country.known_for_summary, country.region);
  const companions = (companionMap[country.slug] ?? []).filter((item) => item.slug !== country.slug);
  const singleCity = country.cities.length === 1 && country.cities[0]?.slug === country.slug ? country.cities[0] : null;
  const formattedVerified = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(verified));
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f6f1] text-[#25333d]">
      <Header />
      <main>
        <section className="relative mx-auto max-w-[1440px] px-3 pt-3 md:px-5 md:pt-5">
          <div className="relative isolate min-h-[590px] overflow-hidden rounded-[26px] bg-[#173b3b] sm:min-h-[660px] md:rounded-[34px] lg:min-h-[min(760px,78vh)]">
            <img
              src={countryHeroImage(country.slug)}
              alt={`A cinematic travel view of ${country.name}`}
              className="absolute inset-0 h-full w-full object-cover object-center"
              decoding="async"
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1024px) 1400px, 100vw"
              data-testid="img-country-hero"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,33,35,.14)_0%,rgba(14,31,35,.1)_36%,rgba(11,28,31,.86)_100%)]" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 text-[#fff9ef] sm:p-8">
              <span className="rounded-full border border-white/35 bg-black/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm">{country.region}</span>
              <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-white/80"><MapPin size={13} /> A guide for Indian travellers</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 max-w-[940px] p-6 pb-8 text-[#fffaf2] sm:p-10 sm:pb-12 md:p-14 md:pb-16">
              <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#ffd18d]"><span className="h-1.5 w-1.5 rounded-full bg-[#ffd18d]" /> The feeling of going somewhere</p>
              <h1 className="max-w-[900px] font-serif text-[clamp(3.8rem,10vw,9.3rem)] font-medium leading-[.83] tracking-[-0.075em]" data-testid="text-country-name">{country.name}</h1>
              <p className="mt-7 max-w-[720px] font-serif text-[clamp(1.15rem,2.3vw,1.65rem)] leading-[1.36] text-white/88" data-testid="text-country-summary">{country.known_for_summary}</p>
              <p className="mt-6 flex items-center gap-2 text-xs text-white/65"><Check size={15} className="text-[#8bd1af]" /> Facts last verified {formattedVerified}</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8">
          <section className="border-b border-[#e3ddd3] py-12 md:py-16" aria-labelledby="when-heading" data-testid="section-when-to-go">
            <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
              <div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e46e4e]">Choose your window</p>
                <h2 id="when-heading" className="font-serif text-[clamp(2.6rem,5vw,4.6rem)] leading-[.9] tracking-[-0.065em] text-[#273a40]">When to go</h2>
                <p className="mt-5 max-w-sm text-sm leading-6 text-[#727d79]">The months that make this place feel most like itself.</p>
              </div>
              <div className="rounded-[22px] bg-[#e7f0e7] p-5 md:p-7">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#397665]"><CalendarDays size={16} /> Best months</span>
                  <span className="text-sm font-semibold text-[#2c5f53]">{months.map((m) => monthNames[m - 1]).join(' · ')}</span>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-12" role="list">
                  {country.monthly.map(({ month, label, score }) => (
                    <div className="text-center" role="listitem" key={month} aria-label={`${label}: ${score} out of 5`}>
                      <span className={`text-[10px] font-semibold ${months.includes(month) ? 'text-[#2c7966]' : 'text-[#8c9991]'}`}>{label}</span>
                      <i className={`mt-2 block h-12 rounded-full ${months.includes(month) ? 'bg-[#61a78f]' : 'bg-[#d5dfd4]'}`} style={{ opacity: 0.38 + score / 8 }} aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-[#e3ddd3] py-14 md:py-20" aria-labelledby="known-for-heading" data-testid="section-known-for">
            <div className="grid gap-10 lg:grid-cols-[.55fr_1fr] lg:gap-24">
              <div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e46e4e]">The short version</p>
                <h2 id="known-for-heading" className="font-serif text-[clamp(2.5rem,5vw,4.7rem)] leading-[.9] tracking-[-0.065em] text-[#273a40]">Known for</h2>
              </div>
              <div>
                <p className="max-w-3xl font-serif text-[clamp(1.65rem,3vw,2.65rem)] leading-[1.12] tracking-[-0.04em] text-[#30464a]">“{country.known_for_summary}”</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {tags.map(({ label, icon: Icon }) => (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#ded8cd] bg-[#fffdf8] p-4" key={label}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[#e46e4e]"><Icon size={17} /></span>
                      <span className="text-xs font-bold leading-4 text-[#53645f]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-[#e3ddd3] py-14 md:py-20" aria-labelledby="dishes-heading" data-testid="section-top-dishes">
            <div className="grid gap-10 lg:grid-cols-[.55fr_1fr] lg:gap-24">
              <div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e46e4e]">Eat your way through</p>
                <h2 id="dishes-heading" className="font-serif text-[clamp(2.5rem,5vw,4.7rem)] leading-[.9] tracking-[-0.065em] text-[#273a40]">Top dishes to try</h2>
                <p className="mt-5 max-w-sm text-sm leading-6 text-[#727d79]">The flavours that give {country.name} its own point of view.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {country.top_dishes.map((dish, index) => (
                  <article className="group rounded-2xl border border-[#ded8cd] bg-[#fffdf8] p-5 transition-transform duration-300 hover:-translate-y-1" key={dish.name}>
                    <div className="mb-7 flex items-center justify-between">
                      <span className="font-serif text-3xl leading-none text-[#e46e4e]">{String(index + 1).padStart(2, '0')}</span>
                      <Utensils size={18} className="text-[#d6a15a] transition-transform duration-300 group-hover:rotate-[-10deg]" />
                    </div>
                    <h3 className="font-serif text-[1.45rem] tracking-[-0.04em] text-[#30464a]">{dish.name}</h3>
                    <p className="mt-2 text-sm leading-5 text-[#727d79]">{dish.note}</p>
                    {dish.where && <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#3d8a71]">{dish.where}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>

          {singleCity ? (
            <SingleCityCountryGuide countrySlug={country.slug} citySlug={singleCity.slug} />
          ) : (
          <section className="py-14 md:py-20" aria-labelledby="cities-heading">
            <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e46e4e]">Start with a base</p>
                <h2 id="cities-heading" className="font-serif text-[clamp(2.7rem,5vw,4.8rem)] leading-[.88] tracking-[-0.07em] text-[#273a40]">Where will you go?</h2>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a938d]">{country.cities.length} places to begin</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {country.cities.map((city, index) => (
                <Link
                  className={`group relative isolate min-h-[390px] overflow-hidden rounded-[23px] bg-[#1f4443] ${index === 0 ? 'sm:row-span-2 lg:min-h-[510px]' : ''}`}
                  href={`/c/${country.slug}/${city.slug}`}
                  key={city.slug}
                  data-testid={`link-city-${city.slug}`}
                >
                  <img
                    src={cityImage(city.name, country.name)}
                    alt={`${city.name}, ${country.name}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    decoding="async"
                    loading="lazy"
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,35,37,.08)_25%,rgba(11,29,31,.9)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/25 bg-black/15 text-[#ffd18d] backdrop-blur-sm"><MapPin size={16} /></span>
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/10 text-white/80 backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-1"><ChevronRight size={17} /></span>
                    </div>
                    <h3 className="font-serif text-[2rem] leading-none tracking-[-0.05em]">{city.name}</h3>
                    <p className="mt-2 text-sm leading-5 text-white/75">{city.identity_line}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {city.best_for.slice(0, 3).map((tag) => <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-sm" key={tag}>{tag}</span>)}
                    </div>
                    <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#ffd18d]"><CalendarDays size={14} /> {city.suggested_days_min}{city.suggested_days_max !== city.suggested_days_min ? `–${city.suggested_days_max}` : ''} days</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          )}

          <section className="rounded-[28px] bg-[#193e3d] px-5 py-10 text-[#fffaf2] sm:px-8 md:px-12 md:py-14" aria-labelledby="routes-heading" data-testid="section-routes">
            <div className="flex flex-col justify-between gap-5 border-b border-white/15 pb-8 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#ffbf77]">Make it a journey</p>
                <h2 id="routes-heading" className="font-serif text-[clamp(2.5rem,5vw,4.6rem)] leading-[.9] tracking-[-0.065em]">Suggested routes</h2>
              </div>
              <RouteIcon className="hidden text-[#ffbf77] sm:block" size={42} strokeWidth={1.2} />
            </div>
            <div className="mt-7 grid gap-x-8 md:grid-cols-2">
              {country.suggested_routes.map((route, index) => (
                <article className="group flex items-center gap-5 border-b border-white/15 py-5 first:pt-0 md:nth-[3]:border-b-0 md:nth-[4]:border-b-0" key={`${route.name}-${index}`}>
                  <div className="font-serif text-3xl leading-none text-[#ffbf77]">{String(route.days).padStart(2, '0')}<span className="mt-1 block font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">days</span></div>
                  <div className="min-w-0"><h3 className="truncate text-base font-semibold text-white">{route.name}</h3><p className="mt-1 truncate text-xs text-white/55">{route.cities.join('  ·  ')}</p></div>
                  <ArrowRight className="ml-auto shrink-0 text-[#ffbf77] transition-transform duration-300 group-hover:translate-x-1" size={18} />
                </article>
              ))}
            </div>
          </section>

          <section className="py-14 md:py-20" aria-labelledby="practical-heading">
            <div className="mb-7 flex items-end justify-between">
              <div><p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e46e4e]">The useful bit</p><h2 id="practical-heading" className="font-serif text-[clamp(2.5rem,5vw,4.6rem)] leading-[.9] tracking-[-0.065em] text-[#273a40]">Practicalities</h2></div>
              <Plane className="hidden text-[#e46e4e] sm:block" size={38} strokeWidth={1.2} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl bg-[#fff0e8] p-5"><IndianRupee className="mb-8 text-[#e46e4e]" size={20} /><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#ad6752]">Indian passport</p><h3 className="mt-2 text-lg font-semibold text-[#573d35]">{prettyVisa[country.visa_status_in]}</h3><p className="mt-2 text-xs leading-5 text-[#80675d]">{country.visa_cost_inr ? `From ₹${country.visa_cost_inr.toLocaleString('en-IN')}. ` : ''}{country.visa_process_notes}</p></article>
              <article className="rounded-2xl bg-[#fff4d5] p-5"><IndianRupee className="mb-8 text-[#b8862a]" size={20} /><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#927333]">Currency & costs</p><h3 className="mt-2 text-lg font-semibold text-[#584a2d]">{country.currency}</h3><p className="mt-2 text-xs leading-5 text-[#867650]">Budget ₹{country.daily_cost_inr.budget.toLocaleString('en-IN')} · Mid ₹{country.daily_cost_inr.mid.toLocaleString('en-IN')} · Luxury ₹{country.daily_cost_inr.lux.toLocaleString('en-IN')} per day</p></article>
              <article className="rounded-2xl bg-[#e5f2eb] p-5"><TrainFront className="mb-8 text-[#3d8a71]" size={20} /><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#4a806f]">Getting around</p><h3 className="mt-2 text-lg font-semibold text-[#2d5e50]">Domestic transport</h3><p className="mt-2 text-xs leading-5 text-[#668278]">{country.domestic_transport}</p></article>
              <article className="rounded-2xl bg-[#e5edf5] p-5"><ShieldCheck className="mb-8 text-[#4e789d]" size={20} /><p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#5e7890]">Travel confidence</p><h3 className="mt-2 text-lg font-semibold text-[#365672]">{country.safety_score}/5 rating</h3><p className="mt-2 text-xs leading-5 text-[#6e8190]">Use normal travel awareness and keep local advisories close before departure.</p></article>
            </div>
          </section>

          {companions.length > 0 && (
            <section className="border-t border-[#e3ddd3] pt-14 md:pt-20" aria-labelledby="companions-heading">
              <div className="mb-8 max-w-xl"><p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#e46e4e]">Make the flight count</p><h2 id="companions-heading" className="font-serif text-[clamp(2.5rem,5vw,4.6rem)] leading-[.9] tracking-[-0.065em] text-[#273a40]">Pair it with somewhere else.</h2><p className="mt-5 text-sm leading-6 text-[#727d79]">Two countries, one leave request. These destinations make a natural next chapter after {country.name}.</p></div>
              <div className="grid gap-4 md:grid-cols-3">
                {companions.map((companion) => (
                  <Link href={`/c/${companion.slug}`} className="group overflow-hidden rounded-[22px] border border-[#e0d9cf] bg-[#fffdf8] transition-transform duration-300 hover:-translate-y-1" key={companion.slug} data-testid={`card-companion-${companion.slug}`}>
                    <div className="relative h-40 overflow-hidden bg-[#193e3d]"><img src={companionImage(companion.name)} alt={`${companion.name} travel destination`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" decoding="async" loading="lazy" sizes="(min-width: 768px) 33vw, 100vw" onError={handleImageError} /><div className="absolute inset-0 bg-gradient-to-t from-[#102f30]/60 to-transparent" /></div>
                    <div className="flex items-center justify-between gap-3 p-5"><div><h3 className="font-serif text-2xl tracking-[-0.04em] text-[#273a40]">{companion.name}</h3><p className="mt-1 text-xs text-[#7b8580]">{companion.note}</p></div><ChevronRight className="shrink-0 text-[#e46e4e] transition-transform group-hover:translate-x-1" size={19} /></div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-16 flex flex-col gap-2 border-t border-[#e3ddd3] pt-6 text-[11px] leading-5 text-[#929a95] sm:flex-row sm:items-center sm:justify-between">
            <span>Find your next trip, thoughtfully.</span>
            <span>Data verified for Indian travellers · {verified ? new Date(verified).getFullYear() : new Date().getFullYear()}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function CountryRoute() { const [, params] = useRoute('/c/:countrySlug'); return params ? <CountryPage slug={params.countrySlug} /> : null; }