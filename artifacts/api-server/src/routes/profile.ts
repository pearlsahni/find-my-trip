import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, travelerProfiles } from "@workspace/db";
import {
  GetTravelerProfileResponse,
  UpdateTravelerPreferencesBody,
  UpdateTravelerPreferencesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function userIdFor(req: Parameters<typeof getAuth>[0]): string | null {
  const auth = getAuth(req);
  const claimId = auth.sessionClaims?.userId;
  return typeof claimId === "string" ? claimId : auth.userId ?? null;
}

router.get("/me/preferences", async (req, res) => {
  const userId = userIdFor(req);
  if (!userId) return res.json({ user_id: null, preferences: null });
  const [row] = await db.select().from(travelerProfiles).where(eq(travelerProfiles.clerkUserId, userId)).limit(1);
  return res.json(GetTravelerProfileResponse.parse({
    user_id: userId,
    preferences: row ? UpdateTravelerPreferencesBody.parse(row.preferences) : null,
  }));
});

router.put("/me/preferences", async (req, res) => {
  const userId = userIdFor(req);
  if (!userId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in to save preferences" } });
  const parsed = UpdateTravelerPreferencesBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Preferences are invalid" } });
  await db.insert(travelerProfiles).values({ clerkUserId: userId, preferences: parsed.data })
    .onConflictDoUpdate({ target: travelerProfiles.clerkUserId, set: { preferences: parsed.data, updatedAt: new Date() } });
  return res.json(UpdateTravelerPreferencesResponse.parse({ user_id: userId, preferences: parsed.data }));
});

export default router;