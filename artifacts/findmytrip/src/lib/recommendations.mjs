const interestTerms = {
  food: ['food', 'market', 'cuisine', 'restaurant', 'culinary'],
  culture: ['culture', 'history', 'heritage', 'temple', 'museum', 'architecture'],
  nature: ['nature', 'mountain', 'forest', 'wildlife', 'landscape'],
  beaches: ['beach', 'island', 'coast', 'sea', 'surf'],
  wellness: ['wellness', 'spa', 'yoga', 'slow'],
  nightlife: ['nightlife', 'night', 'bar', 'music'],
  adventure: ['adventure', 'hike', 'diving', 'trek', 'outdoor'],
  shopping: ['shopping', 'market', 'design', 'boutique'],
};

const vibeTerms = {
  hippie: ['beach', 'island', 'slow', 'creative'],
  bougie: ['luxury', 'design', 'restaurant', 'boutique'],
  offbeat: ['hidden', 'old', 'nature', 'village'],
  easygoing: ['slow', 'beach', 'walk', 'cafe'],
  'high-energy': ['night', 'city', 'adventure', 'market'],
  romantic: ['romantic', 'scenic', 'island', 'old'],
};

function matches(text, terms) {
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

export function rankDestinations(countries, preferences, limit = 4) {
  const interests = preferences?.interests ?? [];
  const vibes = preferences?.vibes ?? [];
  return countries.flatMap((country) => country.cities.map((city) => {
    const text = [country.name, country.region, country.known_for_summary, city.name, city.identity_line, ...(city.best_for ?? [])].join(' ').toLowerCase();
    let score = 0;
    const reasons = [];
    for (const interest of interests) {
      const hit = matches(text, interestTerms[interest] ?? [interest.toLowerCase()]);
      if (hit) {
        score += hit * 4;
        reasons.push(`your interest in ${interest}`);
      }
    }
    for (const vibe of vibes) {
      const hit = matches(text, vibeTerms[vibe] ?? [vibe.toLowerCase()]);
      if (hit) {
        score += hit * 2;
        reasons.push(`a ${vibe.replace('-', ' ')} pace`);
      }
    }
    if (preferences?.diet?.includes('vegetarian') && /food|market|cuisine|vegetarian/.test(text)) score += 2;
    if (preferences?.companions && (city.best_for ?? []).some((tag) => tag.toLowerCase().includes(preferences.companions))) score += 3;
    return {
      ...city,
      countryName: country.name,
      countrySlug: country.slug,
      score,
      reason: reasons.length ? `Matched for ${reasons.slice(0, 2).join(' and ')}.` : `A strong all-round match from ${country.region}.`,
    };
  })).sort((a, b) => b.score - a.score || a.countrySlug.localeCompare(b.countrySlug) || a.slug.localeCompare(b.slug)).slice(0, limit);
}