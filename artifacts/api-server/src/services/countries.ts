import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { cities, countries } from "@workspace/db/schema";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const cityNames: Record<string, string[]> = {
  thailand: ["Bangkok", "Chiang Mai", "Phuket", "Krabi"],
  indonesia: ["Bali", "Jakarta", "Yogyakarta", "Lombok"],
  uae: ["Dubai", "Abu Dhabi", "Sharjah"],
  singapore: ["Singapore"],
  vietnam: ["Hanoi", "Da Nang", "Ho Chi Minh City", "Hoi An"],
  georgia: ["Tbilisi", "Batumi", "Kutaisi"],
  azerbaijan: ["Baku", "Sheki", "Gabala"],
  nepal: ["Kathmandu", "Pokhara", "Chitwan"],
  "sri-lanka": ["Colombo", "Kandy", "Galle", "Ella"],
  japan: ["Tokyo", "Kyoto", "Osaka", "Sapporo"],
  malaysia: ["Kuala Lumpur", "Langkawi", "Penang", "Malacca"],
  turkey: ["Istanbul", "Cappadocia", "Antalya", "Izmir"],
};
const coordinates: Record<string, [number, number]> = {
  bangkok: [13.7563, 100.5018], "chiang-mai": [18.7883, 98.9853], phuket: [7.8804, 98.3923], krabi: [8.0863, 98.9063],
  bali: [-8.4095, 115.1889], jakarta: [-6.2088, 106.8456], yogyakarta: [-7.7956, 110.3695], lombok: [-8.5833, 116.1167],
  dubai: [25.2048, 55.2708], "abu-dhabi": [24.4539, 54.3773], sharjah: [25.3463, 55.4209], singapore: [1.3521, 103.8198],
  hanoi: [21.0278, 105.8342], "da-nang": [16.0544, 108.2022], "ho-chi-minh-city": [10.8231, 106.6297], "hoi-an": [15.8801, 108.338],
  tbilisi: [41.7151, 44.8271], batumi: [41.6168, 41.6367], kutaisi: [42.2679, 42.718],
  baku: [40.4093, 49.8671], sheki: [41.1919, 47.1706], gabala: [40.9814, 47.8458],
  kathmandu: [27.7172, 85.324], pokhara: [28.2096, 83.9856], chitwan: [27.5291, 84.3542],
  colombo: [6.9271, 79.8612], kandy: [7.2906, 80.6337], galle: [6.0329, 80.2168], ella: [6.8667, 81.0466],
  tokyo: [35.6762, 139.6503], kyoto: [35.0116, 135.7681], osaka: [34.6937, 135.5023], sapporo: [43.0618, 141.3545],
  "kuala-lumpur": [3.139, 101.6869], langkawi: [6.35, 99.8], penang: [5.4141, 100.3288], malacca: [2.1896, 102.2501],
  istanbul: [41.0082, 28.9784], cappadocia: [38.6431, 34.8289], antalya: [36.8969, 30.7133], izmir: [38.4237, 27.1428],
};

export type CuratedCountryFacts = { name: string; region: string; currency: string; visa: "visa_free" | "voa" | "e_visa" | "embassy"; cost: number; notes: string; transport: string; summary: string };
export const countryNames: Record<string, CuratedCountryFacts> = {
  thailand: { name: "Thailand", region: "Southeast Asia", currency: "Thai baht (THB)", visa: "visa_free", cost: 0, notes: "Indian passport holders can use the current visa exemption for eligible short leisure stays; check entry duration before departure.", transport: "Low-cost domestic flights, trains and ferries connect the main hubs.", summary: "Thailand combines easy beaches, lively cities and welcoming northern landscapes. It is one of the simplest first international trips from India. Distances are manageable and travel infrastructure is strong." },
  indonesia: { name: "Indonesia", region: "Southeast Asia", currency: "Indonesian rupiah (IDR)", visa: "voa", cost: 2500, notes: "Visa on Arrival is available at designated airports and ports; carry passport validity and onward-ticket proof.", transport: "Use flights between islands; ride-hailing and ferries work well within popular regions.", summary: "Indonesia is a spread of distinct islands rather than one single experience. Bali offers the easiest introduction, while Java and Lombok reward extra planning. Allow buffer time for transfers." },
  uae: { name: "United Arab Emirates", region: "West Asia", currency: "UAE dirham (AED)", visa: "embassy", cost: 7500, notes: "Indian passport holders generally need a pre-arranged tourist visa through an airline, hotel or licensed travel agency.", transport: "Metro and taxis are efficient in Dubai and Abu Dhabi; intercity buses are practical.", summary: "The UAE pairs modern architecture with desert landscapes and regional food. Dubai is a polished, high-energy base, while Abu Dhabi adds museums and quieter beaches. Expect higher daily costs." },
  singapore: { name: "Singapore", region: "Southeast Asia", currency: "Singapore dollar (SGD)", visa: "e_visa", cost: 2500, notes: "Apply for an entry visa through an authorised Singapore visa agent before travel.", transport: "The MRT and buses are fast, clean and cover nearly every visitor district.", summary: "Singapore is compact, exceptionally connected and easy to navigate. Its strengths are food, gardens, neighbourhoods and family-friendly attractions. A short stay can cover the highlights without rushing." },
  vietnam: { name: "Vietnam", region: "Southeast Asia", currency: "Vietnamese dong (VND)", visa: "e_visa", cost: 2100, notes: "Apply online for an e-visa before departure and verify the permitted entry port.", transport: "Domestic flights save time; overnight trains and app taxis are useful on shorter routes.", summary: "Vietnam offers exceptional food, layered history and dramatic regional variety. Hanoi and Ho Chi Minh City feel distinctly different. A north-to-central route works well for a first visit." },
  georgia: { name: "Georgia", region: "Caucasus", currency: "Georgian lari (GEL)", visa: "visa_free", cost: 0, notes: "Indian travellers should verify the current visa policy and carry accommodation, insurance and funds evidence.", transport: "Taxis and trains cover cities; hire a car or use minibuses for mountain regions.", summary: "Georgia brings old towns, Caucasus scenery and a strong food culture together. Tbilisi is a lively base for day trips. Mountain travel is seasonal and can be slower than maps suggest." },
  azerbaijan: { name: "Azerbaijan", region: "Caucasus", currency: "Azerbaijani manat (AZN)", visa: "e_visa", cost: 2100, notes: "Apply for the ASAN e-visa before travel and use the passport details exactly as submitted.", transport: "Baku has a metro and affordable taxis; trains and tours connect major day-trip towns.", summary: "Azerbaijan contrasts a modern Caspian capital with ancient villages and unusual landscapes. Baku works well for a long weekend. Add regional nights for a broader view of the country." },
  nepal: { name: "Nepal", region: "South Asia", currency: "Nepalese rupee (NPR)", visa: "voa", cost: 2500, notes: "Tourist visas are available on arrival at Kathmandu airport; carry cash and a passport photo as backup.", transport: "Flights connect major trekking gateways; road journeys are scenic but often slow.", summary: "Nepal makes Himalayan scenery accessible from India, with temples and trekking in the same trip. Kathmandu and Pokhara have different rhythms. Weather matters greatly for mountain visibility." },
  "sri-lanka": { name: "Sri Lanka", region: "South Asia", currency: "Sri Lankan rupee (LKR)", visa: "e_visa", cost: 2500, notes: "Complete the electronic travel authorisation process before departure and retain approval details.", transport: "Trains are scenic; private drivers and app taxis are easiest for multi-stop routes.", summary: "Sri Lanka packs beaches, wildlife, tea country and historic towns into a compact island. Rail journeys are memorable but slow. Choose one coast and the hills rather than overloading a short trip." },
  japan: { name: "Japan", region: "East Asia", currency: "Japanese yen (JPY)", visa: "embassy", cost: 0, notes: "Apply for a tourist visa through the Japanese mission or authorised centre serving your residence.", transport: "Rail is excellent between cities; IC cards and local trains simplify urban travel.", summary: "Japan rewards travellers with precise transport, deep food traditions and highly distinct cities. Tokyo and Kyoto are natural first stops. Costs are manageable when accommodation and rail are planned early." },
  malaysia: { name: "Malaysia", region: "Southeast Asia", currency: "Malaysian ringgit (MYR)", visa: "visa_free", cost: 0, notes: "Check the current short-stay entry allowance and complete any required digital arrival form.", transport: "Urban rail, app taxis and affordable flights make city and island combinations easy.", summary: "Malaysia blends excellent hawker food, multicultural cities and accessible islands. Kuala Lumpur is a useful hub for first-time visitors. Penang and Langkawi add distinct regional character." },
  turkey: { name: "Turkey", region: "Europe and West Asia", currency: "Turkish lira (TRY)", visa: "e_visa", cost: 4200, notes: "Check e-visa eligibility and requirements before booking; rules can depend on supporting visas.", transport: "Domestic flights bridge long distances; metros, ferries and buses work well in major cities.", summary: "Turkey connects monumental history, varied landscapes and a generous food culture. Istanbul deserves several days on its own. Cappadocia and the Aegean add very different scenery." },
};

// Verified visa classifications for the launch audience as of September 2026.
countryNames.singapore.visa = "embassy";
countryNames.georgia.visa = "e_visa";

type EditorialCity = { identity: string; bestFor: string[]; min: number; max: number };
type Editorial = {
  daily: { budget: number; mid: number; lux: number };
  bestMonths: number[];
  safety: number;
  monthly: number[];
  cities: Record<string, EditorialCity>;
  routes: Array<{ name: string; cities: string[]; days: number }>;
};
type LaunchCountry = "thailand" | "indonesia" | "uae" | "singapore" | "vietnam" | "georgia" | "azerbaijan" | "nepal" | "sri-lanka" | "japan" | "malaysia" | "turkey";
type CountryDish = { name: string; note: string; where?: string };

const topDishes: Record<LaunchCountry, CountryDish[]> = {
  thailand: [
    { name: "Pad Thai", note: "Tamarind noodles tossed with egg, tofu and crushed peanuts; try it from a busy street stall." },
    { name: "Tom yum goong", note: "A hot-sour prawn soup bright with lemongrass, lime and chilli." },
    { name: "Green curry", note: "Silky coconut curry with Thai basil and a gentle, fragrant heat." },
    { name: "Mango sticky rice", note: "Ripe mango with sweet coconut rice, a simple classic in the hot season." },
  ],
  indonesia: [
    { name: "Nasi goreng", note: "Smoky wok-fried rice with kecap manis, egg and crisp shallots." },
    { name: "Rendang", note: "Slow-cooked beef reduced in coconut, chilli and toasted spice until deeply savoury.", where: "West Sumatra" },
    { name: "Sate ayam", note: "Charcoal-grilled chicken skewers served with a rich peanut sauce." },
    { name: "Gado-gado", note: "Blanched vegetables, tofu and rice cakes under a warm peanut dressing." },
  ],
  uae: [
    { name: "Al harees", note: "Wheat and meat slow-cooked to a smooth, comforting porridge for celebrations." },
    { name: "Machboos", note: "Spiced rice layered with meat or seafood, lifted by dried lime and saffron." },
    { name: "Shawarma", note: "Juicy spit-roasted meat wrapped with pickles, tahini or garlic sauce." },
    { name: "Luqaimat", note: "Warm crisp dumplings glazed with date syrup or honey and sesame." },
  ],
  singapore: [
    { name: "Hainanese chicken rice", note: "Silky poached chicken, fragrant rice and chilli-ginger sauce: the essential hawker plate." },
    { name: "Laksa", note: "Noodles in a creamy, spicy coconut broth with prawns or fish cake." },
    { name: "Chilli crab", note: "Crab in a sweet-spicy tomato-chilli sauce, best with fried mantou buns." },
    { name: "Char kway teow", note: "Flat rice noodles wok-fried with egg, prawns and smoky dark soy." },
  ],
  vietnam: [
    { name: "Phở", note: "Clear aromatic broth with rice noodles, herbs and thinly sliced beef or chicken.", where: "Hanoi" },
    { name: "Bánh mì", note: "A crisp baguette packed with pâté, pickles, herbs and savoury fillings." },
    { name: "Bún chả", note: "Grilled pork and rice noodles served with herbs in a light dipping broth.", where: "Hanoi" },
    { name: "Cao lầu", note: "Chewy noodles with pork, herbs and crunchy greens, uniquely tied to Hoi An.", where: "Hoi An" },
  ],
  georgia: [
    { name: "Khachapuri", note: "Cheese-filled bread; try the boat-shaped Adjaruli version with egg and butter.", where: "Adjara" },
    { name: "Khinkali", note: "Juicy pleated dumplings of meat or mushrooms, eaten by hand." },
    { name: "Lobio", note: "Earthy beans cooked with herbs and spices, often served with cornbread." },
    { name: "Badrijani nigvzit", note: "Roasted eggplant rolls filled with garlicky walnut paste." },
  ],
  azerbaijan: [
    { name: "Plov", note: "Fragrant saffron rice served with dried fruit, chestnuts and tender meat." },
    { name: "Dolma", note: "Vine leaves or vegetables stuffed with herbed meat and rice." },
    { name: "Qutab", note: "Thin griddled turnovers filled with greens, pumpkin or minced meat." },
    { name: "Dushbara", note: "Tiny meat dumplings in a clear, peppery broth." },
  ],
  nepal: [
    { name: "Momos", note: "Steamed dumplings filled with spiced meat or vegetables and tomato achar." },
    { name: "Dal bhat", note: "Lentil soup, rice, vegetables and pickles: Nepal's sustaining everyday meal." },
    { name: "Thukpa", note: "Noodle soup with vegetables and meat, especially welcome in cooler mountain towns." },
    { name: "Newari khaja set", note: "A generous Kathmandu Valley platter of beaten rice, beans, meat and pickles.", where: "Kathmandu Valley" },
  ],
  "sri-lanka": [
    { name: "Rice and curry", note: "A fragrant spread of rice, vegetable curries, sambols and often fish." },
    { name: "Kottu roti", note: "Chopped flatbread stir-fried loudly with vegetables, egg or meat." },
    { name: "Hoppers", note: "Bowl-shaped fermented rice pancakes, especially good with a soft egg centre." },
    { name: "Lamprais", note: "Rice, meat curry and accompaniments baked together in a banana leaf.", where: "Colombo" },
  ],
  japan: [
    { name: "Sushi", note: "Precise vinegared rice and fresh toppings; explore neighbourhood counters beyond famous chains." },
    { name: "Ramen", note: "Noodles in a regional broth, from Tokyo's soy style to Sapporo's miso." },
    { name: "Okonomiyaki", note: "A savoury griddled pancake layered with cabbage, sauce and toppings.", where: "Osaka" },
    { name: "Tempura", note: "Lightly battered seafood and vegetables fried until delicate and crisp." },
  ],
  malaysia: [
    { name: "Nasi lemak", note: "Coconut rice with sambal, fried anchovies, peanuts and egg—the national comfort plate." },
    { name: "Char kway teow", note: "Smoky flat noodles with prawns, egg and bean sprouts.", where: "Penang" },
    { name: "Laksa", note: "Regional noodle soups range from sour fishy assam laksa to rich curry laksa." },
    { name: "Roti canai", note: "Flaky, hand-stretched flatbread made for dipping into dhal or curry." },
  ],
  turkey: [
    { name: "Döner kebab", note: "Seasoned meat shaved from a vertical spit and tucked into bread or dürüm." },
    { name: "Mantı", note: "Tiny dumplings topped with garlicky yoghurt, butter and dried mint." },
    { name: "İmam bayıldı", note: "Slow-braised eggplant filled with sweet onion, tomato and olive oil." },
    { name: "Baklava", note: "Crisp layers of filo, pistachio and syrup—best with strong Turkish tea." },
  ],
};

// Deliberately explicit rather than algorithmically generated: these are the launch
// editorial facts shown to travellers, and each city needs its own point of view.
const editorial: Record<LaunchCountry, Editorial> = {
  thailand: {
    daily: { budget: 2200, mid: 6000, lux: 15500 }, bestMonths: [1, 2, 3, 11, 12], safety: 4, monthly: [5, 5, 4, 3, 2, 2, 2, 2, 3, 3, 4, 5],
    cities: {
      Bangkok: { identity: "Temple dawns, street-food lanes and rooftop energy", bestFor: ["food", "first trips"], min: 2, max: 4 },
      "Chiang Mai": { identity: "A relaxed northern base for temples and craft cafés", bestFor: ["culture", "slow travel"], min: 3, max: 5 },
      Phuket: { identity: "A convenient Andaman launchpad for beaches and boat days", bestFor: ["beaches", "families"], min: 3, max: 5 },
      Krabi: { identity: "Limestone cliffs, quiet coves and adventurous island hops", bestFor: ["beaches", "adventure"], min: 3, max: 5 },
    },
    routes: [{ name: "City, north & islands", cities: ["Bangkok", "Chiang Mai", "Phuket"], days: 10 }, { name: "Andaman sampler", cities: ["Phuket", "Krabi"], days: 7 }, { name: "Northern reset", cities: ["Chiang Mai", "Bangkok"], days: 7 }],
  },
  indonesia: {
    daily: { budget: 2400, mid: 6500, lux: 17000 }, bestMonths: [4, 5, 6, 7, 8, 9], safety: 4, monthly: [3, 3, 3, 4, 5, 5, 5, 5, 4, 3, 3, 3],
    cities: {
      Bali: { identity: "Rice terraces, surf beaches and a deep Hindu culture", bestFor: ["beaches", "wellness"], min: 4, max: 7 },
      Jakarta: { identity: "A huge, flavourful capital for museums and modern Indonesia", bestFor: ["food", "city breaks"], min: 2, max: 3 },
      Yogyakarta: { identity: "Java's artful gateway to Borobudur and Prambanan", bestFor: ["culture", "history"], min: 2, max: 4 },
      Lombok: { identity: "Quieter beaches and volcano trails beside the Gili islands", bestFor: ["adventure", "beaches"], min: 3, max: 5 },
    },
    routes: [{ name: "Java to Bali", cities: ["Jakarta", "Yogyakarta", "Bali"], days: 10 }, { name: "Island slow trip", cities: ["Bali", "Lombok"], days: 9 }, { name: "Temples and coast", cities: ["Yogyakarta", "Bali"], days: 7 }],
  },
  uae: {
    daily: { budget: 5000, mid: 11500, lux: 30000 }, bestMonths: [1, 2, 3, 11, 12], safety: 5, monthly: [5, 5, 4, 3, 2, 1, 1, 1, 2, 3, 4, 5],
    cities: {
      Dubai: { identity: "Skyline spectacle, shopping and desert evenings", bestFor: ["first trips", "shopping"], min: 3, max: 5 },
      "Abu Dhabi": { identity: "Grand museums, mosques and calm Corniche sunsets", bestFor: ["culture", "families"], min: 2, max: 4 },
      Sharjah: { identity: "A more intimate arts capital with Emirati character", bestFor: ["culture", "food"], min: 1, max: 3 },
    },
    routes: [{ name: "Emirates essentials", cities: ["Dubai", "Abu Dhabi"], days: 7 }, { name: "Arts and skyline", cities: ["Sharjah", "Dubai"], days: 5 }, { name: "Desert and museums", cities: ["Dubai", "Abu Dhabi", "Sharjah"], days: 8 }],
  },
  singapore: {
    daily: { budget: 4200, mid: 9500, lux: 23000 }, bestMonths: [2, 3, 4, 6, 7, 9, 10], safety: 5, monthly: [4, 4, 4, 5, 4, 5, 5, 4, 5, 4, 4, 4],
    cities: { Singapore: { identity: "Hawker classics, gardens and effortless family days", bestFor: ["families", "food"], min: 3, max: 5 } },
    routes: [{ name: "Compact Singapore", cities: ["Singapore"], days: 4 }, { name: "Food and gardens", cities: ["Singapore"], days: 3 }],
  },
  vietnam: {
    daily: { budget: 1800, mid: 4800, lux: 12000 }, bestMonths: [2, 3, 4, 5, 10, 11], safety: 4, monthly: [4, 4, 5, 5, 4, 3, 3, 3, 3, 4, 5, 4],
    cities: {
      Hanoi: { identity: "Old Quarter coffee, lakeside walks and northern history", bestFor: ["food", "culture"], min: 2, max: 4 },
      "Da Nang": { identity: "A relaxed beach city between mountains and heritage towns", bestFor: ["beaches", "families"], min: 3, max: 5 },
      "Ho Chi Minh City": { identity: "Fast-moving southern streets, cafés and wartime history", bestFor: ["food", "city breaks"], min: 2, max: 4 },
      "Hoi An": { identity: "Lantern-lit lanes, tailoring and riverside calm", bestFor: ["culture", "slow travel"], min: 2, max: 4 },
    },
    routes: [{ name: "North to centre", cities: ["Hanoi", "Da Nang", "Hoi An"], days: 10 }, { name: "Two-city taste", cities: ["Hanoi", "Ho Chi Minh City"], days: 8 }, { name: "Beach and heritage", cities: ["Da Nang", "Hoi An"], days: 6 }],
  },
  georgia: {
    daily: { budget: 2200, mid: 5700, lux: 13000 }, bestMonths: [5, 6, 7, 9, 10], safety: 4, monthly: [3, 3, 4, 4, 5, 5, 5, 4, 5, 5, 3, 3],
    cities: {
      Tbilisi: { identity: "Sulphur baths, balconies and a spirited wine-bar scene", bestFor: ["culture", "food"], min: 3, max: 5 },
      Batumi: { identity: "A Black Sea promenade with subtropical gardens and nightlife", bestFor: ["beaches", "nightlife"], min: 2, max: 4 },
      Kutaisi: { identity: "A low-key base for canyons, caves and western monasteries", bestFor: ["nature", "adventure"], min: 2, max: 3 },
    },
    routes: [{ name: "Georgia first look", cities: ["Tbilisi", "Kutaisi", "Batumi"], days: 10 }, { name: "Capital and mountains", cities: ["Tbilisi", "Kutaisi"], days: 7 }, { name: "Black Sea pause", cities: ["Batumi", "Tbilisi"], days: 6 }],
  },
  azerbaijan: {
    daily: { budget: 2600, mid: 6500, lux: 15500 }, bestMonths: [4, 5, 6, 9, 10], safety: 4, monthly: [3, 3, 4, 5, 5, 5, 4, 3, 5, 5, 3, 3],
    cities: {
      Baku: { identity: "Caspian boulevards, flame towers and old-city evenings", bestFor: ["city breaks", "culture"], min: 3, max: 5 },
      Sheki: { identity: "Silk Road history, wooded hills and palace detail", bestFor: ["history", "nature"], min: 2, max: 3 },
      Gabala: { identity: "A green mountain escape with cable cars and lakes", bestFor: ["nature", "families"], min: 2, max: 3 },
    },
    routes: [{ name: "Caspian and Caucasus", cities: ["Baku", "Sheki", "Gabala"], days: 9 }, { name: "Capital plus hills", cities: ["Baku", "Gabala"], days: 7 }, { name: "Silk Road weekend", cities: ["Baku", "Sheki"], days: 6 }],
  },
  nepal: {
    daily: { budget: 1600, mid: 4200, lux: 10000 }, bestMonths: [3, 4, 10, 11], safety: 4, monthly: [4, 4, 5, 5, 3, 2, 2, 2, 3, 5, 5, 4],
    cities: {
      Kathmandu: { identity: "Temple courtyards, old bazaars and Himalayan gateways", bestFor: ["culture", "first trips"], min: 2, max: 4 },
      Pokhara: { identity: "Lakeside calm beneath Annapurna with trails nearby", bestFor: ["nature", "adventure"], min: 3, max: 5 },
      Chitwan: { identity: "Jungle safaris and Tharu culture in the lowlands", bestFor: ["wildlife", "families"], min: 2, max: 3 },
    },
    routes: [{ name: "Classic Nepal", cities: ["Kathmandu", "Pokhara", "Chitwan"], days: 10 }, { name: "Valley and lake", cities: ["Kathmandu", "Pokhara"], days: 7 }, { name: "Temples and tiger country", cities: ["Kathmandu", "Chitwan"], days: 6 }],
  },
  "sri-lanka": {
    daily: { budget: 1900, mid: 5000, lux: 12500 }, bestMonths: [1, 2, 3, 7, 8, 12], safety: 4, monthly: [5, 5, 5, 3, 2, 3, 5, 5, 3, 3, 3, 5],
    cities: {
      Colombo: { identity: "A lively coastal gateway of cafés, markets and colonial lanes", bestFor: ["food", "city breaks"], min: 2, max: 3 },
      Kandy: { identity: "Hill-country temples, lake views and cultural performances", bestFor: ["culture", "history"], min: 2, max: 3 },
      Galle: { identity: "A walkable fort above the island's surf coast", bestFor: ["history", "beaches"], min: 2, max: 4 },
      Ella: { identity: "Tea hills, train views and gentle mountain trails", bestFor: ["nature", "slow travel"], min: 2, max: 4 },
    },
    routes: [{ name: "Island highlights", cities: ["Colombo", "Kandy", "Ella", "Galle"], days: 12 }, { name: "Hills to coast", cities: ["Kandy", "Ella", "Galle"], days: 9 }, { name: "Fort and tea country", cities: ["Galle", "Ella"], days: 7 }],
  },
  japan: {
    daily: { budget: 5200, mid: 12000, lux: 28000 }, bestMonths: [3, 4, 5, 10, 11], safety: 5, monthly: [3, 3, 4, 5, 5, 3, 3, 3, 3, 5, 5, 3],
    cities: {
      Tokyo: { identity: "Endless neighbourhoods, design, ramen and electric nights", bestFor: ["first trips", "food"], min: 4, max: 6 },
      Kyoto: { identity: "Shrines, tea houses and traditional lanes at a slower pace", bestFor: ["culture", "history"], min: 3, max: 5 },
      Osaka: { identity: "Warm hospitality, bold street food and castle history", bestFor: ["food", "nightlife"], min: 2, max: 4 },
      Sapporo: { identity: "Open northern streets, seafood and snowy escapes", bestFor: ["nature", "food"], min: 3, max: 5 },
    },
    routes: [{ name: "Golden Route", cities: ["Tokyo", "Kyoto", "Osaka"], days: 11 }, { name: "Cities and north", cities: ["Tokyo", "Sapporo"], days: 9 }, { name: "Temples and takoyaki", cities: ["Kyoto", "Osaka"], days: 7 }],
  },
  malaysia: {
    daily: { budget: 2000, mid: 5200, lux: 13000 }, bestMonths: [1, 2, 3, 6, 7, 8, 12], safety: 4, monthly: [5, 5, 5, 4, 3, 5, 5, 5, 3, 3, 3, 5],
    cities: {
      "Kuala Lumpur": { identity: "Hawker feasts, high-rise icons and multicultural quarters", bestFor: ["food", "first trips"], min: 2, max: 4 },
      Langkawi: { identity: "A laid-back island of beaches, mangroves and sunsets", bestFor: ["beaches", "families"], min: 3, max: 5 },
      Penang: { identity: "George Town murals, heritage homes and legendary hawkers", bestFor: ["food", "culture"], min: 3, max: 4 },
      Malacca: { identity: "A compact riverfront of Peranakan and Portuguese stories", bestFor: ["history", "slow travel"], min: 1, max: 2 },
    },
    routes: [{ name: "Food and islands", cities: ["Kuala Lumpur", "Penang", "Langkawi"], days: 10 }, { name: "Heritage loop", cities: ["Kuala Lumpur", "Malacca", "Penang"], days: 8 }, { name: "City to coast", cities: ["Kuala Lumpur", "Langkawi"], days: 7 }],
  },
  turkey: {
    daily: { budget: 3200, mid: 8000, lux: 19000 }, bestMonths: [4, 5, 6, 9, 10], safety: 4, monthly: [3, 3, 4, 5, 5, 5, 4, 3, 5, 5, 3, 3],
    cities: {
      Istanbul: { identity: "Two continents of mosques, markets and Bosphorus ferries", bestFor: ["first trips", "history"], min: 4, max: 6 },
      Cappadocia: { identity: "Fairy chimneys, cave stays and sunrise balloon skies", bestFor: ["adventure", "photography"], min: 2, max: 4 },
      Antalya: { identity: "Turquoise coves, Roman ruins and an easy Mediterranean base", bestFor: ["beaches", "families"], min: 3, max: 5 },
      Izmir: { identity: "A breezy Aegean hub for seafood and ancient Ephesus", bestFor: ["food", "history"], min: 2, max: 4 },
    },
    routes: [{ name: "Turkey essentials", cities: ["Istanbul", "Cappadocia", "Antalya"], days: 11 }, { name: "Aegean and ruins", cities: ["Izmir", "Antalya"], days: 8 }, { name: "Mosques and moonscapes", cities: ["Istanbul", "Cappadocia"], days: 8 }],
  },
};

export function getLaunchCity(countrySlug: string, citySlug: string): { cityName: string; countryName: string } | undefined {
  const country = countryNames[countrySlug];
  const cityName = cityNames[countrySlug]?.find((name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === citySlug);
  return country && cityName ? { cityName, countryName: country.name } : undefined;
}
export const countryResponseSchema = z.object({
  slug: z.string(), name: z.string(), region: z.string(), known_for_summary: z.string().max(420),
  visa_status_in: z.enum(["visa_free", "voa", "e_visa", "embassy"]), visa_cost_inr: z.number().nonnegative(),
  visa_process_notes: z.string().max(300), currency: z.string(), daily_cost_inr: z.object({ budget: z.number(), mid: z.number(), lux: z.number() }),
  best_months: z.array(z.number().int().min(1).max(12)).min(1).max(12), domestic_transport: z.string().max(240),
  safety_score: z.number().int().min(1).max(5), suggested_routes: z.array(z.object({ name: z.string().max(80), cities: z.array(z.string()).min(1).max(8), days: z.number().int().min(1).max(30) })).min(2).max(4),
  cities: z.array(z.object({ slug: z.string(), name: z.string(), identity_line: z.string().max(100), best_for: z.array(z.string().max(30)).max(5), suggested_days_min: z.number(), suggested_days_max: z.number() })).min(1).max(20),
  top_dishes: z.array(z.object({ name: z.string().max(80), note: z.string().max(140), where: z.string().max(80).optional() })).min(4).max(6),
  monthly: z.array(z.object({ month: z.number().int().min(1).max(12), label: z.string(), score: z.number().int().min(1).max(5) })).length(12),
  last_verified: z.string().datetime(), generated_at: z.string().datetime(),
});
export type CountryResponse = z.infer<typeof countryResponseSchema>;

const cache = new Map<string, CountryResponse>();
// Generated copy and factual verification have separate clocks.
const generatedAt = new Date().toISOString();
function build(slug: string, now = generatedAt): CountryResponse | undefined {
  const factual = countryNames[slug];
  const curated = editorial[slug as LaunchCountry];
  if (!factual || !curated) return undefined;
  const cities = cityNames[slug].map((name) => {
    const city = curated.cities[name];
    return {
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      identity_line: city.identity,
      best_for: city.bestFor,
      suggested_days_min: city.min,
      suggested_days_max: city.max,
    };
  });
  return {
    slug,
    name: factual.name,
    region: factual.region,
    known_for_summary: factual.summary,
    visa_status_in: factual.visa,
    visa_cost_inr: factual.cost,
    visa_process_notes: factual.notes,
    currency: factual.currency,
    daily_cost_inr: curated.daily,
    best_months: curated.bestMonths,
    domestic_transport: factual.transport,
    safety_score: curated.safety,
    suggested_routes: curated.routes,
    cities,
    top_dishes: topDishes[slug as LaunchCountry],
    monthly: months.map((label, i) => ({ month: i + 1, label, score: curated.monthly[i] })),
    last_verified: now,
    generated_at: now,
  };
}

function fromRows(country: typeof countries.$inferSelect, cityRows: Array<typeof cities.$inferSelect>): CountryResponse | undefined {
  const monthly = Array.isArray(country.whenToGo) ? country.whenToGo : months.map((label, i) => ({ month: i + 1, label, score: [4, 4, 4, 3, 3, 2, 2, 2, 3, 4, 4, 4][i] }));
  const parsed = countryResponseSchema.safeParse({
    slug: country.slug, name: country.name, region: country.region ?? "", known_for_summary: country.knownForSummary ?? "",
    visa_status_in: country.visaStatusIn, visa_cost_inr: country.visaCostInr ?? 0, visa_process_notes: country.visaProcessNotes ?? "",
    currency: country.currency ?? "", daily_cost_inr: country.dailyCostInr, best_months: country.bestMonths ?? [],
    domestic_transport: country.domesticTransport ?? "", safety_score: country.safetyScore ?? 3,
    suggested_routes: country.suggestedRoutes, top_dishes: country.topDishes, monthly,
    cities: cityRows.map((city) => ({ slug: city.slug, name: city.name, identity_line: city.identityLine ?? "", best_for: city.vibeTags ?? [], suggested_days_min: city.idealDaysMin ?? 2, suggested_days_max: city.idealDaysMax ?? 4 })),
    last_verified: country.lastVerified.toISOString(), generated_at: country.generatedAt.toISOString(),
  });
  return parsed.success ? parsed.data : undefined;
}

async function readPersisted(slug: string): Promise<CountryResponse | undefined> {
  const rows = await db.select().from(countries).where(eq(countries.slug, slug)).limit(1);
  if (!rows[0]) return undefined;
  const cityRows = await db.select().from(cities).where(eq(cities.countryId, rows[0].id));
  return fromRows(rows[0], cityRows);
}

async function persist(slug: string): Promise<CountryResponse | undefined> {
  const source = build(slug, new Date().toISOString());
  if (!source) return undefined;
  const result = await db.transaction(async (tx) => {
    const [country] = await tx.insert(countries).values({
      slug, name: source.name, region: source.region, knownForSummary: source.known_for_summary,
      visaStatusIn: source.visa_status_in, visaCostInr: source.visa_cost_inr, visaProcessNotes: source.visa_process_notes,
      currency: source.currency, dailyCostInr: source.daily_cost_inr, bestMonths: source.best_months,
      domesticTransport: source.domestic_transport, safetyScore: source.safety_score, suggestedRoutes: source.suggested_routes,
      whenToGo: source.monthly, topDishes: source.top_dishes, generatedAt: new Date(source.generated_at), lastVerified: new Date(source.last_verified),
    }).onConflictDoUpdate({ target: countries.slug, set: {
      name: source.name,
      region: source.region,
      knownForSummary: source.known_for_summary,
      visaStatusIn: source.visa_status_in,
      visaCostInr: source.visa_cost_inr,
      visaProcessNotes: source.visa_process_notes,
      currency: source.currency,
      dailyCostInr: source.daily_cost_inr,
      bestMonths: source.best_months,
      domesticTransport: source.domestic_transport,
      safetyScore: source.safety_score,
      suggestedRoutes: source.suggested_routes,
       whenToGo: source.monthly,
       topDishes: source.top_dishes,
      generatedAt: new Date(source.generated_at),
    }}).returning();
    await tx.delete(cities).where(eq(cities.countryId, country.id));
    await tx.insert(cities).values(source.cities.map((city) => ({
      countryId: country.id, slug: city.slug, name: city.name, lat: coordinates[city.slug][0], lng: coordinates[city.slug][1],
      identityLine: city.identity_line, idealDaysMin: city.suggested_days_min, idealDaysMax: city.suggested_days_max,
      vibeTags: city.best_for, lastVerified: new Date(source.last_verified), generatedAt: new Date(source.generated_at),
    })));
    return country;
  });
  return readPersisted(slug);
}

export async function getCountry(slug: string, force = false): Promise<{ country?: CountryResponse; cached: boolean }> {
  let current = await readPersisted(slug);
  if (!current && countryNames[slug]) current = cache.get(slug);
  if (!current) {
    if (!countryNames[slug]) return { cached: false };
    const generated = await persist(slug);
    if (generated) cache.set(slug, generated);
    return { country: generated, cached: false };
  }
  const needsRouteRefresh = current.suggested_routes.length < 3;
  const expected = build(slug, current.generated_at);
  const editorialFields = (country: CountryResponse) => JSON.stringify({
    daily_cost_inr: country.daily_cost_inr,
    best_months: country.best_months,
    safety_score: country.safety_score,
    suggested_routes: country.suggested_routes,
    cities: [...country.cities].sort((a, b) => a.slug.localeCompare(b.slug)),
    monthly: country.monthly,
    top_dishes: country.top_dishes,
  });
  const needsEditorialRefresh = Boolean(expected && editorialFields(current) !== editorialFields(expected));
  if (force || needsRouteRefresh || needsEditorialRefresh) {
    const generated = await persist(slug);
    if (generated) cache.set(slug, generated);
    return { country: generated, cached: false };
  }
  cache.set(slug, current);
  return { country: current, cached: true };
}

export async function listCountries(): Promise<CountryResponse[]> {
  const results = await Promise.all(Object.keys(countryNames).map((slug) => getCountry(slug)));
  return results.flatMap(({ country }) => country ? [country] : []);
}
