import { 
  type User, 
  type InsertUser, 
  type ZoningAnalysis,
  type InsertZoningAnalysis,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser & { id: string }): Promise<User>;
  createZoningAnalysis(analysis: InsertZoningAnalysis): Promise<ZoningAnalysis>;
  getZoningAnalysis(id: string): Promise<ZoningAnalysis | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(analysisId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private zoningAnalyses: Map<string, ZoningAnalysis>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.zoningAnalyses = new Map();
    this.chatMessages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(userData: InsertUser & { id: string }): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        ...userData,
        createdAt: new Date()
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  async createZoningAnalysis(insertAnalysis: InsertZoningAnalysis): Promise<ZoningAnalysis> {
    const id = randomUUID();
    const analysis: ZoningAnalysis = {
      ...insertAnalysis,
      id,
      createdAt: new Date()
    };
    this.zoningAnalyses.set(id, analysis);
    return analysis;
  }

  async getZoningAnalysis(id: string): Promise<ZoningAnalysis | undefined> {
    return this.zoningAnalyses.get(id);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.analysisId === analysisId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
}

export const storage = new MemStorage();
