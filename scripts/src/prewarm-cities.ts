const launchCities: Array<[countrySlug: string, citySlug: string]> = [
  ["thailand", "bangkok"], ["thailand", "chiang-mai"], ["thailand", "phuket"], ["thailand", "krabi"],
  ["indonesia", "bali"], ["indonesia", "jakarta"], ["indonesia", "yogyakarta"], ["indonesia", "lombok"],
  ["uae", "dubai"], ["uae", "abu-dhabi"], ["uae", "sharjah"], ["singapore", "singapore"],
  ["vietnam", "hanoi"], ["vietnam", "da-nang"], ["vietnam", "ho-chi-minh-city"], ["vietnam", "hoi-an"],
  ["georgia", "tbilisi"], ["georgia", "batumi"], ["georgia", "kutaisi"],
  ["azerbaijan", "baku"], ["azerbaijan", "sheki"], ["azerbaijan", "gabala"],
  ["nepal", "kathmandu"], ["nepal", "pokhara"], ["nepal", "chitwan"],
  ["sri-lanka", "colombo"], ["sri-lanka", "kandy"], ["sri-lanka", "galle"], ["sri-lanka", "ella"],
  ["japan", "tokyo"], ["japan", "kyoto"], ["japan", "osaka"], ["japan", "sapporo"],
  ["malaysia", "kuala-lumpur"], ["malaysia", "langkawi"], ["malaysia", "penang"], ["malaysia", "malacca"],
  ["turkey", "istanbul"], ["turkey", "cappadocia"], ["turkey", "antalya"], ["turkey", "izmir"],
];

const baseUrl = (process.env.CITY_API_BASE_URL ?? "http://localhost:80").replace(/\/$/, "");
async function main() {
  let failures = 0;

  for (const [countrySlug, citySlug] of launchCities) {
    const response = await fetch(`${baseUrl}/api/generate/city`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ countrySlug, citySlug }),
    });
    if (!response.ok) {
      failures += 1;
      process.stderr.write(`Failed ${countrySlug}/${citySlug}: ${response.status}\n`);
    }
  }

  if (failures) {
    throw new Error(`City prewarm failed for ${failures} launch cities`);
  }

  process.stdout.write(`Prewarmed ${launchCities.length} launch cities\n`);
}

void main();