const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const localPhoto = (photoId: string) => publicAsset(`images/destinations/photos/${photoId}.webp`);

const curatedHeroImages: Record<string, string> = {
  thailand: localPhoto('photo-1552465011-b4e21bf6e79a'),
  indonesia: localPhoto('photo-1537996194471-e657df975ab4'),
  uae: localPhoto('photo-1512453979798-5ea266f8880c'),
  singapore: localPhoto('photo-1525625293386-3f8f99389edd'),
  vietnam: localPhoto('photo-1528127269322-539801943592'),
  georgia: localPhoto('photo-1565008576549-57569a49371d'),
  azerbaijan: localPhoto('photo-1500534623283-312aade485b7'),
  nepal: localPhoto('photo-1544735716-392fe2489ffa'),
  'sri-lanka': localPhoto('photo-1586861635167-e5223aadc9fe'),
  japan: localPhoto('photo-1490806843957-31f4c9a91c65'),
  malaysia: localPhoto('photo-1506929562872-bb421503ef21'),
  turkey: localPhoto('photo-1524231757912-21f4fe3a7200'),
};

const cityPhotoIds: Record<string, string> = {
  bangkok: 'photo-1508009603885-50cf7c579365',
  'chiang-mai': 'photo-1552465011-b4e21bf6e79a',
  phuket: 'photo-1589394815804-964ed0be2eb5',
  krabi: 'photo-1539367628448-4bc5c9d171c8',
  bali: 'photo-1537996194471-e657df975ab4',
  jakarta: 'photo-1555899434-94d1368aa7af',
  lombok: 'photo-1507525428034-b723cf961d3e',
  dubai: 'photo-1512453979798-5ea266f8880c',
  'abu-dhabi': 'photo-1518684079-3c830dcef090',
  sharjah: 'photo-1518684079-3c830dcef090',
  singapore: 'photo-1525625293386-3f8f99389edd',
  hanoi: 'photo-1528127269322-539801943592',
  'da-nang': 'photo-1559592413-7cec4d0cae2b',
  'ho-chi-minh-city': 'photo-1583417319070-4a69db38a482',
  'hoi-an': 'photo-1557750255-c76072a7aad1',
  tbilisi: 'photo-1565008576549-57569a49371d',
  batumi: 'photo-1577083552431-6e5fd01aa342',
  baku: 'photo-1500534623283-312aade485b7',
  kathmandu: 'photo-1533130061792-64b345e4a833',
  pokhara: 'photo-1518002054494-3a6f94352e9d',
  chitwan: 'photo-1544735716-392fe2489ffa',
  colombo: 'photo-1586861635167-e5223aadc9fe',
  kandy: 'photo-1566296314736-6eaac1ca0cb9',
  galle: 'photo-1586861635167-e5223aadc9fe',
  ella: 'photo-1586861635167-e5223aadc9fe',
  tokyo: 'photo-1540959733332-eab4deabeeaf',
  kyoto: 'photo-1493976040374-85c8e12f0c0e',
  osaka: 'photo-1590559899731-a382839e5549',
  sapporo: 'photo-1490806843957-31f4c9a91c65',
  'kuala-lumpur': 'photo-1596422846543-75c6fc197f07',
  langkawi: 'photo-1506929562872-bb421503ef21',
  penang: 'photo-1506929562872-bb421503ef21',
  istanbul: 'photo-1524231757912-21f4fe3a7200',
  cappadocia: 'photo-1528181304800-259b08848526',
  antalya: 'photo-1524231757912-21f4fe3a7200',
};

const countrySlugsByName: Record<string, string> = {
  thailand: 'thailand',
  indonesia: 'indonesia',
  'united arab emirates': 'uae',
  singapore: 'singapore',
  vietnam: 'vietnam',
  georgia: 'georgia',
  azerbaijan: 'azerbaijan',
  nepal: 'nepal',
  'sri lanka': 'sri-lanka',
  japan: 'japan',
  malaysia: 'malaysia',
  turkey: 'turkey',
};

const fallbackImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#183b3b"/><path d="M0 640 320 410l170 130 170-210 540 310v160H0z" fill="#ed704f"/><circle cx="860" cy="180" r="92" fill="#efc86e"/></svg>',
  );

function imageKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ',')
    .replace(/^,|,$/g, '');
}

export function countryHeroImage(slug: string): string {
  return curatedHeroImages[slug] ?? fallbackImage;
}

export function cityImage(city: string, country: string): string {
  const slug = imageKey(city).replace(/,/g, '-');
  const photoId = cityPhotoIds[slug];
  if (photoId) return localPhoto(photoId);

  const countryName = imageKey(country).replace(/,/g, ' ');
  const countrySlug = countrySlugsByName[countryName];
  return countrySlug ? countryHeroImage(countrySlug) : fallbackImage;
}

export function companionImage(country: string): string {
  const slug = imageKey(country).replace(/,/g, '-');
  return countryHeroImage(slug);
}

export function fallbackCountryImage(): string {
  return fallbackImage;
}