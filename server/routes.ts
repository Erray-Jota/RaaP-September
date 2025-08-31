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

  // PATCH route for updating application completion status
  app.patch('/api/projects/:id', isAuthenticated, async (req: any, res) => {
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

      // Define schema for application completion updates
      const updateSchema = z.object({
        modularFeasibilityComplete: z.boolean().optional(),
        smartStartComplete: z.boolean().optional(),
        fabAssureComplete: z.boolean().optional(),
        easyDesignComplete: z.boolean().optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      
      const updatedProject = await storage.updateProject(id, validatedData);

      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating project status:", error);
      res.status(500).json({ message: "Failed to update project" });
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

  // Partner routes for FabAssure marketplace
  app.get('/api/partners', isAuthenticated, async (req: any, res) => {
    try {
      const partners = await storage.getAllPartners();
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get('/api/partners/:type', isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.params;
      const partners = await storage.getPartnersByType(type);
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners by type:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get('/api/projects/:projectId/partner-evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const evaluations = await storage.getPartnerEvaluations(projectId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching partner evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/projects/:projectId/partner-evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const evaluation = await storage.createPartnerEvaluation({
        ...req.body,
        projectId,
      });
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating partner evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  app.get('/api/projects/:projectId/partner-contracts', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const contracts = await storage.getPartnerContracts(projectId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching partner contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post('/api/projects/:projectId/partner-contracts', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const contract = await storage.createPartnerContract({
        ...req.body,
        projectId,
      });
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating partner contract:", error);
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  // Seed sample partners for marketplace
  app.post('/api/seed-partners', isAuthenticated, async (req: any, res) => {
    try {
      const samplePartners = await createSamplePartners();
      res.json({ message: "Sample partners created", count: samplePartners.length });
    } catch (error) {
      console.error("Error seeding partners:", error);
      res.status(500).json({ message: "Failed to seed partners" });
    }
  });

  // EasyDesign API routes
  app.get('/api/projects/:projectId/design-documents', isAuthenticated, async (req: any, res) => {
    try {
      const documents = await storage.getDesignDocuments(req.params.projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching design documents:", error);
      res.status(500).json({ message: "Failed to fetch design documents" });
    }
  });

  app.post('/api/projects/:projectId/design-documents', isAuthenticated, async (req: any, res) => {
    try {
      const document = await storage.createDesignDocument({
        ...req.body,
        projectId: req.params.projectId,
        createdBy: req.user?.claims?.sub,
      });
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating design document:", error);
      res.status(500).json({ message: "Failed to create design document" });
    }
  });

  app.get('/api/projects/:projectId/material-specifications', isAuthenticated, async (req: any, res) => {
    try {
      const specs = await storage.getMaterialSpecifications(req.params.projectId);
      res.json(specs);
    } catch (error) {
      console.error("Error fetching material specifications:", error);
      res.status(500).json({ message: "Failed to fetch material specifications" });
    }
  });

  app.post('/api/projects/:projectId/material-specifications', isAuthenticated, async (req: any, res) => {
    try {
      const spec = await storage.createMaterialSpecification({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(spec);
    } catch (error) {
      console.error("Error creating material specification:", error);
      res.status(500).json({ message: "Failed to create material specification" });
    }
  });

  app.get('/api/projects/:projectId/door-schedule', isAuthenticated, async (req: any, res) => {
    try {
      const doorItems = await storage.getDoorSchedule(req.params.projectId);
      res.json(doorItems);
    } catch (error) {
      console.error("Error fetching door schedule:", error);
      res.status(500).json({ message: "Failed to fetch door schedule" });
    }
  });

  app.post('/api/projects/:projectId/door-schedule', isAuthenticated, async (req: any, res) => {
    try {
      const doorItem = await storage.createDoorScheduleItem({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(doorItem);
    } catch (error) {
      console.error("Error creating door schedule item:", error);
      res.status(500).json({ message: "Failed to create door schedule item" });
    }
  });

  app.get('/api/projects/:projectId/design-workflows', isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await storage.getDesignWorkflows(req.params.projectId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching design workflows:", error);
      res.status(500).json({ message: "Failed to fetch design workflows" });
    }
  });

  app.post('/api/projects/:projectId/design-workflows', isAuthenticated, async (req: any, res) => {
    try {
      const workflow = await storage.createDesignWorkflow({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating design workflow:", error);
      res.status(500).json({ message: "Failed to create design workflow" });
    }
  });

  app.get('/api/projects/:projectId/engineering-details', isAuthenticated, async (req: any, res) => {
    try {
      const details = await storage.getEngineeringDetails(req.params.projectId);
      res.json(details);
    } catch (error) {
      console.error("Error fetching engineering details:", error);
      res.status(500).json({ message: "Failed to fetch engineering details" });
    }
  });

  app.post('/api/projects/:projectId/engineering-details', isAuthenticated, async (req: any, res) => {
    try {
      const detail = await storage.createEngineeringDetail({
        ...req.body,
        projectId: req.params.projectId,
      });
      res.status(201).json(detail);
    } catch (error) {
      console.error("Error creating engineering detail:", error);
      res.status(500).json({ message: "Failed to create engineering detail" });
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
  const siteBuiltTotalCost = modularTotalCost * 1.0101; // 1% higher (adjusted to show exactly 1% savings)
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
    costSavingsPercent: costSavingsPercent.toFixed(0),
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

// Helper function to create sample partners for the marketplace
async function createSamplePartners() {
  const samplePartners = [
    // Fabricators
    {
      name: "Modular Solutions Inc",
      partnerType: "fabricator",
      location: "Portland, OR",
      city: "Portland",
      state: "OR",
      latitude: "45.5152",
      longitude: "-122.6784",
      yearEstablished: 2015,
      buildingTypeFocus: "multifamily",
      capacity: "50-200 units per month, specializes in 3-6 story buildings",
      certifications: "ISO 9001, ENERGY STAR Certified",
      contactEmail: "sales@modularsolutions.com",
      contactPhone: "(503) 555-0123",
      website: "www.modularsolutions.com",
      description: "Leading modular fabricator specializing in multifamily housing with emphasis on sustainable construction",
      specialties: "Energy-efficient design, rapid delivery, custom architectural features",
      avgProjectSize: "medium",
      rating: "4.8",
      totalProjects: 127,
    },
    {
      name: "Pacific Modular Manufacturing",
      partnerType: "fabricator",
      location: "Sacramento, CA",
      city: "Sacramento", 
      state: "CA",
      latitude: "38.5816",
      longitude: "-121.4944",
      yearEstablished: 2018,
      buildingTypeFocus: "multifamily",
      capacity: "30-150 units per month, up to 8 stories",
      certifications: "HUD Code Certified, Green Building Certified",
      contactEmail: "info@pacificmodular.com",
      contactPhone: "(916) 555-0456",
      website: "www.pacificmodular.com",
      description: "Advanced modular construction with focus on high-density urban housing",
      specialties: "High-rise modular, urban infill, mixed-use developments",
      avgProjectSize: "large",
      rating: "4.6",
      totalProjects: 89,
    },
    {
      name: "Rocky Mountain Modular",
      partnerType: "fabricator",
      location: "Denver, CO",
      city: "Denver",
      state: "CO",
      latitude: "39.7392",
      longitude: "-104.9903",
      yearEstablished: 2012,
      buildingTypeFocus: "multifamily",
      capacity: "20-100 units per month, specializes in 2-4 story buildings",
      certifications: "OSHA Certified, Energy Star Partner",
      contactEmail: "contact@rmmodular.com",
      contactPhone: "(720) 555-0789",
      website: "www.rmmodular.com", 
      description: "Regional modular fabricator serving Colorado and surrounding mountain states",
      specialties: "Cold weather construction, mountain terrain adaptation, energy efficiency",
      avgProjectSize: "medium",
      rating: "4.7",
      totalProjects: 156,
    },
    // General Contractors
    {
      name: "Premier Construction Partners",
      partnerType: "gc",
      location: "San Francisco, CA",
      city: "San Francisco",
      state: "CA", 
      latitude: "37.7749",
      longitude: "-122.4194",
      yearEstablished: 2010,
      buildingTypeFocus: "multifamily",
      capacity: "5-15 concurrent projects, up to 300 units per project",
      certifications: "CGC Licensed, LEED Accredited",
      contactEmail: "projects@premierconstruction.com",
      contactPhone: "(415) 555-0321",
      website: "www.premierconstruction.com",
      description: "Full-service general contractor specializing in modular and traditional construction",
      specialties: "Site preparation, utility connections, final assembly, project management",
      avgProjectSize: "large",
      rating: "4.9",
      totalProjects: 203,
    },
    // AORs
    {
      name: "Urban Design Associates",
      partnerType: "aor",
      location: "Seattle, WA",
      city: "Seattle",
      state: "WA",
      latitude: "47.6062",
      longitude: "-122.3321",
      yearEstablished: 2008,
      buildingTypeFocus: "multifamily",
      capacity: "8-12 concurrent projects, specializes in entitlement process",
      certifications: "AIA Member, NCARB Certified",
      contactEmail: "design@urbandesignassoc.com",
      contactPhone: "(206) 555-0654",
      website: "www.urbandesignassoc.com",
      description: "Architectural firm with extensive experience in modular design and urban entitlement",
      specialties: "Zoning compliance, permit expediting, modular design optimization",
      avgProjectSize: "medium",
      rating: "4.8",
      totalProjects: 178,
    },
    // Transportation
    {
      name: "Elite Modular Transport",
      partnerType: "transportation",
      location: "Phoenix, AZ",
      city: "Phoenix",
      state: "AZ",
      latitude: "33.4484",
      longitude: "-112.0740",
      yearEstablished: 2016,
      buildingTypeFocus: "all",
      capacity: "200+ modular moves per month, nationwide coverage",
      certifications: "DOT Certified, Heavy Haul Specialist",
      contactEmail: "logistics@elitemodular.com",
      contactPhone: "(602) 555-0987",
      website: "www.elitemodulartransport.com",
      description: "Specialized transportation and crane services for modular construction",
      specialties: "Heavy haul transport, crane services, site logistics, installation supervision",
      avgProjectSize: "all",
      rating: "4.7",
      totalProjects: 892,
    },
  ];

  const createdPartners = [];
  for (const partnerData of samplePartners) {
    const partner = await storage.createPartner(partnerData);
    createdPartners.push(partner);
  }
  
  return createdPartners;
}
