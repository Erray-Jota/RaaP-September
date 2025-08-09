import {
  users,
  projects,
  costBreakdowns,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type CostBreakdown,
  type InsertCostBreakdown,
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
}

export const storage = new DatabaseStorage();
