import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { analyzeZoning, generateChatResponse } from "./services/openaiService";
import { insertZoningAnalysisSchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Zoning analysis endpoint
  app.post("/api/zoning/analyze", isAuthenticated, async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }

      const user = req.user as any;
      const userId = user.claims?.sub;

      // Analyze zoning with AI
      const analysisResult = await analyzeZoning({ address });

      // Create zoning analysis record
      const analysisData = {
        userId,
        address,
        zoneClassification: analysisResult.zoneClassification,
        maxHeight: analysisResult.maxHeight,
        setbacks: analysisResult.setbacks,
        score: analysisResult.score,
        analysisData: analysisResult,
      };

      const validatedData = insertZoningAnalysisSchema.parse(analysisData);
      const analysis = await storage.createZoningAnalysis(validatedData);

      // Create initial AI message
      const initialMessage = {
        analysisId: analysis.id,
        role: "assistant" as const,
        content: analysisResult.summary,
      };

      const validatedMessage = insertChatMessageSchema.parse(initialMessage);
      await storage.createChatMessage(validatedMessage);

      res.json({ 
        analysisId: analysis.id,
        ...analysisResult 
      });
    } catch (error) {
      console.error("Error analyzing zoning:", error);
      res.status(500).json({ message: "Failed to analyze zoning" });
    }
  });

  // Get zoning analysis
  app.get("/api/zoning/analysis/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getZoningAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Get chat messages for analysis
  app.get("/api/chat/:analysisId", isAuthenticated, async (req, res) => {
    try {
      const { analysisId } = req.params;
      const messages = await storage.getChatMessages(analysisId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send chat message
  app.post("/api/chat/send", isAuthenticated, async (req, res) => {
    try {
      const { analysisId, message } = req.body;

      if (!analysisId || !message) {
        return res.status(400).json({ message: "Analysis ID and message are required" });
      }

      // Get analysis context
      const analysis = await storage.getZoningAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Save user message
      const userMessage = {
        analysisId,
        role: "user" as const,
        content: message,
      };

      const validatedUserMessage = insertChatMessageSchema.parse(userMessage);
      await storage.createChatMessage(validatedUserMessage);

      // Generate AI response
      const aiResponse = await generateChatResponse(message, analysis.analysisData);

      // Save AI message
      const aiMessage = {
        analysisId,
        role: "assistant" as const,
        content: aiResponse,
      };

      const validatedAiMessage = insertChatMessageSchema.parse(aiMessage);
      const savedAiMessage = await storage.createChatMessage(validatedAiMessage);

      res.json(savedAiMessage);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
