// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  region: text("region"),
  knownForSummary: text("known_for_summary"),
  visaStatusIn: text("visa_status_in"),
  visaCostInr: integer("visa_cost_inr"),
  visaProcessNotes: text("visa_process_notes"),
  currency: text("currency"),
  dailyCostInr: jsonb("daily_cost_inr"),
  bestMonths: smallint("best_months").array(),
  domesticTransport: text("domestic_transport"),
  safetyScore: smallint("safety_score"),
  suggestedRoutes: jsonb("suggested_routes"),
  topDishes: jsonb("top_dishes"),
  whenToGo: jsonb("when_to_go"),
  guidanceSource: text("guidance_source"),
  guidanceRefreshError: text("guidance_refresh_error"),
  lastVerified: timestamp("last_verified", { withTimezone: true }).defaultNow().notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: uuid("id").defaultRandom().primaryKey(),
  countryId: uuid("country_id").notNull().references(() => countries.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  identityLine: text("identity_line"),
  knownForSummary: text("known_for_summary"),
  idealDaysMin: smallint("ideal_days_min"),
  idealDaysMax: smallint("ideal_days_max"),
  dailyCostInr: jsonb("daily_cost_inr"),
  bestMonths: smallint("best_months").array(),
  crowdByMonth: smallint("crowd_by_month").array(),
  flightTimeFrom: jsonb("flight_time_from"),
  directFlight: boolean("direct_flight"),
  safetyScore: smallint("safety_score"),
  soloFemaleScore: smallint("solo_female_score"),
  vegFoodScore: smallint("veg_food_score"),
  gettingAround: jsonb("getting_around"),
  vibeTags: text("vibe_tags").array(),
  lastVerified: timestamp("last_verified", { withTimezone: true }).defaultNow().notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const travelerProfiles = pgTable("traveler_profiles", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  preferences: jsonb("preferences").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Country = typeof countries.$inferSelect;
export type City = typeof cities.$inferSelect;
export type TravelerProfile = typeof travelerProfiles.$inferSelect;

export * from "./city-content";
