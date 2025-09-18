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

// Projects table - Enhanced with unified JSON fields for single source of truth
export const projects = pgTable("projects", {
  // Core Project Information (keep existing column names for compatibility)
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
  isSample: boolean("is_sample").default(false),
  
  // Feasibility scoring (keep existing for compatibility)
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
  
  // Cost analysis (keep existing for compatibility)
  modularTotalCost: decimal("modular_total_cost", { precision: 12, scale: 2 }),
  modularCostPerSf: decimal("modular_cost_per_sf", { precision: 8, scale: 2 }),
  modularCostPerUnit: decimal("modular_cost_per_unit", { precision: 10, scale: 2 }),
  siteBuiltTotalCost: decimal("site_built_total_cost", { precision: 12, scale: 2 }),
  siteBuiltCostPerSf: decimal("site_built_cost_per_sf", { precision: 8, scale: 2 }),
  siteBuiltCostPerUnit: decimal("site_built_cost_per_unit", { precision: 10, scale: 2 }),
  costSavingsPercent: decimal("cost_savings_percent", { precision: 5, scale: 2 }),
  
  // Timeline analysis (keep existing for compatibility)
  modularTimelineMonths: decimal("modular_timeline_months", { precision: 4, scale: 1 }),
  siteBuiltTimelineMonths: decimal("site_built_timeline_months", { precision: 4, scale: 1 }),
  timeSavingsMonths: decimal("time_savings_months", { precision: 4, scale: 1 }),
  
  // Zoning details (keep existing for compatibility)
  zoningDistrict: varchar("zoning_district"),
  densityBonusEligible: boolean("density_bonus_eligible").default(false),
  requiredWaivers: text("required_waivers"),
  
  // Logistics details (keep existing for compatibility)
  factoryLocation: varchar("factory_location"),
  transportationNotes: text("transportation_notes"),
  stagingNotes: text("staging_notes"),
  
  // Application workflow progress tracking (keep existing for compatibility)
  modularFeasibilityComplete: boolean("modular_feasibility_complete").default(false),
  smartStartComplete: boolean("smart_start_complete").default(false),
  fabAssureComplete: boolean("fab_assure_complete").default(false),
  easyDesignComplete: boolean("easy_design_complete").default(false),
  
  // SmartStart application fields (keep existing for compatibility)
  entitlementStatus: varchar("entitlement_status"),
  entitlementNotes: text("entitlement_notes"),
  planningSdkSubmitted: boolean("planning_sdk_submitted").default(false),
  preliminaryDesignComplete: boolean("preliminary_design_complete").default(false),
  permitApplicationSubmitted: boolean("permit_application_submitted").default(false),
  permitStatus: varchar("permit_status"),
  permitNotes: text("permit_notes"),
  
  // Design Package fields (keep existing for compatibility)
  buildingLayoutComplete: boolean("building_layout_complete").default(false),
  unitDesignsComplete: boolean("unit_designs_complete").default(false),
  buildingRenderingsComplete: boolean("building_renderings_complete").default(false),
  designPackageStatus: varchar("design_package_status"),
  buildingRenderingUrls: text("building_rendering_urls"),
  unitLayoutData: text("unit_layout_data"),
  buildingLayoutData: text("building_layout_data"),
  
  // AOR Collaboration fields (keep existing for compatibility)
  aorPartner: varchar("aor_partner"),
  aorContactInfo: text("aor_contact_info"),
  designHandoffComplete: boolean("design_handoff_complete").default(false),
  aorReviewStatus: varchar("aor_review_status"),
  aorFeedback: text("aor_feedback"),
  entitlementPackageStatus: varchar("entitlement_package_status"),
  
  // Refined Pricing Package fields (keep existing for compatibility)
  fabricatorPartner1: varchar("fabricator_partner_1"),
  fabricatorPartner2: varchar("fabricator_partner_2"),
  fabricatorPartner3: varchar("fabricator_partner_3"),
  gcPartner1: varchar("gc_partner_1"),
  gcPartner2: varchar("gc_partner_2"),
  gcPartner3: varchar("gc_partner_3"),
  fabricatorPricing1: decimal("fabricator_pricing_1", { precision: 12, scale: 2 }),
  fabricatorPricing2: decimal("fabricator_pricing_2", { precision: 12, scale: 2 }),
  fabricatorPricing3: decimal("fabricator_pricing_3", { precision: 12, scale: 2 }),
  gcPricing1: decimal("gc_pricing_1", { precision: 12, scale: 2 }),
  gcPricing2: decimal("gc_pricing_2", { precision: 12, scale: 2 }),
  gcPricing3: decimal("gc_pricing_3", { precision: 12, scale: 2 }),
  pricingValidationComplete: boolean("pricing_validation_complete").default(false),
  refinedCostingComplete: boolean("refined_costing_complete").default(false),
  
  // Cost Collaboration fields (keep existing for compatibility)
  fabricatorNegotiationStatus: varchar("fabricator_negotiation_status"),
  gcNegotiationStatus: varchar("gc_negotiation_status"),
  costFinalizationComplete: boolean("cost_finalization_complete").default(false),
  finalSelectedFabricator: varchar("final_selected_fabricator"),
  finalSelectedGc: varchar("final_selected_gc"),
  finalFabricatorCost: decimal("final_fabricator_cost", { precision: 12, scale: 2 }),
  finalGcCost: decimal("final_gc_cost", { precision: 12, scale: 2 }),
  costCollaborationNotes: text("cost_collaboration_notes"),
  
  // FabAssure application fields (keep existing for compatibility)
  factoryPartner: varchar("factory_partner"),
  factorySchedulingComplete: boolean("factory_scheduling_complete").default(false),
  qualityAssurancePlan: text("quality_assurance_plan"),
  fabricationStart: timestamp("fabrication_start"),
  fabricationTimeline: text("fabrication_timeline"),
  qualityCheckpoints: text("quality_checkpoints"),
  shippingPlan: text("shipping_plan"),
  factoryInspectionScheduled: boolean("factory_inspection_scheduled").default(false),
  
  // EasyDesign application fields (keep existing for compatibility)
  designCustomizationLevel: varchar("design_customization_level"),
  architecturalPlansFinalized: boolean("architectural_plans_finalized").default(false),
  interiorDesignComplete: boolean("interior_design_complete").default(false),
  materialSelectionsFinalized: boolean("material_selections_finalized").default(false),
  systemsDesignComplete: boolean("systems_design_complete").default(false),
  finalDesignApproval: boolean("final_design_approval").default(false),
  designNotes: text("design_notes"),
  
  // NEW: Unified JSON fields for enhanced data organization (additive approach)
  // These provide a single source of truth while maintaining backward compatibility
  
  // Comprehensive Cost Analysis (replaces separate costBreakdowns table)
  costAnalysis: jsonb("cost_analysis").$type<{
    masterFormatBreakdown: Array<{
      category: string;
      categoryCode: string;
      siteBuiltCost: number;
      modularGcCost: number;
      modularFabCost: number;
      modularTotalCost: number;
      modularCostPerSf: number;
    }>;
    detailedMetrics: {
      modularConstruction: {
        designPhaseMonths: number;
        fabricationMonths: number;
        siteWorkMonths: number;
      };
      siteBuiltConstruction: {
        designPhaseMonths: number;
        constructionMonths: number;
      };
      comparison: {
        costSavingsAmount: number;
        timeSavingsMonths: number;
        timeSavingsPercent: number;
      };
    };
    pricingValidation: {
      isComplete: boolean;
      validatedBy: string;
      validatedAt: string; // ISO string
      notes: string;
    };
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost breakdown table (MasterFormat categories) - Keep existing for backward compatibility
export const costBreakdowns = pgTable("cost_breakdowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  category: varchar("category").notNull(), // MasterFormat category
  siteBuiltCost: decimal("site_built_cost", { precision: 10, scale: 2 }),
  raapGcCost: decimal("raap_gc_cost", { precision: 10, scale: 2 }),
  raapFabCost: decimal("raap_fab_cost", { precision: 10, scale: 2 }),
  raapTotalCost: decimal("raap_total_cost", { precision: 10, scale: 2 }),
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type CostBreakdown = typeof costBreakdowns.$inferSelect;
export type InsertCostBreakdown = typeof costBreakdowns.$inferInsert;

// Schema validation for the unified project structure
// Zod schema that mirrors the costAnalysis JSON structure
export const costAnalysisSchema = z.object({
  masterFormatBreakdown: z.array(z.object({
    category: z.string(),
    categoryCode: z.string(),
    siteBuiltCost: z.number(),
    modularGcCost: z.number(),
    modularFabCost: z.number(),
    modularTotalCost: z.number(),
    modularCostPerSf: z.number(),
  })),
  detailedMetrics: z.object({
    modularConstruction: z.object({
      designPhaseMonths: z.number(),
      fabricationMonths: z.number(),
      siteWorkMonths: z.number()
    }),
    siteBuiltConstruction: z.object({
      designPhaseMonths: z.number(),
      constructionMonths: z.number()
    }),
    comparison: z.object({
      costSavingsAmount: z.number(),
      timeSavingsMonths: z.number(),
      timeSavingsPercent: z.number()
    })
  }),
  pricingValidation: z.object({
    isComplete: z.boolean(),
    validatedBy: z.string(),
    validatedAt: z.string(),
    notes: z.string()
  })
});

export const insertProjectSchema = createInsertSchema(projects, {
  costAnalysis: costAnalysisSchema.optional()
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostBreakdownSchema = createInsertSchema(costBreakdowns).omit({
  id: true,
});

// Helper schemas for structured data validation
export const buildingConfigurationSchema = z.object({
  floors: z.number().min(1),
  buildingDimensions: z.string(),
  constructionType: z.string(),
  unitMix: z.object({
    studio: z.number().min(0),
    oneBedroom: z.number().min(0),
    twoBedroom: z.number().min(0),
    threeBedroom: z.number().min(0),
  }),
  parking: z.object({
    targetSpaces: z.number().min(0),
    parkingType: z.enum(['surface', 'garage', 'mixed']),
  }),
  buildingSpecs: z.object({
    grossSquareFootage: z.number().min(1),
    unitAverageSize: z.number().min(1),
    commonAreaSize: z.number().min(0),
  }),
});

export const feasibilityAssessmentSchema = z.object({
  scoringWeights: z.object({
    zoning: z.number(),
    massing: z.number(),
    sustainability: z.number(),
    cost: z.number(),
    logistics: z.number(),
    buildTime: z.number(),
  }),
  criteriaScores: z.object({
    zoning: z.object({
      score: z.number().min(1).max(5),
      justification: z.string(),
      details: z.string(),
    }),
    massing: z.object({
      score: z.number().min(1).max(5),
      justification: z.string(),
      details: z.string(),
    }),
    sustainability: z.object({
      score: z.number().min(1).max(5),
      justification: z.string(),
      details: z.string(),
    }),
    cost: z.object({
      score: z.number().min(1).max(5),
      justification: z.string(),
      details: z.string(),
    }),
    logistics: z.object({
      score: z.number().min(1).max(5),
      justification: z.string(),
      details: z.string(),
    }),
    buildTime: z.object({
      score: z.number().min(1).max(5),
      justification: z.string(),
      details: z.string(),
    }),
  }),
});

export const masterFormatCategorySchema = z.object({
  category: z.string(),
  categoryCode: z.string(),
  siteBuiltCost: z.number(),
  modularGcCost: z.number(),
  modularFabCost: z.number(),
  modularTotalCost: z.number(),
  modularCostPerSf: z.number(),
});

// Type exports for structured data
export type BuildingConfiguration = z.infer<typeof buildingConfigurationSchema>;
export type FeasibilityAssessment = z.infer<typeof feasibilityAssessmentSchema>;
export type MasterFormatCategory = z.infer<typeof masterFormatCategorySchema>;

// Partners table for FabAssure marketplace
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  partnerType: varchar("partner_type").notNull(), // "fabricator", "gc", "aor", "consultant", "transportation", "engineering", "implementation"
  location: varchar("location").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  yearEstablished: integer("year_established"),
  buildingTypeFocus: varchar("building_type_focus"), // "multifamily", "commercial", "mixed-use", "all"
  capacity: text("capacity"), // Description of capacity/capabilities
  certifications: text("certifications"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  website: varchar("website"),
  description: text("description"),
  specialties: text("specialties"),
  avgProjectSize: varchar("avg_project_size"), // "small", "medium", "large", "all"
  rating: decimal("rating", { precision: 3, scale: 2 }), // 1.00 to 5.00
  totalProjects: integer("total_projects"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partner evaluations for projects
export const partnerEvaluations = pgTable("partner_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  partnerId: varchar("partner_id").references(() => partners.id).notNull(),
  evaluationType: varchar("evaluation_type").notNull(), // "cost", "design", "quality", "reliability"
  score: decimal("score", { precision: 3, scale: 1 }), // 1.0 to 10.0
  notes: text("notes"),
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
});

// Contract terms for selected partners
export const partnerContracts = pgTable("partner_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  partnerId: varchar("partner_id").references(() => partners.id).notNull(),
  contractType: varchar("contract_type").notNull(), // "fabrication", "gc", "design", "consulting"
  contractValue: decimal("contract_value", { precision: 12, scale: 2 }),
  paymentTerms: text("payment_terms"),
  deliverySchedule: text("delivery_schedule"),
  qualityRequirements: text("quality_requirements"),
  penaltyClauses: text("penalty_clauses"),
  warrantyTerms: text("warranty_terms"),
  contractStatus: varchar("contract_status").default("draft"), // "draft", "negotiating", "signed", "completed"
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;
export type PartnerEvaluation = typeof partnerEvaluations.$inferSelect;
export type InsertPartnerEvaluation = typeof partnerEvaluations.$inferInsert;
export type PartnerContract = typeof partnerContracts.$inferSelect;
export type InsertPartnerContract = typeof partnerContracts.$inferInsert;

// Design documents table for EasyDesign application
export const designDocuments = pgTable("design_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  documentType: varchar("document_type").notNull(), // "room_design", "door_schedule", "hardware_schedule", "mep_detail", "structural_detail", "revit_library", "pdf_draft", "shop_drawing"
  documentCategory: varchar("document_category").notNull(), // "unit_design", "building_design", "factory_permit", "ahj_permit"
  title: varchar("title").notNull(),
  description: text("description"),
  filePath: varchar("file_path"), // Object storage path
  fileType: varchar("file_type"), // "pdf", "dwg", "rvt", "xlsx", "jpg", "png"
  fileSize: integer("file_size"), // Size in bytes
  stakeholder: varchar("stakeholder"), // "aor", "fabricator", "gc", "trades", "owner"
  status: varchar("status").default("draft"), // "draft", "review", "approved", "final"
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Material and finish specifications
export const materialSpecifications = pgTable("material_specifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  roomType: varchar("room_type").notNull(), // "living", "bedroom", "bathroom", "kitchen", "hallway", "exterior"
  unitType: varchar("unit_type"), // "studio", "1bed", "2bed", "3bed" or null for common areas
  materialCategory: varchar("material_category").notNull(), // "flooring", "wall_finish", "ceiling", "trim", "fixtures", "appliances"
  materialName: varchar("material_name").notNull(),
  manufacturer: varchar("manufacturer"),
  modelNumber: varchar("model_number"),
  color: varchar("color"),
  finish: varchar("finish"),
  specifications: text("specifications"),
  costPerUnit: decimal("cost_per_unit", { precision: 8, scale: 2 }),
  unitOfMeasure: varchar("unit_of_measure"), // "sqft", "lnft", "each"
  productSheetPath: varchar("product_sheet_path"), // Object storage path to product sheet
  installationNotes: text("installation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Door and hardware schedules
export const doorSchedule = pgTable("door_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  doorNumber: varchar("door_number").notNull(), // "D01", "D02", etc.
  unitType: varchar("unit_type"), // "studio", "1bed", "2bed", "3bed" or null for common
  location: varchar("location").notNull(), // "unit_entry", "bedroom", "bathroom", "closet", "mechanical"
  doorType: varchar("door_type").notNull(), // "hinged", "sliding", "bifold", "pocket"
  width: decimal("width", { precision: 5, scale: 2 }), // In inches
  height: decimal("height", { precision: 5, scale: 2 }), // In inches
  material: varchar("material"), // "solid_core", "hollow_core", "glass", "metal"
  finish: varchar("finish"),
  fireRating: varchar("fire_rating"), // "0", "20", "45", "60", "90"
  hardwareSet: varchar("hardware_set"), // Reference to hardware specification
  locksetType: varchar("lockset_type"), // "passage", "privacy", "entry", "dummy"
  hingetype: varchar("hinge_type"),
  threshold: varchar("threshold"),
  weatherstrip: boolean("weatherstrip").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Design workflows and tasks
export const designWorkflows = pgTable("design_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  workflowType: varchar("workflow_type").notNull(), // "aor_handoff", "fabricator_coordination", "gc_trades_coordination"
  taskName: varchar("task_name").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to"), // Stakeholder responsible
  dueDate: timestamp("due_date"),
  status: varchar("status").default("pending"), // "pending", "in_progress", "completed", "blocked"
  priority: varchar("priority").default("medium"), // "low", "medium", "high", "critical"
  deliverables: text("deliverables"), // JSON array of deliverable items
  completionNotes: text("completion_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MEP and structural details
export const engineeringDetails = pgTable("engineering_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  system: varchar("system").notNull(), // "mechanical", "electrical", "plumbing", "structural"
  detailType: varchar("detail_type").notNull(), // "connection", "layout", "schedule", "specification"
  title: varchar("title").notNull(),
  description: text("description"),
  drawingNumber: varchar("drawing_number"),
  specification: text("specification"),
  designLoadNotes: text("design_load_notes"),
  installationNotes: text("installation_notes"),
  inspectionRequirements: text("inspection_requirements"),
  codeReferences: text("code_references"),
  detailDrawingPath: varchar("detail_drawing_path"), // Object storage path
  calculationPath: varchar("calculation_path"), // Object storage path for engineering calcs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DesignDocument = typeof designDocuments.$inferSelect;
export type InsertDesignDocument = typeof designDocuments.$inferInsert;
export type MaterialSpecification = typeof materialSpecifications.$inferSelect;
export type InsertMaterialSpecification = typeof materialSpecifications.$inferInsert;
export type DoorScheduleItem = typeof doorSchedule.$inferSelect;
export type InsertDoorScheduleItem = typeof doorSchedule.$inferInsert;
export type DesignWorkflow = typeof designWorkflows.$inferSelect;
export type InsertDesignWorkflow = typeof designWorkflows.$inferInsert;
export type EngineeringDetail = typeof engineeringDetails.$inferSelect;
export type InsertEngineeringDetail = typeof engineeringDetails.$inferInsert;

