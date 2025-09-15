import {
  users,
  projects,
  costBreakdowns,
  partners,
  partnerEvaluations,
  partnerContracts,
  designDocuments,
  materialSpecifications,
  doorSchedule,
  designWorkflows,
  engineeringDetails,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type CostBreakdown,
  type InsertCostBreakdown,
  type Partner,
  type InsertPartner,
  type PartnerEvaluation,
  type InsertPartnerEvaluation,
  type PartnerContract,
  type InsertPartnerContract,
  type DesignDocument,
  type InsertDesignDocument,
  type MaterialSpecification,
  type InsertMaterialSpecification,
  type DoorScheduleItem,
  type InsertDoorScheduleItem,
  type DesignWorkflow,
  type InsertDesignWorkflow,
  type EngineeringDetail,
  type InsertEngineeringDetail,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getUserProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject & { userId: string }): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Cost breakdown operations
  getProjectCostBreakdowns(projectId: string): Promise<CostBreakdown[]>;
  createCostBreakdown(breakdown: InsertCostBreakdown): Promise<CostBreakdown>;
  updateCostBreakdown(id: string, breakdown: Partial<InsertCostBreakdown>): Promise<CostBreakdown>;
  
  // Partner operations
  getAllPartners(): Promise<Partner[]>;
  getPartnersByType(type: string): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  getPartnerEvaluations(projectId: string): Promise<PartnerEvaluation[]>;
  createPartnerEvaluation(evaluation: InsertPartnerEvaluation): Promise<PartnerEvaluation>;
  getPartnerContracts(projectId: string): Promise<PartnerContract[]>;
  createPartnerContract(contract: InsertPartnerContract): Promise<PartnerContract>;
  
  // EasyDesign operations
  getDesignDocuments(projectId: string): Promise<DesignDocument[]>;
  createDesignDocument(document: InsertDesignDocument): Promise<DesignDocument>;
  getMaterialSpecifications(projectId: string): Promise<MaterialSpecification[]>;
  createMaterialSpecification(spec: InsertMaterialSpecification): Promise<MaterialSpecification>;
  getDoorSchedule(projectId: string): Promise<DoorScheduleItem[]>;
  createDoorScheduleItem(item: InsertDoorScheduleItem): Promise<DoorScheduleItem>;
  getDesignWorkflows(projectId: string): Promise<DesignWorkflow[]>;
  createDesignWorkflow(workflow: InsertDesignWorkflow): Promise<DesignWorkflow>;
  getEngineeringDetails(projectId: string): Promise<EngineeringDetail[]>;
  createEngineeringDetail(detail: InsertEngineeringDetail): Promise<EngineeringDetail>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject & { userId: string }): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    // Delete related records first due to foreign key constraints
    await db.delete(costBreakdowns).where(eq(costBreakdowns.projectId, id));
    // Then delete the project
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Cost breakdown operations - Now reads from unified JSON structure
  async getProjectCostBreakdowns(projectId: string): Promise<CostBreakdown[]> {
    // Get project with costAnalysis data
    const [project] = await db
      .select({ costAnalysis: projects.costAnalysis })
      .from(projects)
      .where(eq(projects.id, projectId));
    
    if (!project?.costAnalysis?.masterFormatBreakdown) {
      // Fallback to legacy costBreakdowns table for backward compatibility
      return await db
        .select()
        .from(costBreakdowns)
        .where(eq(costBreakdowns.projectId, projectId));
    }
    
    // Transform unified data back to legacy CostBreakdown format for API compatibility
    return project.costAnalysis.masterFormatBreakdown.map((item, index) => ({
      id: `${projectId}::${index}`, // Use :: delimiter to avoid UUID conflicts
      projectId,
      category: item.category,
      siteBuiltCost: item.siteBuiltCost?.toString() || null,
      raapGcCost: item.modularGcCost?.toString() || null, 
      raapFabCost: item.modularFabCost?.toString() || null,
      raapTotalCost: item.modularTotalCost?.toString() || null
    }));
  }

  async createCostBreakdown(breakdown: InsertCostBreakdown): Promise<CostBreakdown> {
    // Get current project costAnalysis
    const [project] = await db
      .select({ costAnalysis: projects.costAnalysis })
      .from(projects)
      .where(eq(projects.id, breakdown.projectId));
    
    // Initialize costAnalysis if it doesn't exist
    const currentCostAnalysis = project?.costAnalysis || {
      masterFormatBreakdown: [],
      detailedMetrics: {
        modularConstruction: { designPhaseMonths: 0, fabricationMonths: 0, siteWorkMonths: 0 },
        siteBuiltConstruction: { designPhaseMonths: 0, constructionMonths: 0 },
        comparison: { costSavingsAmount: 0, timeSavingsMonths: 0, timeSavingsPercent: 0 }
      },
      pricingValidation: { isComplete: false, validatedBy: "", validatedAt: "", notes: "" }
    };
    
    // Add new breakdown to masterFormatBreakdown array
    const newBreakdownItem = {
      category: breakdown.category,
      categoryCode: breakdown.category.split(' - ')[0] || breakdown.category,
      siteBuiltCost: parseFloat(breakdown.siteBuiltCost || "0"),
      modularGcCost: parseFloat(breakdown.raapGcCost || "0"),
      modularFabCost: parseFloat(breakdown.raapFabCost || "0"),
      modularTotalCost: parseFloat(breakdown.raapTotalCost || "0"),
      modularCostPerSf: 0
    };
    
    currentCostAnalysis.masterFormatBreakdown.push(newBreakdownItem);
    
    // Update project with new costAnalysis
    await db
      .update(projects)
      .set({ costAnalysis: currentCostAnalysis })
      .where(eq(projects.id, breakdown.projectId));
    
    // Return in legacy format for API compatibility
    return {
      id: `${breakdown.projectId}::${currentCostAnalysis.masterFormatBreakdown.length - 1}`,
      projectId: breakdown.projectId,
      category: breakdown.category,
      siteBuiltCost: breakdown.siteBuiltCost || null,
      raapGcCost: breakdown.raapGcCost || null,
      raapFabCost: breakdown.raapFabCost || null,
      raapTotalCost: breakdown.raapTotalCost || null
    };
  }

  async updateCostBreakdown(id: string, breakdown: Partial<InsertCostBreakdown>): Promise<CostBreakdown> {
    // Extract projectId and index from composite ID (format: projectId::index)
    const lastDelimiter = id.lastIndexOf('::');
    if (lastDelimiter === -1) {
      throw new Error(`Invalid cost breakdown ID format: ${id}. Expected format: projectId::index`);
    }
    
    const projectId = id.substring(0, lastDelimiter);
    const indexStr = id.substring(lastDelimiter + 2);
    const index = parseInt(indexStr);
    
    if (!projectId || isNaN(index)) {
      throw new Error(`Invalid cost breakdown ID format: ${id}. ProjectId: '${projectId}', Index: '${indexStr}'`);
    }
    
    // Get current project costAnalysis
    const [project] = await db
      .select({ costAnalysis: projects.costAnalysis })
      .from(projects)
      .where(eq(projects.id, projectId));
    
    if (!project?.costAnalysis?.masterFormatBreakdown?.[index]) {
      throw new Error(`Cost breakdown not found at index ${index} for project ${projectId}`);
    }
    
    // Update the specific breakdown item
    const updatedBreakdown = {
      ...project.costAnalysis.masterFormatBreakdown[index],
      ...(breakdown.category && { category: breakdown.category }),
      ...(breakdown.category && { categoryCode: breakdown.category.split(' - ')[0] || breakdown.category }),
      ...(breakdown.siteBuiltCost && { siteBuiltCost: parseFloat(breakdown.siteBuiltCost) }),
      ...(breakdown.raapGcCost && { modularGcCost: parseFloat(breakdown.raapGcCost) }),
      ...(breakdown.raapFabCost && { modularFabCost: parseFloat(breakdown.raapFabCost) }),
      ...(breakdown.raapTotalCost && { modularTotalCost: parseFloat(breakdown.raapTotalCost) })
    };
    
    // Update the array
    project.costAnalysis.masterFormatBreakdown[index] = updatedBreakdown;
    
    // Save updated costAnalysis back to database
    await db
      .update(projects)
      .set({ costAnalysis: project.costAnalysis })
      .where(eq(projects.id, projectId));
    
    // Return in legacy format for API compatibility
    return {
      id,
      projectId,
      category: updatedBreakdown.category,
      siteBuiltCost: updatedBreakdown.siteBuiltCost?.toString() || null,
      raapGcCost: updatedBreakdown.modularGcCost?.toString() || null,
      raapFabCost: updatedBreakdown.modularFabCost?.toString() || null,
      raapTotalCost: updatedBreakdown.modularTotalCost?.toString() || null
    };
  }

  // Partner operations
  async getAllPartners(): Promise<Partner[]> {
    return await db
      .select()
      .from(partners)
      .where(eq(partners.isActive, true))
      .orderBy(partners.name);
  }

  async getPartnersByType(type: string): Promise<Partner[]> {
    return await db
      .select()
      .from(partners)
      .where(eq(partners.partnerType, type) && eq(partners.isActive, true))
      .orderBy(partners.name);
  }

  async createPartner(partnerData: InsertPartner): Promise<Partner> {
    const [newPartner] = await db
      .insert(partners)
      .values(partnerData)
      .returning();
    return newPartner;
  }

  async getPartnerEvaluations(projectId: string): Promise<PartnerEvaluation[]> {
    return await db
      .select()
      .from(partnerEvaluations)
      .where(eq(partnerEvaluations.projectId, projectId))
      .orderBy(desc(partnerEvaluations.evaluatedAt));
  }

  async createPartnerEvaluation(evaluation: InsertPartnerEvaluation): Promise<PartnerEvaluation> {
    const [newEvaluation] = await db
      .insert(partnerEvaluations)
      .values(evaluation)
      .returning();
    return newEvaluation;
  }

  async getPartnerContracts(projectId: string): Promise<PartnerContract[]> {
    return await db
      .select()
      .from(partnerContracts)
      .where(eq(partnerContracts.projectId, projectId))
      .orderBy(desc(partnerContracts.updatedAt));
  }

  async createPartnerContract(contract: InsertPartnerContract): Promise<PartnerContract> {
    const [newContract] = await db
      .insert(partnerContracts)
      .values(contract)
      .returning();
    return newContract;
  }

  // EasyDesign operations
  async getDesignDocuments(projectId: string): Promise<DesignDocument[]> {
    return await db
      .select()
      .from(designDocuments)
      .where(eq(designDocuments.projectId, projectId))
      .orderBy(desc(designDocuments.createdAt));
  }

  async createDesignDocument(documentData: InsertDesignDocument): Promise<DesignDocument> {
    const [newDocument] = await db
      .insert(designDocuments)
      .values(documentData)
      .returning();
    return newDocument;
  }

  async getMaterialSpecifications(projectId: string): Promise<MaterialSpecification[]> {
    return await db
      .select()
      .from(materialSpecifications)
      .where(eq(materialSpecifications.projectId, projectId))
      .orderBy(materialSpecifications.roomType, materialSpecifications.materialCategory);
  }

  async createMaterialSpecification(specData: InsertMaterialSpecification): Promise<MaterialSpecification> {
    const [newSpec] = await db
      .insert(materialSpecifications)
      .values(specData)
      .returning();
    return newSpec;
  }

  async getDoorSchedule(projectId: string): Promise<DoorScheduleItem[]> {
    return await db
      .select()
      .from(doorSchedule)
      .where(eq(doorSchedule.projectId, projectId))
      .orderBy(doorSchedule.doorNumber);
  }

  async createDoorScheduleItem(itemData: InsertDoorScheduleItem): Promise<DoorScheduleItem> {
    const [newItem] = await db
      .insert(doorSchedule)
      .values(itemData)
      .returning();
    return newItem;
  }

  async getDesignWorkflows(projectId: string): Promise<DesignWorkflow[]> {
    return await db
      .select()
      .from(designWorkflows)
      .where(eq(designWorkflows.projectId, projectId))
      .orderBy(designWorkflows.dueDate, designWorkflows.priority);
  }

  async createDesignWorkflow(workflowData: InsertDesignWorkflow): Promise<DesignWorkflow> {
    const [newWorkflow] = await db
      .insert(designWorkflows)
      .values(workflowData)
      .returning();
    return newWorkflow;
  }

  async getEngineeringDetails(projectId: string): Promise<EngineeringDetail[]> {
    return await db
      .select()
      .from(engineeringDetails)
      .where(eq(engineeringDetails.projectId, projectId))
      .orderBy(engineeringDetails.system, engineeringDetails.detailType);
  }

  async createEngineeringDetail(detailData: InsertEngineeringDetail): Promise<EngineeringDetail> {
    const [newDetail] = await db
      .insert(engineeringDetails)
      .values(detailData)
      .returning();
    return newDetail;
  }
}

export const storage = new DatabaseStorage();
