import { and, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@workspace/db";
import { countries } from "@workspace/db/schema";
import { logger } from "../lib/logger";
import { countryNames } from "./countries";

export const COUNTRY_GUIDANCE_FRESHNESS_DAYS = 30;

const factualGuidanceSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  currency: z.string().min(1),
  visa: z.enum(["visa_free", "voa", "e_visa", "embassy"]),
  cost: z.number().int().nonnegative(),
  notes: z.string().min(1).max(300),
  transport: z.string().min(1).max(240),
});

type FactualGuidance = z.infer<typeof factualGuidanceSchema>;
type GuidanceSource = {
  id: string;
  read: (slug: string) => Promise<unknown>;
};

// This allowlist is the trust boundary. Refresh code cannot fetch arbitrary URLs
// or ask a model for factual guidance.
const approvedSources: Record<string, GuidanceSource> = {
  curated_launch_guidance: {
    id: "curated_launch_guidance",
    async read(slug) {
      const facts = countryNames[slug];
      if (!facts) throw new Error(`No curated guidance exists for "${slug}"`);
      return facts;
    },
  },
};

const sourceBindings: Record<string, keyof typeof approvedSources> = Object.fromEntries(
  Object.keys(countryNames).map((slug) => [slug, "curated_launch_guidance"]),
);

export type CountryRefreshResult =
  | { slug: string; status: "refreshed"; source: string; verifiedAt: Date }
  | { slug: string; status: "failed"; source?: string; error: string };

export async function refreshCountryGuidance(
  slug: string,
  now = new Date(),
): Promise<CountryRefreshResult> {
  const sourceId = sourceBindings[slug];
  const source = sourceId ? approvedSources[sourceId] : undefined;
  if (!source) {
    const error = "Country has no approved guidance source binding";
    logger.error({ slug, error }, "Country guidance refresh failed");
    return { slug, status: "failed", error };
  }

  try {
    const facts: FactualGuidance = factualGuidanceSchema.parse(await source.read(slug));
    await db.update(countries).set({
      name: facts.name,
      region: facts.region,
      currency: facts.currency,
      visaStatusIn: facts.visa,
      visaCostInr: facts.cost,
      visaProcessNotes: facts.notes,
      domesticTransport: facts.transport,
      lastVerified: now,
      guidanceSource: source.id,
      guidanceRefreshError: null,
    }).where(and(eq(countries.slug, slug), lt(countries.lastVerified, now)));
    logger.info({ slug, source: source.id, verifiedAt: now.toISOString() }, "Country guidance refreshed");
    return { slug, status: "refreshed", source: source.id, verifiedAt: now };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause);
    await db.update(countries).set({
      guidanceRefreshError: error.slice(0, 1000),
    }).where(and(eq(countries.slug, slug), lt(countries.lastVerified, now))).catch((logCause) => {
      logger.error({ slug, err: logCause }, "Could not persist country guidance refresh error");
    });
    logger.error({ slug, source: source.id, err: cause }, "Country guidance refresh failed; previous guidance preserved");
    return { slug, status: "failed", source: source.id, error };
  }
}

export async function refreshStaleCountryGuidance(
  now = new Date(),
  freshnessDays = COUNTRY_GUIDANCE_FRESHNESS_DAYS,
): Promise<CountryRefreshResult[]> {
  const cutoff = new Date(now.getTime() - freshnessDays * 24 * 60 * 60 * 1000);
  const stale = await db.select({ slug: countries.slug })
    .from(countries)
    .where(lt(countries.lastVerified, cutoff));
  const results: CountryRefreshResult[] = [];
  for (const { slug } of stale) results.push(await refreshCountryGuidance(slug, now));
  logger.info({
    cutoff: cutoff.toISOString(),
    staleCount: stale.length,
    refreshedCount: results.filter((result) => result.status === "refreshed").length,
    failedCount: results.filter((result) => result.status === "failed").length,
  }, "Country guidance refresh run completed");
  return results;
}

export function startCountryGuidanceRefreshScheduler(): NodeJS.Timeout | undefined {
  if (process.env.NODE_ENV === "test" || process.env.COUNTRY_GUIDANCE_REFRESH_DISABLED === "true") {
    return undefined;
  }
  const intervalHours = Number(process.env.COUNTRY_GUIDANCE_REFRESH_INTERVAL_HOURS ?? 24);
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;
  const run = () => void refreshStaleCountryGuidance().catch((err) => {
    logger.error({ err }, "Country guidance scheduled refresh failed");
  });
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}