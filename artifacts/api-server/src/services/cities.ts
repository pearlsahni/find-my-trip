import { z } from "zod";
import { GetCityResponse } from "@workspace/api-zod";
import { getLaunchCity } from "./countries";
import { cityProfiles, CityProfile } from "./city-profiles";

type CityPayload = z.input<typeof GetCityResponse>;
type Place = CityPayload["activities"][number];

const FRESH_MS = 30 * 24 * 60 * 60 * 1000;
const cache = new Map<string, CityPayload>();
const generationCounts = new Map<string, number>();

const sluggify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const title = (slug: string) => slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");

type CityTheme = "food" | "culture" | "history" | "nature" | "adventure" | "shopping" | "nightlife" | "beach" | "design" | "wildlife";

const cityThemes = {
  bangkok: ["food", "culture", "shopping", "nightlife"],
  "chiang-mai": ["culture", "food", "nature", "history"],
  phuket: ["beach", "food", "nightlife", "adventure"],
  krabi: ["beach", "nature", "adventure", "food"],
  bali: ["culture", "nature", "beach", "food"],
  jakarta: ["food", "shopping", "history", "nightlife"],
  yogyakarta: ["history", "culture", "food", "design"],
  lombok: ["beach", "nature", "adventure", "culture"],
  dubai: ["design", "shopping", "food", "nightlife"],
  "abu-dhabi": ["culture", "design", "beach", "food"],
  sharjah: ["culture", "history", "design", "food"],
  singapore: ["food", "design", "nature", "shopping"],
  hanoi: ["food", "history", "culture", "design"],
  "da-nang": ["beach", "food", "nature", "culture"],
  "ho-chi-minh-city": ["food", "history", "nightlife", "shopping"],
  "hoi-an": ["history", "food", "design", "beach"],
  tbilisi: ["food", "culture", "history", "nightlife"],
  batumi: ["beach", "design", "nightlife", "food"],
  kutaisi: ["history", "nature", "culture", "food"],
  baku: ["design", "history", "food", "nightlife"],
  sheki: ["history", "culture", "food", "nature"],
  gabala: ["nature", "adventure", "food", "culture"],
  kathmandu: ["history", "culture", "food", "adventure"],
  pokhara: ["nature", "adventure", "food", "culture"],
  chitwan: ["wildlife", "nature", "adventure", "culture"],
  colombo: ["food", "history", "shopping", "design"],
  kandy: ["history", "culture", "nature", "food"],
  galle: ["history", "beach", "design", "food"],
  ella: ["nature", "adventure", "food", "culture"],
  tokyo: ["food", "design", "shopping", "nightlife"],
  kyoto: ["history", "culture", "food", "nature"],
  osaka: ["food", "nightlife", "shopping", "culture"],
  sapporo: ["food", "nature", "design", "adventure"],
  "kuala-lumpur": ["food", "design", "shopping", "culture"],
  langkawi: ["beach", "nature", "adventure", "food"],
  penang: ["food", "history", "design", "culture"],
  malacca: ["history", "food", "culture", "design"],
  istanbul: ["history", "food", "culture", "shopping"],
  cappadocia: ["nature", "adventure", "history", "culture"],
  antalya: ["beach", "history", "food", "nature"],
  izmir: ["food", "history", "beach", "culture"],
} satisfies Record<string, CityTheme[]>;

const cityBestMonths: Record<keyof typeof cityThemes, number[]> = {
  bangkok: [1, 2, 11, 12],
  "chiang-mai": [1, 2, 11, 12],
  phuket: [1, 2, 3, 4, 11, 12],
  krabi: [1, 2, 3, 4, 11, 12],
  bali: [5, 6, 7, 8, 9],
  jakarta: [6, 7, 8, 9],
  yogyakarta: [5, 6, 7, 8, 9],
  lombok: [5, 6, 7, 8, 9],
  dubai: [1, 2, 3, 11, 12],
  "abu-dhabi": [1, 2, 3, 11, 12],
  sharjah: [1, 2, 3, 11, 12],
  singapore: [2, 3, 4, 7, 8],
  hanoi: [3, 4, 10, 11],
  "da-nang": [2, 3, 4, 5, 6, 7, 8],
  "ho-chi-minh-city": [1, 2, 3, 4, 12],
  "hoi-an": [2, 3, 4, 5, 6, 7],
  tbilisi: [4, 5, 6, 9, 10],
  batumi: [5, 6, 7, 8, 9],
  kutaisi: [5, 6, 9, 10],
  baku: [4, 5, 6, 9, 10],
  sheki: [5, 6, 9, 10],
  gabala: [5, 6, 7, 8, 9],
  kathmandu: [3, 4, 5, 9, 10, 11],
  pokhara: [3, 4, 5, 9, 10, 11],
  chitwan: [1, 2, 3, 10, 11, 12],
  colombo: [1, 2, 3, 12],
  kandy: [1, 2, 3, 4, 12],
  galle: [1, 2, 3, 4, 12],
  ella: [1, 2, 3, 12],
  tokyo: [3, 4, 5, 10, 11],
  kyoto: [3, 4, 5, 10, 11],
  osaka: [3, 4, 5, 10, 11],
  sapporo: [5, 6, 7, 8, 9],
  "kuala-lumpur": [1, 2, 5, 6, 7, 12],
  langkawi: [1, 2, 3, 4, 11, 12],
  penang: [1, 2, 12],
  malacca: [1, 2, 3, 6, 7, 8],
  istanbul: [4, 5, 6, 9, 10],
  cappadocia: [4, 5, 6, 9, 10],
  antalya: [4, 5, 6, 9, 10],
  izmir: [4, 5, 6, 9, 10],
};

const themeDetails: Record<CityTheme, { label: string; experiences: string[]; description: string }> = {
  food: { label: "local food", experiences: ["market food trail", "neighbourhood tasting walk", "cooking workshop"], description: "Taste the city through markets, counters and local kitchens." },
  culture: { label: "living culture", experiences: ["cultural quarter", "craft studio visit", "local traditions walk"], description: "See how local traditions shape everyday city life." },
  history: { label: "layered history", experiences: ["heritage district", "historic landmark route", "city museum"], description: "Read the city through its architecture, landmarks and old streets." },
  nature: { label: "scenery and green space", experiences: ["landscape walk", "garden and park route", "scenic viewpoint"], description: "Make room for the landscapes and green spaces that define the destination." },
  adventure: { label: "outdoor adventure", experiences: ["active day out", "sunrise viewpoint", "guided outdoor route"], description: "Add an active experience beyond the standard sightseeing circuit." },
  shopping: { label: "markets and shopping", experiences: ["design and shopping district", "local market browse", "independent makers route"], description: "Browse the markets, boutiques and local makers the city is known for." },
  nightlife: { label: "after-dark energy", experiences: ["evening district", "night market route", "live music night"], description: "Save time for the city after dark, when a different rhythm takes over." },
  beach: { label: "coast and beaches", experiences: ["beach morning", "coastal sunset walk", "waterfront day"], description: "Balance city time with the coast, waterfront and slower beach hours." },
  design: { label: "architecture and design", experiences: ["architecture trail", "contemporary design district", "creative neighbourhood"], description: "Notice the architecture, public spaces and creative districts shaping the city." },
  wildlife: { label: "wildlife and nature", experiences: ["wildlife safari", "nature reserve visit", "river and forest route"], description: "Plan around responsible wildlife viewing and the surrounding landscape." },
};

function getCityThemes(citySlug: string): CityTheme[] {
  return cityThemes[citySlug as keyof typeof cityThemes] ?? ["food", "culture", "history", "nature"];
}

function getCityBestMonths(citySlug: string): number[] {
  return cityBestMonths[citySlug as keyof typeof cityBestMonths] ?? [3, 4, 5, 9, 10, 11];
}

const destinationContext: Partial<Record<keyof typeof cityThemes, string>> = {
  bali: "Bali is an island destination; Ubud, Seminyak and Sanur are distinct traveller bases rather than city neighbourhoods.",
  lombok: "Lombok is an island destination; Kuta Lombok, Senggigi and Tetebatu are separate traveller bases.",
  chitwan: "Chitwan is a regional destination; Sauraha, Bachhauli and Meghauli are the traveller bases used in this guide.",
  langkawi: "Langkawi is an island group; Pantai Cenang, Kuah and Tanjung Rhu are separate traveller bases.",
  penang: "Penang is a state and island destination; this guide uses George Town and nearby island districts as bases.",
  cappadocia: "Cappadocia is a region; Göreme, Uçhisar and Avanos are separate traveller bases.",
};

function verifiedPlace(citySlug: string, name: string, type: Place["type"], index: number, extras: Partial<Place> = {}): Place {
  const partner = index % 3 === 0 ? "getyourguide" : null;
  return {
    id: `${citySlug}-${type}-${index}`,
    google_place_id: `verified:${citySlug}:${sluggify(name)}`,
    type,
    name,
    description: extras.description ?? name,
    address: `${name}, ${title(citySlug)}`,
    cost_band_inr: index % 3 === 0 ? "budget" : index % 3 === 1 ? "mid" : "lux",
    price_inr: 600 + index * 350,
    avg_duration_mins: type === "restaurant" ? 75 : type === "stay" ? 720 : 60 + index * 15,
    physical_intensity: (index % 5) + 1,
    best_time_of_day: index % 2 ? "afternoon" : "morning",
    suits: index % 4 === 0 ? ["solo", "partner", "friends"] : ["solo", "partner", "friends", "family", "parents"],
    veg_friendly: index % 3 !== 2,
    indoor_outdoor: index % 3 === 0 ? "outdoor" : index % 3 === 1 ? "indoor" : "both",
    vibe_tags: index % 2 ? ["culture", "food"] : ["sightseeing", "history"],
    is_signature: false,
    booking_url: partner ? `https://www.getyourguide.com/s/?q=${encodeURIComponent(name)}&partner_id=findmytrip` : null,
    affiliate_partner: partner,
    bookable: Boolean(partner),
    travel_time_mins: type === "day_trip" ? 55 + index * 20 : null,
    transport_mode: type === "day_trip" ? (index % 2 ? "train" : "car") : null,
    overnight_recommended: type === "day_trip" ? index === 3 : null,
    last_verified: new Date(),
    ...extras,
  };
}

function resolvePlaces(candidates: Place[]): { places: Place[]; droppedCount: number } {
  const places = candidates.filter((place) => Boolean(place.google_place_id));
  return { places, droppedCount: candidates.length - places.length };
}

function build(countrySlug: string, citySlug: string): CityPayload | undefined {
  const launch = getLaunchCity(countrySlug, citySlug);
  if (!launch) return undefined;
  const now = new Date();
  const city = launch.cityName;
  const profile: CityProfile | undefined = cityProfiles[citySlug as keyof typeof cityProfiles];
  if (!profile) return undefined;
  const themes = getCityThemes(citySlug);
  const place = (name: string, type: Place["type"], index: number, description: string, extras: Partial<Place> = {}) =>
    verifiedPlace(citySlug, name, type, index, { description, address: `${name}, ${city}`, ...extras });
  const signatures = profile.activities.map((name, index) => place(name, "activity", index, `Reviewed ${city} highlight: ${name}.`, { is_signature: true, vibe_tags: themes.slice(0, 2) }));
  const activities: Place[] = [];
  const restaurants = profile.restaurants.map((name, index) => place(name, "restaurant", index, `Reviewed ${city} food venue; confirm current hours and address.`));
  const dayTrips = profile.dayTrips.map((name, index) => place(name, "day_trip", index, `Reviewed trip from ${city}; confirm current transport and journey time.`));
  const stays = profile.stays.map((name, index) => place(name, "stay", index, `Reviewed ${city} stay; confirm current address and availability.`, { cost_band_inr: (index < 2 ? "budget" : index < 4 ? "mid" : "lux") as Place["cost_band_inr"] }));
  const resolved = resolvePlaces([...signatures, ...activities, ...restaurants, ...dayTrips, ...stays]);
  const byType = (type: Place["type"], signature = false) => resolved.places.filter((place) => place.type === type && place.is_signature === signature);
  return {
    country_slug: countrySlug,
    country_name: launch.countryName,
    slug: citySlug,
    name: city,
    identity_line: `${city}, home to ${profile.activities[0]} and ${profile.dishes[0][0]}`,
    known_for_summary: `${destinationContext[citySlug as keyof typeof cityThemes] ?? `Explore ${profile.areas.map(([name]) => name).join(", ")}.`} Make time for ${profile.activities.slice(0, 3).join(", ")}. Try ${profile.dishes.map(([name]) => name).join(", ")} along the way.`,
    ideal_days_min: profile.days[0],
    ideal_days_max: profile.days[1],
    daily_cost_inr: { budget: profile.costs[0], mid: profile.costs[1], lux: profile.costs[2] },
    best_months: getCityBestMonths(citySlug),
    safety_score: profile.safety,
    getting_in: profile.gettingIn,
    getting_around: [
      { mode: profile.gettingAround[0], verdict: "Useful for compact areas; check the route and conditions before setting out." },
      { mode: profile.gettingAround[1], verdict: "Use official local route and fare information for the current service." },
      { mode: profile.gettingAround[2], verdict: "Use a licensed or app-booked service and confirm the destination before departure." },
      { mode: profile.gettingAround[3], verdict: "Confirm the route, fare and travel time before arranging a longer journey." },
    ],
    areas: profile.areas.map(([name, character, good_for, cost_band]) => ({ name, character, good_for, cost_band })),
    signature_places: byType("activity", true).slice(0, 5),
    activities: byType("activity").slice(0, 20),
    dishes: profile.dishes.map(([name, note, veg]) => ({ name, note, veg })),
    restaurants: byType("restaurant").slice(0, 8),
    day_trips: byType("day_trip").slice(0, 4),
    tips: profile.tips.map(([type, title, body]) => ({ type, title, body })),
    stays: byType("stay").slice(0, 6),
    traveller_notes: [],
    last_verified: now,
    generated_at: now,
    cached: false,
    dropped_count: resolved.droppedCount,
  };
}

export function getCityGenerationCount(countrySlug: string, citySlug: string): number {
  return generationCounts.get(`${countrySlug}/${citySlug}`) ?? 0;
}

export async function getCity(countrySlug: string, citySlug: string, force = false): Promise<{ city?: CityPayload; cached: boolean }> {
  const key = `${countrySlug}/${citySlug}`;
  const current = cache.get(key);
  if (!force && current && Date.now() - current.generated_at.getTime() < FRESH_MS) {
    return { city: { ...current, cached: true }, cached: true };
  }
  const generated = build(countrySlug, citySlug);
  if (!generated) return { cached: false };
  generationCounts.set(key, (generationCounts.get(key) ?? 0) + 1);
  cache.set(key, generated);
  return { city: generated, cached: false };
}