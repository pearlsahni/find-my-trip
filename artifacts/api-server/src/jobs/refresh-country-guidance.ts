import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { refreshStaleCountryGuidance } from "../services/country-guidance-refresh";

try {
  const results = await refreshStaleCountryGuidance();
  if (results.some((result) => result.status === "failed")) process.exitCode = 1;
} catch (err) {
  logger.error({ err }, "Country guidance refresh job failed");
  process.exitCode = 1;
} finally {
  await pool.end();
}