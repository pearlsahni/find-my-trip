import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { countryResponseSchema, getCountry, listCountries } from "../services/countries";

const router: IRouter = Router();
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const requestSchema = z.object({ countrySlug: slugSchema, force: z.boolean().optional().default(false) });

function notFound(res: Response): Response {
  return res.status(404).json({ error: { code: "COUNTRY_NOT_FOUND", message: "Country not found" } });
}

router.get("/countries", async (_req, res) => {
  const countries = await listCountries();
  return res.json(z.array(countryResponseSchema).parse(countries));
});

router.get("/countries/:countrySlug", async (req, res) => {
  const parsed = slugSchema.safeParse(req.params.countrySlug);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_SLUG", message: "Country slug is invalid" } });
  const result = await getCountry(parsed.data);
  if (!result.country) return notFound(res);
  return res.json(countryResponseSchema.parse(result.country));
});

router.post("/generate/country", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "countrySlug and optional force are required" } });
  const result = await getCountry(parsed.data.countrySlug, parsed.data.force);
  if (!result.country) return notFound(res);
  return res.json(countryResponseSchema.parse(result.country));
});

export default router;