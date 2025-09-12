import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const zoningAnalyses = pgTable("zoning_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  address: text("address").notNull(),
  zoneClassification: text("zone_classification"),
  maxHeight: text("max_height"),
  setbacks: json("setbacks").$type<{
    front?: string;
    side?: string;
    rear?: string;
  }>(),
  score: real("score"),
  analysisData: json("analysis_data").$type<any>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => zoningAnalyses.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertZoningAnalysisSchema = createInsertSchema(zoningAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ZoningAnalysis = typeof zoningAnalyses.$inferSelect;
export type InsertZoningAnalysis = z.infer<typeof insertZoningAnalysisSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
