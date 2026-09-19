import { Router, type IRouter } from "express";
import { GenerateCityBody, GenerateCityResponse, GetCityParams, GetCityResponse } from "@workspace/api-zod";
import { getCity } from "../services/cities";

const router: IRouter = Router();

router.get("/cities/:countrySlug/:citySlug", async (req, res): Promise<void> => {
  const params = GetCityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: { code: "INVALID_SLUG", message: "Country or city slug is invalid" } });
    return;
  }
  const result = await getCity(params.data.countrySlug, params.data.citySlug);
  if (!result.city) {
    res.status(404).json({ error: { code: "CITY_NOT_FOUND", message: "City not found" } });
    return;
  }
  res.json(GetCityResponse.parse(result.city));
});

router.post("/generate/city", async (req, res): Promise<void> => {
  const parsed = GenerateCityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "countrySlug, citySlug and optional force are required" } });
    return;
  }
  const result = await getCity(parsed.data.countrySlug, parsed.data.citySlug, parsed.data.force);
  if (!result.city) {
    res.status(404).json({ error: { code: "CITY_NOT_FOUND", message: "City not found" } });
    return;
  }
  res.json(GenerateCityResponse.parse({
    cityId: `${parsed.data.countrySlug}/${parsed.data.citySlug}`,
    cached: result.cached,
    droppedCount: result.city.dropped_count,
  }));
});

export default router;