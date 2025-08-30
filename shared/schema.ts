import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  projectType: varchar("project_type").notNull(),
  targetFloors: integer("target_floors").notNull(),
  studioUnits: integer("studio_units").default(0),
  oneBedUnits: integer("one_bed_units").default(0),
  twoBedUnits: integer("two_bed_units").default(0),
  threeBedUnits: integer("three_bed_units").default(0),
  targetParkingSpaces: integer("target_parking_spaces").notNull(),
  buildingDimensions: varchar("building_dimensions"),
  constructionType: varchar("construction_type"),
  
  // Feasibility scoring
  zoningScore: decimal("zoning_score", { precision: 3, scale: 1 }),
  zoningJustification: text("zoning_justification"),
  massingScore: decimal("massing_score", { precision: 3, scale: 1 }),
  massingJustification: text("massing_justification"),
  costScore: decimal("cost_score", { precision: 3, scale: 1 }),
  costJustification: text("cost_justification"),
  sustainabilityScore: decimal("sustainability_score", { precision: 3, scale: 1 }),
  sustainabilityJustification: text("sustainability_justification"),
  logisticsScore: decimal("logistics_score", { precision: 3, scale: 1 }),
  logisticsJustification: text("logistics_justification"),
  buildTimeScore: decimal("build_time_score", { precision: 3, scale: 1 }),
  buildTimeJustification: text("build_time_justification"),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  
  // Cost analysis
  modularTotalCost: decimal("modular_total_cost", { precision: 12, scale: 2 }),
  modularCostPerSf: decimal("modular_cost_per_sf", { precision: 8, scale: 2 }),
  modularCostPerUnit: decimal("modular_cost_per_unit", { precision: 10, scale: 2 }),
  siteBuiltTotalCost: decimal("site_built_total_cost", { precision: 12, scale: 2 }),
  siteBuiltCostPerSf: decimal("site_built_cost_per_sf", { precision: 8, scale: 2 }),
  siteBuiltCostPerUnit: decimal("site_built_cost_per_unit", { precision: 10, scale: 2 }),
  costSavingsPercent: decimal("cost_savings_percent", { precision: 5, scale: 2 }),
  
  // Timeline analysis
  modularTimelineMonths: integer("modular_timeline_months"),
  siteBuiltTimelineMonths: integer("site_built_timeline_months"),
  timeSavingsMonths: integer("time_savings_months"),
  
  // Zoning details
  zoningDistrict: varchar("zoning_district"),
  densityBonusEligible: boolean("density_bonus_eligible").default(false),
  requiredWaivers: text("required_waivers"),
  
  // Logistics details
  factoryLocation: varchar("factory_location"),
  transportationNotes: text("transportation_notes"),
  stagingNotes: text("staging_notes"),
  
  // Application workflow progress tracking
  modularFeasibilityComplete: boolean("modular_feasibility_complete").default(false),
  smartStartComplete: boolean("smart_start_complete").default(false),
  fabAssureComplete: boolean("fab_assure_complete").default(false),
  easyDesignComplete: boolean("easy_design_complete").default(false),
  
  // SmartStart application fields
  entitlementStatus: varchar("entitlement_status"),
  entitlementNotes: text("entitlement_notes"),
  planningSdkSubmitted: boolean("planning_sdk_submitted").default(false),
  preliminaryDesignComplete: boolean("preliminary_design_complete").default(false),
  permitApplicationSubmitted: boolean("permit_application_submitted").default(false),
  permitStatus: varchar("permit_status"),
  permitNotes: text("permit_notes"),
  
  // FabAssure application fields
  factoryPartner: varchar("factory_partner"),
  factorySchedulingComplete: boolean("factory_scheduling_complete").default(false),
  qualityAssurancePlan: text("quality_assurance_plan"),
  fabricationStart: timestamp("fabrication_start"),
  fabricationTimeline: text("fabrication_timeline"),
  qualityCheckpoints: text("quality_checkpoints"),
  shippingPlan: text("shipping_plan"),
  factoryInspectionScheduled: boolean("factory_inspection_scheduled").default(false),
  
  // EasyDesign application fields
  designCustomizationLevel: varchar("design_customization_level"),
  architecturalPlansFinalized: boolean("architectural_plans_finalized").default(false),
  interiorDesignComplete: boolean("interior_design_complete").default(false),
  materialSelectionsFinalized: boolean("material_selections_finalized").default(false),
  systemsDesignComplete: boolean("systems_design_complete").default(false),
  finalDesignApproval: boolean("final_design_approval").default(false),
  designNotes: text("design_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost breakdown table (MasterFormat categories)
export const costBreakdowns = pgTable("cost_breakdowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  category: varchar("category").notNull(), // MasterFormat category
  siteBuiltCost: decimal("site_built_cost", { precision: 10, scale: 2 }),
  raapGcCost: decimal("raap_gc_cost", { precision: 10, scale: 2 }),
  raapFabCost: decimal("raap_fab_cost", { precision: 10, scale: 2 }),
  raapTotalCost: decimal("raap_total_cost", { precision: 10, scale: 2 }),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostBreakdownSchema = createInsertSchema(costBreakdowns).omit({
  id: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCostBreakdown = z.infer<typeof insertCostBreakdownSchema>;
export type CostBreakdown = typeof costBreakdowns.$inferSelect;
