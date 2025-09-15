import { pgTable, varchar, text, integer, decimal, boolean, timestamp, jsonb, index, sql } from "drizzle-orm/pg-core";
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

// Unified Projects table - Single source of truth for all project data
export const projects = pgTable("projects", {
  // Core Project Information
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectName: varchar("project_name").notNull(),
  siteAddress: text("site_address").notNull(),
  projectType: varchar("project_type").notNull(), // affordable, market_rate, senior, workforce
  
  // Building Configuration (structured JSON)
  buildingConfiguration: jsonb("building_configuration").$type<{
    floors: number;
    buildingDimensions: string;
    constructionType: string;
    totalUnits: number; // calculated field
    unitMix: {
      studio: number;
      oneBedroom: number;
      twoBedroom: number;
      threeBedroom: number;
    };
    parking: {
      targetSpaces: number;
      parkingType: 'surface' | 'garage' | 'mixed';
    };
    buildingSpecs: {
      grossSquareFootage: number;
      unitAverageSize: number;
      commonAreaSize: number;
    };
  }>(),
  
  // Feasibility Assessment (structured JSON with all scoring details)
  feasibilityAssessment: jsonb("feasibility_assessment").$type<{
    overallScore: number;
    scoringWeights: {
      zoning: number;
      massing: number;
      sustainability: number;
      cost: number;
      logistics: number;
      buildTime: number;
    };
    criteriaScores: {
      zoning: {
        score: number;
        justification: string;
        details: string;
      };
      massing: {
        score: number;
        justification: string;
        details: string;
      };
      sustainability: {
        score: number;
        justification: string;
        details: string;
      };
      cost: {
        score: number;
        justification: string;
        details: string;
      };
      logistics: {
        score: number;
        justification: string;
        details: string;
      };
      buildTime: {
        score: number;
        justification: string;
        details: string;
      };
    };
  }>(),
  
  // Comprehensive Cost Analysis (structured JSON)
  costAnalysis: jsonb("cost_analysis").$type<{
    modularConstruction: {
      totalProjectCost: number;
      costPerSquareFoot: number;
      costPerUnit: number;
      designPhaseMonths: number;
      fabricationMonths: number;
      siteWorkMonths: number;
      totalTimelineMonths: number;
    };
    siteBuiltConstruction: {
      totalProjectCost: number;
      costPerSquareFoot: number;
      costPerUnit: number;
      designPhaseMonths: number;
      constructionMonths: number;
      totalTimelineMonths: number;
    };
    comparison: {
      costSavingsAmount: number;
      costSavingsPercent: number;
      timeSavingsMonths: number;
      timeSavingsPercent: number;
    };
    masterFormatBreakdown: {
      generalRequirements: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      siteConstruction: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      concrete: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      masonry: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      metals: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      woodPlastics: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      thermalMoisture: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      openings: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      finishes: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      specialties: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      equipment: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      furnishings: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      specialConstruction: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      conveyingSystems: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      fireSuppressionSystems: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      plumbing: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      hvac: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      electrical: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      communications: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      electronicSafety: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      earthwork: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      exteriorImprovements: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      utilities: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      transportation: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      waterResources: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
      fees: {
        siteBuiltCost: number;
        modularGcCost: number;
        modularFabCost: number;
        modularTotalCost: number;
        modularCostPerSf: number;
      };
    };
    pricingValidation: {
      isComplete: boolean;
      validatedBy: string;
      validatedAt: Date;
      notes: string;
    };
  }>(),
  
  // Zoning & Regulatory Information (structured JSON)
  zoningRegulatory: jsonb("zoning_regulatory").$type<{
    district: string;
    districtDescription: string;
    densityBonusEligible: boolean;
    requiredWaivers: string[];
    entitlementStatus: 'planning' | 'submitted' | 'approved' | 'denied';
    permitStatus: 'not_started' | 'submitted' | 'under_review' | 'approved' | 'denied';
    approvalConditions: string[];
    timelineEstimateMonths: number;
    regulatoryNotes: string;
  }>(),
  
  // Logistics & Transportation (structured JSON)
  logisticsTransportation: jsonb("logistics_transportation").$type<{
    factoryLocation: {
      name: string;
      address: string;
      city: string;
      state: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
    transportation: {
      routeDistance: number;
      routeDurationHours: number;
      transportationMethod: string;
      specialRequirements: string[];
      routeNotes: string;
    };
    siteLogistics: {
      stagingAreaLocation: string;
      siteAccessNotes: string;
      deliverySchedule: string;
      craneRequirements: string;
      utilitiesAccess: string;
    };
    logisticsScore: {
      accessibilityScore: number;
      distanceScore: number;
      siteConditionsScore: number;
      overallScore: number;
    };
  }>(),
  
  // Partner Information (structured JSON)
  projectPartners: jsonb("project_partners").$type<{
    fabricators: Array<{
      partnerId: string;
      name: string;
      pricing: number;
      timeline: string;
      isSelected: boolean;
      evaluationScore: number;
      contractStatus: 'pending' | 'negotiating' | 'signed';
    }>;
    generalContractors: Array<{
      partnerId: string;
      name: string;
      pricing: number;
      timeline: string;
      isSelected: boolean;
      evaluationScore: number;
      contractStatus: 'pending' | 'negotiating' | 'signed';
    }>;
    architectOfRecord: {
      partnerId: string;
      name: string;
      contactInfo: {
        email: string;
        phone: string;
        primaryContact: string;
      };
      collaborationStatus: 'pending' | 'active' | 'complete';
      reviewStatus: 'pending' | 'reviewing' | 'approved' | 'revisions_requested';
      feedback: string;
    };
    finalSelections: {
      selectedFabricator: string;
      selectedGeneralContractor: string;
      finalFabricatorCost: number;
      finalGcCost: number;
      contractsFinalized: boolean;
    };
  }>(),
  
  // Workflow Progress (structured JSON)
  workflowProgress: jsonb("workflow_progress").$type<{
    currentPhase: 'feasibility' | 'smart_start' | 'fab_assure' | 'easy_design' | 'complete';
    completionStatus: {
      modularFeasibilityComplete: boolean;
      smartStartComplete: boolean;
      fabAssureComplete: boolean;
      easyDesignComplete: boolean;
    };
    phaseDetails: {
      feasibility: {
        assessmentComplete: boolean;
        reportGenerated: boolean;
        completedAt: Date | null;
      };
      smartStart: {
        entitlementPackageStatus: 'planning' | 'in_progress' | 'submitted' | 'approved';
        designHandoffComplete: boolean;
        pricingValidationComplete: boolean;
        completedAt: Date | null;
      };
      fabAssure: {
        factorySchedulingComplete: boolean;
        qualityAssurancePlanApproved: boolean;
        fabricationStartDate: Date | null;
        completedAt: Date | null;
      };
      easyDesign: {
        architecturalPlansFinalized: boolean;
        interiorDesignComplete: boolean;
        materialSelectionsFinalized: boolean;
        finalDesignApproval: boolean;
        completedAt: Date | null;
      };
    };
  }>(),
  
  // Design & Documentation (structured JSON)
  designDocumentation: jsonb("design_documentation").$type<{
    buildingDesign: {
      layoutComplete: boolean;
      renderingsComplete: boolean;
      renderingUrls: string[];
      layoutData: any; // JSON data for building layout
    };
    unitDesigns: {
      designsComplete: boolean;
      unitLayouts: {
        studio: any;
        oneBedroom: any;
        twoBedroom: any;
        threeBedroom: any;
      };
    };
    materialSpecifications: Array<{
      roomType: string;
      unitType: string;
      materialCategory: string;
      materialName: string;
      manufacturer: string;
      modelNumber: string;
      color: string;
      finish: string;
      costPerUnit: number;
      unitOfMeasure: string;
    }>;
    doorSchedule: Array<{
      doorNumber: string;
      unitType: string;
      location: string;
      doorType: string;
      width: number;
      height: number;
      material: string;
      finish: string;
      fireRating: string;
      hardwareSet: string;
    }>;
    systemsDesign: {
      mepDesignComplete: boolean;
      structuralDesignComplete: boolean;
      systemsIntegrationComplete: boolean;
    };
  }>(),
  
  // Quality Assurance & Manufacturing (structured JSON)
  qualityManufacturing: jsonb("quality_manufacturing").$type<{
    fabricationPlan: {
      factoryPartner: string;
      fabricationStartDate: Date | null;
      estimatedCompletionDate: Date | null;
      fabricationTimeline: string;
    };
    qualityAssurance: {
      qaPlanbookSummary: string;
      qualityCheckpoints: Array<{
        checkpoint: string;
        scheduledDate: Date;
        status: 'pending' | 'passed' | 'failed';
        notes: string;
      }>;
      factoryInspectionScheduled: boolean;
      inspectionDate: Date | null;
    };
    shipping: {
      shippingPlan: string;
      deliverySchedule: string;
      transportationCoordination: string;
    };
  }>(),
  
  // Project Metadata
  projectMetadata: jsonb("project_metadata").$type<{
    isTemplate: boolean; // for sample projects
    templateCategory: string; // for organizing sample projects
    lastModifiedSection: string;
    dataVersion: string; // for schema versioning
    customFields: Record<string, any>; // for extensibility
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep existing tables for partner management
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  partnerType: varchar("partner_type").notNull(),
  location: varchar("location").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  yearEstablished: integer("year_established"),
  buildingTypeFocus: varchar("building_type_focus"),
  capacity: text("capacity"),
  certifications: text("certifications"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  website: varchar("website"),
  description: text("description"),
  specialties: text("specialties"),
  avgProjectSize: varchar("avg_project_size"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalProjects: integer("total_projects"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

// Schema validation
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Helper schemas for structured data validation
export const buildingConfigurationSchema = z.object({
  floors: z.number().min(1),
  buildingDimensions: z.string(),
  constructionType: z.string(),
  totalUnits: z.number().min(1),
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
  overallScore: z.number().min(1).max(5),
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

export type BuildingConfiguration = z.infer<typeof buildingConfigurationSchema>;
export type FeasibilityAssessment = z.infer<typeof feasibilityAssessmentSchema>;