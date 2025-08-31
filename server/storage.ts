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
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Cost breakdown operations
  async getProjectCostBreakdowns(projectId: string): Promise<CostBreakdown[]> {
    return await db
      .select()
      .from(costBreakdowns)
      .where(eq(costBreakdowns.projectId, projectId));
  }

  async createCostBreakdown(breakdown: InsertCostBreakdown): Promise<CostBreakdown> {
    const [newBreakdown] = await db
      .insert(costBreakdowns)
      .values(breakdown)
      .returning();
    return newBreakdown;
  }

  async updateCostBreakdown(id: string, breakdown: Partial<InsertCostBreakdown>): Promise<CostBreakdown> {
    const [updatedBreakdown] = await db
      .update(costBreakdowns)
      .set(breakdown)
      .where(eq(costBreakdowns.id, id))
      .returning();
    return updatedBreakdown;
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
