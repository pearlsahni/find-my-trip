import { type SyntheticEvent, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, ChevronDown, ChevronUp, CircleAlert, Compass, IndianRupee, MapPin, ShieldCheck, Clock, Info, ExternalLink, Utensils, Train, Bed, Filter, X } from 'lucide-react';
import { Link, useRoute, useSearch } from 'wouter';
import { useGetCity } from '@workspace/api-client-react';
import type { CityResponse, CityPlace } from '@workspace/api-client-react';
import { cityImage, fallbackCountryImage } from '@/lib/country-images';
import { BrandLogo } from '@/components/brand-logo';

function Header() {
  return (
    <header className="site-header">
      <BrandLogo />
      <nav aria-label="Primary navigation">
        <Link href="/" className="nav-link">Explore</Link>
        <button className="nav-profile" aria-label="Open profile" data-testid="button-profile">IN</button>
      </nav>
    </header>
  );
}

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  function onError(event: SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackCountryImage();
  }

  return <img src={src} alt={alt} className="city-hero-image" decoding="async" fetchPriority="high" loading="eager" sizes="100vw" onError={onError} />;
}

function Loading() {
  return (
    <>
      <Header />
      <main className="page-shell" aria-busy="true">
        <div className="skeleton hero-skeleton" />
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          {[1, 2, 3].map((n) => <div className="skeleton card-skeleton" key={n} />)}
        </div>
      </main>
    </>
  );
}

export default function CityRoute() { 
  const [, params] = useRoute('/c/:countrySlug/:citySlug'); 
  return params ? <CityPage countrySlug={params.countrySlug} citySlug={params.citySlug} /> : null; 
}

function getRequestError(error: unknown): { status?: number; message: string } {
  if (!error || typeof error !== 'object') return { message: 'We couldn’t load this city right now.' };
  const requestError = error as { status?: number; data?: { error?: { message?: string } }; message?: string };
  return {
    status: requestError.status,
    message: requestError.data?.error?.message ?? requestError.message ?? 'We couldn’t load this city right now.',
  };
}

function CitySignaturePlaces({ city }: { city: CityResponse }) {
  if (!city.signature_places?.length) return null;
  
  const handleSignatureClick = useCallback((place: CityPlace) => {
    window.dispatchEvent(new CustomEvent('signature_card_clicked', {
      detail: { citySlug: city.slug, placeId: place.id, placeName: place.name }
    }));
  }, [city.slug]);

  const handleAffiliateClick = useCallback((place: CityPlace) => {
    window.dispatchEvent(new CustomEvent('affiliate_click', {
      detail: { citySlug: city.slug, placeId: place.id, partner: place.affiliate_partner }
    }));
  }, [city.slug]);

  return (
    <section className="section-block" aria-labelledby="signature-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The Big Five</p>
          <h2 id="signature-heading">Signature Experiences</h2>
        </div>
      </div>
      <div className="signature-grid">
        {city.signature_places.map(place => (
          <PlaceCard key={place.id} place={place} onCardClick={handleSignatureClick} onAffiliateClick={handleAffiliateClick} />
        ))}
      </div>
    </section>
  );
}

function CityStays({ city }: { city: CityResponse }) {
  const stays = useFilteredPlaces(city.stays);
  if (!city.stays?.length) return null;
  return (
    <CollapsibleSection id="stays" title="Where to stay" eyebrow="Accommodation">
      <div className="places-grid">
        {stays.map(place => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

const FILTER_LABELS: Record<string, string> = {
  adventure: 'Adventure',
  beach: 'Beaches & coast',
  culture: 'Culture',
  design: 'Architecture & design',
  food: 'Food',
  history: 'History',
  nature: 'Nature',
  nightlife: 'Nightlife',
  shopping: 'Shopping',
  sightseeing: 'Sightseeing',
  wildlife: 'Wildlife',
  solo: 'Solo',
  partner: 'Partner',
  friends: 'Friends',
  family: 'Family',
  parents: 'Parents',
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getCityFilterOptions(city: CityResponse) {
  const places = city.activities.length > 0 ? city.activities : city.signature_places;
  const interests = uniqueValues(places.flatMap((place) => place.vibe_tags))
    .filter((value) => FILTER_LABELS[value])
    .sort((a, b) => FILTER_LABELS[a].localeCompare(FILTER_LABELS[b]));
  const companions = uniqueValues(places.flatMap((place) => place.suits))
    .filter((value) => FILTER_LABELS[value]);
  const costBands = uniqueValues(places.map((place) => place.cost_band_inr));
  const settings = [
    places.some((place) => place.indoor_outdoor === 'indoor' || place.indoor_outdoor === 'both') ? 'indoor' : null,
    places.some((place) => place.indoor_outdoor === 'outdoor' || place.indoor_outdoor === 'both') ? 'outdoor' : null,
  ].filter((value): value is string => Boolean(value));
  const durationOptions = [
    { value: '60', label: 'Up to 1 hour' },
    { value: '120', label: 'Up to 2 hours' },
    { value: '240', label: 'Up to 4 hours' },
  ].filter(({ value }) => places.some((place) => place.avg_duration_mins <= Number(value)));

  return { interests, companions, costBands, settings, durationOptions };
}

function CityFilters({ city }: { city: CityResponse }) {
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const [isOpen, setIsOpen] = useState(false);
  const options = useMemo(() => getCityFilterOptions(city), [city]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const updateFilter = (key: string, value: string | null) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    
    // Use history.pushState to update URL without triggering full reload, wouter handles it
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState(null, '', newUrl);
    
    // Dispatch wouter event so useSearch updates
    window.dispatchEvent(new Event('popstate'));
    
    // Analytics
    window.dispatchEvent(new CustomEvent('filter_applied', {
      detail: { filter: key, value }
    }));
  };

  const isChecked = (key: string, val: string) => searchParams.get(key) === val;
  const activeFilterCount = Array.from(searchParams.keys()).length;

  return (
    <div className="filter-widget">
      <button
        type="button"
        className={`filter-trigger ${activeFilterCount > 0 ? 'has-active-filters' : ''}`}
        aria-expanded={isOpen}
        aria-controls="city-filter-popover"
        onClick={() => setIsOpen((open) => !open)}
        data-testid="button-open-filters"
      >
        <span className="filter-trigger-icon"><Filter size={16} /></span>
        <span className="filter-trigger-label">Filter guide</span>
        {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        <ChevronDown className={`filter-trigger-chevron ${isOpen ? 'is-open' : ''}`} size={16} />
      </button>

      {isOpen && (
      <div className="filter-popover" id="city-filter-popover" role="dialog" aria-label="Filter city guide">
      <div className="filter-panel">
      <div className="filter-header">
        <div>
          <h3><Filter size={16} /> Shape your {city.name} days</h3>
          <p className="filter-subtitle">Options reflect what {city.name} is known for.</p>
        </div>
        <div className="filter-header-actions">
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="clear-filters"
            onClick={() => {
              window.history.pushState(null, '', window.location.pathname);
              window.dispatchEvent(new Event('popstate'));
            }}
            data-testid="button-clear-filters">
            Clear
          </button>
        )}
        <button type="button" className="filter-close" onClick={() => setIsOpen(false)} aria-label="Close filters">×</button>
        </div>
      </div>

      <div className="filter-group">
        <h4>Budget</h4>
        <div className="filter-options">
          {options.costBands.map((band) => (
            <label key={band} className="filter-label">
              <input 
                type="radio"
                data-testid={`filter-budget-${band}`}
                name="budget" 
                checked={isChecked('budget', band)}
                onChange={() => updateFilter('budget', band)}
              />
              {band === 'lux' ? 'Premium' : band.charAt(0).toUpperCase() + band.slice(1)}
            </label>
          ))}
          <label className="filter-label">
             <input 
                type="radio"
                data-testid="filter-budget-any"
                name="budget" 
                checked={!searchParams.get('budget')}
                onChange={() => updateFilter('budget', null)}
              />
              Any
          </label>
        </div>
      </div>

      <div className="filter-group">
        <h4>Companion</h4>
        <select 
          value={searchParams.get('companion') || ''} 
          onChange={(e) => updateFilter('companion', e.target.value || null)}
          className="filter-select"
          data-testid="filter-companion"
        >
          <option value="">Anyone</option>
          {options.companions.map((companion) => (
            <option value={companion} key={companion}>{FILTER_LABELS[companion]}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <h4>Interests</h4>
        <select 
          value={searchParams.get('interest') || ''} 
          onChange={(e) => updateFilter('interest', e.target.value || null)}
          className="filter-select"
          data-testid="filter-interest"
        >
          <option value="">Any interest</option>
          {options.interests.map((interest) => (
            <option value={interest} key={interest}>{FILTER_LABELS[interest]}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <h4>Time available</h4>
        <select 
          value={searchParams.get('duration') || ''} 
          onChange={(e) => updateFilter('duration', e.target.value || null)}
          className="filter-select"
          data-testid="filter-duration"
        >
          <option value="">Any duration</option>
          {options.durationOptions.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <h4>Setting</h4>
        <select 
          value={searchParams.get('indoor_outdoor') || ''} 
          onChange={(e) => updateFilter('indoor_outdoor', e.target.value || null)}
          className="filter-select"
          data-testid="filter-setting"
        >
          <option value="">Any setting</option>
          {options.settings.map((setting) => (
            <option value={setting} key={setting}>{setting === 'indoor' ? 'Indoor' : 'Outdoor'}</option>
          ))}
        </select>
      </div>

      <div className="filter-group toggles">
        <label className="toggle-label">
          <input 
            type="checkbox" 
            data-testid="filter-vegetarian"
            checked={isChecked('vegetarian', 'true')}
            onChange={(e) => updateFilter('vegetarian', e.target.checked ? 'true' : null)}
          />
          Veg friendly
        </label>
        <label className="toggle-label">
          <input 
            type="checkbox" 
            data-testid="filter-bookable"
            checked={isChecked('bookable', 'true')}
            onChange={(e) => updateFilter('bookable', e.target.checked ? 'true' : null)}
          />
          Bookable online
        </label>
      </div>
      
      <div className="filter-group">
        <h4>Max Physical Intensity (1-5)</h4>
        <input 
          type="range" 
          min="1" max="5" 
          value={searchParams.get('intensity') || '5'} 
          onChange={(e) => updateFilter('intensity', e.target.value === '5' ? null : e.target.value)}
          className="filter-slider"
          data-testid="filter-intensity"
        />
        <div className="slider-labels">
          <span>Easy</span>
          <span>Hard</span>
        </div>
      </div>

    </div>
      </div>
      )}
    </div>
  );
}

function CityActivities({ city }: { city: CityResponse }) {
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const handleAffiliateClick = useCallback((place: CityPlace) => {
    window.dispatchEvent(new CustomEvent('affiliate_click', {
      detail: { citySlug: city.slug, placeId: place.id, partner: place.affiliate_partner }
    }));
  }, [city.slug]);

  // Apply filters
  const filteredActivities = useMemo(() => {
    let filtered = city.activities || [];
    
    const budget = searchParams.get('budget');
    if (budget) filtered = filtered.filter(a => a.cost_band_inr === budget);
    
    const veg = searchParams.get('vegetarian');
    if (veg === 'true') filtered = filtered.filter(a => a.veg_friendly);
    
    const bookable = searchParams.get('bookable');
    if (bookable === 'true') filtered = filtered.filter(a => a.bookable);
    
    const io = searchParams.get('indoor_outdoor');
    if (io) filtered = filtered.filter(a => a.indoor_outdoor === io || a.indoor_outdoor === 'both');

    const intensity = searchParams.get('intensity');
    if (intensity) filtered = filtered.filter(a => a.physical_intensity <= parseInt(intensity));

    const companion = searchParams.get('companion');
    if (companion) filtered = filtered.filter(a => a.suits.includes(companion as any));

    const interest = searchParams.get('interest');
    if (interest) filtered = filtered.filter(a => a.vibe_tags.includes(interest));

    const duration = searchParams.get('duration');
    if (duration) filtered = filtered.filter(a => a.avg_duration_mins <= Number(duration));

    return filtered;
  }, [city.activities, searchStr]);

  const paginated = filteredActivities.slice(0, page * limit);
  const hasMore = paginated.length < filteredActivities.length;

  return (
    <CollapsibleSection id="activities" title="Things to do" eyebrow="Explore">
      <div className="places-list">
        {paginated.length === 0 ? (
          <p className="empty-state">No activities match your filters.</p>
        ) : (
          paginated.map(place => (
            <PlaceCard key={place.id} place={place} onAffiliateClick={handleAffiliateClick} />
          ))
        )}
      </div>
      {hasMore && (
        <button 
          className="button-secondary load-more" 
          onClick={() => setPage(p => p + 1)}
          data-testid="button-load-more-activities"
        >
          Show more activities
        </button>
      )}
    </CollapsibleSection>
  );
}

function CityPage({ countrySlug, citySlug }: { countrySlug: string; citySlug: string }) {
  const { data: city, error, isPending } = useGetCity(countrySlug, citySlug);
  const trackedSlug = useRef<string | null>(null);
  const searchParams = new URLSearchParams(useSearch());

  useEffect(() => {
    if (!city) return;
    document.title = `${city.name} Travel Guide | FindMyTrip`;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = city.known_for_summary;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/c/${countrySlug}/${citySlug}`;

    if (trackedSlug.current !== city.slug) {
      trackedSlug.current = city.slug;
      window.dispatchEvent(new CustomEvent('city_page_viewed', { 
        detail: { slug: city.slug, countrySlug: city.country_slug, state: 'logged_out' }
      }));
    }
  }, [city, countrySlug, citySlug]);

  if (isPending) return <Loading />;

  if (error) {
    const requestError = getRequestError(error);
    const notFound = requestError.status === 404;
    return (
      <>
        <Header />
        <main className="state-page">
          <div className="state-icon"><CircleAlert /></div>
          <h1>{notFound ? 'City not found' : 'Something went wrong'}</h1>
          <p>{requestError.message}</p>
          <Link href={`/c/${countrySlug}`} className="button-primary">Back to {countrySlug}</Link>
        </main>
      </>
    );
  }

  if (!city) return null;

  return (
    <div className="city-page-wrapper">
      <Header />
      <CityFilters city={city} />
      <main className="page-shell city-layout">
        <CityHero city={city} />
        <CityQuickFacts city={city} />
        <CityKnownForInsights city={city} />
        <CitySignaturePlaces city={city} />
        
        <div className="city-notebook">
          <div className="city-notebook-content">
            <CityAreas city={city} />
            <CityActivities city={city} />
            <CityFood city={city} />
            <CityDayTrips city={city} />
            <CityGettingAround city={city} />
            <CityTips city={city} />
            <CityStays city={city} />
            <CityTravellerNotes city={city} />
          </div>
        </div>
      </main>
    </div>
  );
}

export function EmbeddedCityGuide({ city }: { city: CityResponse }) {
  return (
    <section className="city-page-wrapper embedded-city-guide" aria-labelledby="embedded-city-guide-heading" data-testid="section-embedded-city-guide">
      <div className="section-heading embedded-city-guide-heading">
        <div>
          <p className="eyebrow">Explore in detail</p>
          <h2 id="embedded-city-guide-heading">Plan your time in {city.name}</h2>
        </div>
      </div>
      <CityKnownForInsights city={city} />
      <CitySignaturePlaces city={city} />
      <div className="city-notebook">
        <div className="city-notebook-content">
          <CityAreas city={city} />
          <CityActivities city={city} />
          <CityFood city={city} />
          <CityDayTrips city={city} />
          <CityGettingAround city={city} />
          <CityTips city={city} />
          <CityStays city={city} />
        </div>
      </div>
    </section>
  );
}

function CityKnownForInsights({ city }: { city: CityResponse }) {
  const insights = useMemo(() => {
    const places = [...city.signature_places, ...city.activities];
    const themeCounts = places.flatMap((place) => place.vibe_tags).reduce<Record<string, number>>((counts, theme) => {
      counts[theme] = (counts[theme] ?? 0) + 1;
      return counts;
    }, {});
    const themes = Object.entries(themeCounts)
      .filter(([theme]) => FILTER_LABELS[theme])
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([theme]) => FILTER_LABELS[theme]);
    const averageIntensity = places.length
      ? places.reduce((sum, place) => sum + place.physical_intensity, 0) / places.length
      : 3;
    const pace = averageIntensity < 2.3 ? 'Easygoing' : averageIntensity > 3.6 ? 'Active' : 'Balanced';
    const durations = places.map((place) => place.avg_duration_mins).sort((a, b) => a - b);
    const typicalDuration = durations[Math.floor(durations.length / 2)] ?? 90;
    const timeCounts = places.reduce<Record<string, number>>((counts, place) => {
      counts[place.best_time_of_day] = (counts[place.best_time_of_day] ?? 0) + 1;
      return counts;
    }, {});
    const bestTime = Object.entries(timeCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] ?? 'morning';

    return {
      themes,
      pace,
      duration: typicalDuration >= 180 ? 'Half-day blocks' : typicalDuration > 90 ? '2-hour blocks' : 'About 1 hour',
      bestTime: bestTime.charAt(0).toUpperCase() + bestTime.slice(1),
    };
  }, [city]);

  return (
    <section className="city-insights" aria-labelledby="city-insights-heading">
      <div className="city-insights-heading">
        <p className="eyebrow">City lens</p>
        <h2 id="city-insights-heading">Plan around what {city.name} does best.</h2>
      </div>
      <div className="city-insight-grid">
        <article className="city-insight-card">
          <Compass size={18} />
          <span>Known for</span>
          <strong>{insights.themes.join(' · ')}</strong>
        </article>
        <article className="city-insight-card">
          <MapPin size={18} />
          <span>Best rhythm</span>
          <strong>{insights.pace} · {insights.bestTime} starts</strong>
        </article>
        <article className="city-insight-card">
          <Clock size={18} />
          <span>Experience size</span>
          <strong>{insights.duration}</strong>
        </article>
      </div>
    </section>
  );
}

function CityQuickFacts({ city }: { city: CityResponse }) {
  return (
    <section className="section-block practical-section" aria-labelledby="quick-facts-heading">
      <h2 className="sr-only" id="quick-facts-heading">Quick Facts</h2>
      <div className="practical-grid">
        <article className="practical-card">
          <span className="fact-icon coral"><Clock /></span>
          <p className="fact-label">Ideal duration</p>
          <h3>{city.ideal_days_min}{city.ideal_days_max !== city.ideal_days_min ? `–${city.ideal_days_max}` : ''} days</h3>
        </article>
        <article className="practical-card">
          <span className="fact-icon gold"><IndianRupee /></span>
          <p className="fact-label">Daily budget</p>
          <h3>Budget ₹{city.daily_cost_inr.budget.toLocaleString('en-IN')}</h3>
          <p>Mid ₹{city.daily_cost_inr.mid.toLocaleString('en-IN')} · Lux ₹{city.daily_cost_inr.lux.toLocaleString('en-IN')}</p>
        </article>
        <article className="practical-card">
          <span className="fact-icon mint"><ShieldCheck /></span>
          <p className="fact-label">Safety score</p>
          <h3>{city.safety_score}/5 rating</h3>
        </article>
        <article className="practical-card">
          <span className="fact-icon blue"><Train /></span>
          <p className="fact-label">Getting in</p>
          <h3>Main arrival</h3>
          <p>{city.getting_in}</p>
        </article>
        <article className="practical-card">
          <span className="fact-icon coral"><CalendarDays /></span>
          <p className="fact-label">Best months</p>
          <h3>{city.best_months.map((month) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]).join(', ')}</h3>
        </article>
      </div>
    </section>
  );
}

function PlaceCard({ place, onAffiliateClick, onCardClick }: { place: CityPlace, onAffiliateClick?: (place: CityPlace) => void, onCardClick?: (place: CityPlace) => void }) {
  return (
    <article
      className="place-card"
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={() => onCardClick?.(place)}
      onKeyDown={(event) => {
        if (onCardClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onCardClick(place);
        }
      }}
      data-testid={`card-place-${place.id}`}
    >
      <div className="place-header">
        <h4>{place.name}</h4>
        {place.is_signature && <span className="signature-badge">Signature</span>}
      </div>
      <p className="place-desc">{place.description}</p>
      
      <div className="place-meta">
        <span className="meta-tag">{COST_BANDS[place.cost_band_inr]}</span>
        <span className="meta-tag"><Clock size={12}/> {place.avg_duration_mins}m</span>
        {place.veg_friendly && <span className="meta-tag veg">Veg friendly</span>}
      </div>

      <div className="place-tags">
        {place.vibe_tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {place.bookable && place.booking_url && (
        <a 
          href={place.booking_url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="book-link"
          onClick={(event) => {
            event.stopPropagation();
            onAffiliateClick?.(place);
          }}
          data-testid={`link-book-${place.id}`}
        >
          Book now <ExternalLink size={12} />
        </a>
      )}
    </article>
  );
}

function CityFood({ city }: { city: CityResponse }) {
  const restaurants = useFilteredPlaces(city.restaurants);
  if (!city.dishes?.length && !city.restaurants?.length) return null;
  return (
    <CollapsibleSection id="food" title="What to eat" eyebrow="Dining">
      {city.dishes?.length > 0 && (
        <div className="dishes-list mb-6">
          <h4 className="subsection-title">Must-try dishes</h4>
          <ul className="dish-items">
            {city.dishes.map(dish => (
              <li key={dish.name}>
                <span className="dish-name">{dish.name}</span>
                {dish.veg && <span className="meta-tag veg ml-2">Veg</span>}
                <p className="dish-note">{dish.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {restaurants.length > 0 && (
        <div className="restaurants-list">
          <h4 className="subsection-title">Notable spots</h4>
          <div className="places-grid">
            {restaurants.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

function CityAreas({ city }: { city: CityResponse }) {
  if (!city.areas?.length) return null;
  return (
    <CollapsibleSection id="areas" title="Neighborhoods to know" eyebrow="Orientation">
      <div className="areas-list">
        {city.areas.map(area => (
          <div key={area.name} className="area-card" data-testid={`card-area-${area.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="area-header">
              <h4>{area.name}</h4>
              <span className="cost-pill">{COST_BANDS[area.cost_band]}</span>
            </div>
            <p className="area-character">{area.character}</p>
            <div className="area-good-for">
              <strong>Best for:</strong> {area.good_for.join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function CityTips({ city }: { city: CityResponse }) {
  if (!city.tips?.length) return null;
  return (
    <CollapsibleSection id="tips" title="Practical tips" eyebrow="Know before you go">
      <div className="tips-list">
        {city.tips.map(tip => (
          <div key={tip.title} className="tip-item">
            <span className="tip-type">{tip.type}</span>
            <h4>{tip.title}</h4>
            <p>{tip.body}</p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function useFilteredPlaces(places: CityPlace[]) {
  const searchStr = useSearch();
  return useMemo(() => {
    const params = new URLSearchParams(searchStr);
    return places.filter((place) => {
      const budget = params.get('budget');
      const companion = params.get('companion');
      const interest = params.get('interest');
      const intensity = params.get('intensity');
      const duration = params.get('duration');
      const setting = params.get('indoor_outdoor');
      if (budget && place.cost_band_inr !== budget) return false;
      if (companion && !place.suits.includes(companion as CityPlace['suits'][number])) return false;
      if (interest && !place.vibe_tags.includes(interest)) return false;
      if (intensity && place.physical_intensity > Number(intensity)) return false;
      if (duration && place.avg_duration_mins > Number(duration)) return false;
      if (setting && place.indoor_outdoor !== setting && place.indoor_outdoor !== 'both') return false;
      if (params.get('vegetarian') === 'true' && !place.veg_friendly) return false;
      if (params.get('bookable') === 'true' && !place.bookable) return false;
      return true;
    });
  }, [places, searchStr]);
}

function CityDayTrips({ city }: { city: CityResponse }) {
  const dayTrips = useFilteredPlaces(city.day_trips);
  if (!city.day_trips?.length) return null;
  return (
    <CollapsibleSection id="day-trips" title="Beyond the city" eyebrow="Day Trips">
      <div className="places-grid">
        {dayTrips.map(place => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

const COST_BANDS = {
  budget: '₹',
  mid: '₹₹',
  lux: '₹₹₹',
};

function CityHero({ city }: { city: CityResponse }) {
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const verifiedDate = city.last_verified ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(city.last_verified)) : '';
  return (
    <section className="city-hero">
      <ImageWithFallback src={cityImage(city.name, city.country_name)} alt={`${city.name}, ${city.country_name}`} />
      <div className="breadcrumbs">
        <Link href="/" className="breadcrumb-link">Explore</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/c/${city.country_slug}`} className="breadcrumb-link">{city.country_name}</Link>
      </div>
      <div className="eyebrow mt-4"><span className="eyebrow-dot" /> {city.identity_line}</div>
      <h1 data-testid="text-city-name">{city.name}</h1>
      <p className="hero-summary" data-testid="text-city-summary">{city.known_for_summary}</p>
      
      <div className="city-actions">
        <button 
          className="button-primary" 
          onClick={() => setLoginPrompt('Log in to hand this city to the day planner. The guide stays fully available.')}
          data-testid="button-plan-days"
        >
          Plan my days
        </button>
        <button 
          className="button-secondary" 
          onClick={() => setLoginPrompt('Log in to save this city. You can keep exploring without an account.')}
          data-testid="button-save-city"
        >
          Save city
        </button>
      </div>
      {loginPrompt && (
        <div className="login-prompt" role="status" aria-live="polite" data-testid="status-login-prompt">
          <span>{loginPrompt}</span>
          <button type="button" onClick={() => setLoginPrompt(null)} aria-label="Dismiss login prompt" data-testid="button-dismiss-login-prompt">×</button>
        </div>
      )}

      <p className="verified"><Check size={14} /> Facts last verified {verifiedDate}</p>
    </section>
  );
}

function CollapsibleSection({ id, title, eyebrow, children }: { id: string, title: string, eyebrow?: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      window.dispatchEvent(new CustomEvent('section_expanded', {
        detail: { sectionId: id }
      }));
    }
  };

  return (
    <section className={`notebook-section ${isOpen ? 'is-open' : ''}`} id={id}>
      <button 
        className="section-toggle" 
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`content-${id}`}
        data-testid={`button-toggle-${id}`}
      >
        <div className="toggle-text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h3>{title}</h3>
        </div>
        <div className="toggle-icon">
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </div>
      </button>
      <div 
        className="section-content" 
        id={`content-${id}`}
        hidden={!isOpen}
      >
        <div className="content-inner">
          {children}
        </div>
      </div>
    </section>
  );
}

function CityGettingAround({ city }: { city: CityResponse }) {
  if (!city.getting_around?.length) return null;
  return (
    <CollapsibleSection id="transport" title="Getting around" eyebrow="Transit">
      <div className="transport-list">
        {city.getting_around.map(item => (
          <div key={item.mode} className="transport-item">
            <h4>{item.mode}</h4>
            <p>{item.verdict}</p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function CityTravellerNotes({ city }: { city: CityResponse }) {
  if (!city.traveller_notes?.length) return null;
  return (
    <CollapsibleSection id="notes" title="Traveller notes" eyebrow="Community">
      <div className="notes-list">
        {city.traveller_notes.map((note, i) => (
          <blockquote key={i} className="traveller-note">
            <p>"{note.body}"</p>
            <footer>— {note.attribution} · <time dateTime={note.created_at}>{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(note.created_at))}</time></footer>
          </blockquote>
        ))}
      </div>
    </CollapsibleSection>
  );
}
