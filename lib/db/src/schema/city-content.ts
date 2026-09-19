import {
  boolean,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { cities } from "./index";

export const areas = pgTable("areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  character: text("character"),
  goodFor: text("good_for").array(),
  costBand: text("cost_band"),
});

export const places = pgTable("places", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "cascade" }),
  areaId: uuid("area_id").references(() => areas.id),
  googlePlaceId: text("google_place_id").unique(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  openingHours: jsonb("opening_hours"),
  costBandInr: text("cost_band_inr"),
  priceInr: integer("price_inr"),
  avgDurationMins: smallint("avg_duration_mins"),
  physicalIntensity: smallint("physical_intensity"),
  bestTimeOfDay: text("best_time_of_day"),
  suitsSolo: boolean("suits_solo").default(true),
  suitsCouples: boolean("suits_couples").default(true),
  suitsFriends: boolean("suits_friends").default(true),
  suitsFamily: boolean("suits_family").default(true),
  suitsParents: boolean("suits_parents").default(true),
  vegFriendly: boolean("veg_friendly"),
  indoorOutdoor: text("indoor_outdoor"),
  vibeTags: text("vibe_tags").array(),
  isSignature: boolean("is_signature").default(false),
  bookingUrl: text("booking_url"),
  affiliatePartner: text("affiliate_partner"),
  travelTimeMins: smallint("travel_time_mins"),
  transportMode: text("transport_mode"),
  overnightRecommended: boolean("overnight_recommended"),
  lastVerified: timestamp("last_verified", { withTimezone: true }).defaultNow().notNull(),
});

export const dishes = pgTable("dishes", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  note: text("note"),
  veg: boolean("veg"),
});

export const tips = pgTable("tips", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: text("scope").notNull(),
  scopeId: uuid("scope_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: smallint("priority").default(3),
  lastVerified: timestamp("last_verified", { withTimezone: true }).defaultNow().notNull(),
});

export const travellerNotes = pgTable("traveller_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "cascade" }),
  attribution: text("attribution").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const generationLog = pgTable("generation_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  model: text("model"),
  droppedCount: integer("dropped_count").default(0),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Area = typeof areas.$inferSelect;
export type Place = typeof places.$inferSelect;