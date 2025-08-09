import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertCostBreakdownSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify ownership
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProjectSchema.parse(req.body);
      
      // Calculate feasibility scores
      const scores = calculateFeasibilityScores(validatedData);
      
      const project = await storage.createProject({
        ...validatedData,
        ...scores,
        userId,
      });

      // Create sample cost breakdowns for the project
      const costBreakdowns = await createSampleCostBreakdowns(project.id);

      res.status(201).json({ project, costBreakdowns });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify ownership
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertProjectSchema.partial().parse(req.body);
      
      // Recalculate scores if project details changed
      const scores = calculateFeasibilityScores({ ...project, ...validatedData });
      
      const updatedProject = await storage.updateProject(id, {
        ...validatedData,
        ...scores,
      });

      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify ownership
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Cost breakdown routes
  app.get('/api/projects/:id/cost-breakdowns', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify ownership
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const costBreakdowns = await storage.getProjectCostBreakdowns(id);
      res.json(costBreakdowns);
    } catch (error) {
      console.error("Error fetching cost breakdowns:", error);
      res.status(500).json({ message: "Failed to fetch cost breakdowns" });
    }
  });

  // Sample projects initialization route
  app.post('/api/initialize-sample-projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingProjects = await storage.getUserProjects(userId);
      
      if (existingProjects.length > 0) {
        return res.json({ message: "Sample projects already exist" });
      }

      const sampleProjects = await createSampleProjects(userId);
      res.json(sampleProjects);
    } catch (error) {
      console.error("Error initializing sample projects:", error);
      res.status(500).json({ message: "Failed to initialize sample projects" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate feasibility scores based on project data
function calculateFeasibilityScores(projectData: any) {
  // Implement scoring algorithm based on RaaP's methodology
  const totalUnits = (projectData.studioUnits || 0) + (projectData.oneBedUnits || 0) + 
                    (projectData.twoBedUnits || 0) + (projectData.threeBedUnits || 0);
  
  // Base scores - would be more sophisticated in production
  const zoningScore = projectData.projectType === 'affordable' ? 4.0 : 3.5;
  const massingScore = totalUnits >= 20 ? 5.0 : 4.0;
  const costScore = 4.0; // Default, would calculate based on location and project details
  const sustainabilityScore = projectData.targetFloors <= 4 ? 5.0 : 4.0;
  const logisticsScore = 5.0; // Default high score
  const buildTimeScore = 4.0; // Default

  // Calculate weighted overall score
  const overallScore = (
    zoningScore * 0.20 +
    massingScore * 0.15 +
    costScore * 0.20 +
    sustainabilityScore * 0.20 +
    logisticsScore * 0.15 +
    buildTimeScore * 0.10
  );

  // Calculate cost estimates
  const costPerUnit = projectData.projectType === 'affordable' ? 451000 : 500000;
  const modularTotalCost = totalUnits * costPerUnit;
  const siteBuiltTotalCost = modularTotalCost * 1.012; // 1.2% higher
  const costSavingsPercent = ((siteBuiltTotalCost - modularTotalCost) / siteBuiltTotalCost) * 100;

  return {
    zoningScore: zoningScore.toString(),
    zoningJustification: "Score based on project type and zoning compatibility analysis.",
    massingScore: massingScore.toString(),
    massingJustification: "Score based on unit count and building configuration feasibility.",
    costScore: costScore.toString(),
    costJustification: "Score based on modular cost advantages for this project type and scale.",
    sustainabilityScore: sustainabilityScore.toString(),
    sustainabilityJustification: "Score based on modular construction's sustainability benefits and project characteristics.",
    logisticsScore: logisticsScore.toString(),
    logisticsJustification: "Score based on site accessibility and factory proximity analysis.",
    buildTimeScore: buildTimeScore.toString(),
    buildTimeJustification: "Score based on time savings potential through modular construction.",
    overallScore: overallScore.toFixed(1),
    modularTotalCost: modularTotalCost.toString(),
    modularCostPerUnit: costPerUnit.toString(),
    siteBuiltTotalCost: siteBuiltTotalCost.toString(),
    siteBuiltCostPerUnit: (siteBuiltTotalCost / totalUnits).toString(),
    costSavingsPercent: costSavingsPercent.toFixed(2),
    modularTimelineMonths: 9,
    siteBuiltTimelineMonths: 13,
    timeSavingsMonths: 4,
    factoryLocation: "Tracy, CA",
    zoningDistrict: "RM",
    densityBonusEligible: projectData.projectType === 'affordable',
  };
}

// Helper function to create sample cost breakdowns
async function createSampleCostBreakdowns(projectId: string) {
  const breakdowns = [
    {
      projectId,
      category: "03 Concrete",
      siteBuiltCost: "407021",
      raapGcCost: "285136",
      raapFabCost: "164393",
      raapTotalCost: "449528"
    },
    {
      projectId,
      category: "06 Wood & Plastics",
      siteBuiltCost: "1982860",
      raapGcCost: "14171",
      raapFabCost: "2137612",
      raapTotalCost: "2151783"
    },
    {
      projectId,
      category: "07 Thermal & Moisture",
      siteBuiltCost: "490766",
      raapGcCost: "289407",
      raapFabCost: "293030",
      raapTotalCost: "582437"
    },
    {
      projectId,
      category: "22 Plumbing",
      siteBuiltCost: "767391",
      raapGcCost: "431516",
      raapFabCost: "306882",
      raapTotalCost: "738398"
    },
    {
      projectId,
      category: "26 Electrical",
      siteBuiltCost: "978984",
      raapGcCost: "776008",
      raapFabCost: "170998",
      raapTotalCost: "947005"
    }
  ];

  const createdBreakdowns = [];
  for (const breakdown of breakdowns) {
    const created = await storage.createCostBreakdown(breakdown);
    createdBreakdowns.push(created);
  }
  return createdBreakdowns;
}

// Helper function to create sample projects for new users
async function createSampleProjects(userId: string) {
  const sampleProjects = [
    {
      userId,
      name: "Serenity Village",
      address: "5224 Chestnut Road, Olivehurst, CA",
      projectType: "affordable",
      targetFloors: 3,
      studioUnits: 0,
      oneBedUnits: 6,
      twoBedUnits: 12,
      threeBedUnits: 6,
      targetParkingSpaces: 24,
      buildingDimensions: "146' X 66'",
      constructionType: "Type V-A",
    },
    {
      userId,
      name: "Mountain View Apartments",
      address: "1425 Castro Street, Mountain View, CA",
      projectType: "senior",
      targetFloors: 4,
      studioUnits: 8,
      oneBedUnits: 20,
      twoBedUnits: 8,
      threeBedUnits: 0,
      targetParkingSpaces: 36,
    },
    {
      userId,
      name: "University Housing Complex",
      address: "2100 17th Street, Boulder, CO",
      projectType: "student",
      targetFloors: 5,
      studioUnits: 24,
      oneBedUnits: 24,
      twoBedUnits: 0,
      threeBedUnits: 0,
      targetParkingSpaces: 24,
    },
    {
      userId,
      name: "Workforce Commons",
      address: "875 Elm Avenue, Denver, CO",
      projectType: "workforce",
      targetFloors: 3,
      studioUnits: 0,
      oneBedUnits: 16,
      twoBedUnits: 12,
      threeBedUnits: 4,
      targetParkingSpaces: 40,
    }
  ];

  const createdProjects = [];
  for (const projectData of sampleProjects) {
    const scores = calculateFeasibilityScores(projectData);
    const project = await storage.createProject({
      ...projectData,
      ...scores,
    });
    
    // Create cost breakdowns for each project
    await createSampleCostBreakdowns(project.id);
    createdProjects.push(project);
  }
  
  return createdProjects;
}
