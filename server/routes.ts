import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertCostBreakdownSchema, projects, type InsertProject } from "@shared/schema";
import { z } from "zod";
import googleSheetsService, { type SimulatorParams } from "./googleSheetsService";

export async function registerRoutes(app: Express): Promise<Server> {


  // API configuration endpoint
  app.get('/api/config/maps', async (req: any, res) => {
    try {
      res.json({ 
        apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
      });
    } catch (error) {
      console.error("Error fetching maps config:", error);
      res.status(500).json({ message: "Failed to fetch maps configuration" });
    }
  });

  // Project routes
  app.get('/api/projects', async (req: any, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', async (req: any, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      
      // Calculate feasibility scores for new user projects
      const scores: FeasibilityScoreResult = calculateFeasibilityScores(validatedData, true);
      
      const payload: NewProjectPayload = {
        ...validatedData,
        ...scores,
        userId: 'default-user',
      };
      
      const project = await storage.createProject(payload);

      // Create sample cost breakdowns for the project
      const costBreakdowns = await createSampleCostBreakdowns(project.id, validatedData.projectType);

      res.status(201).json({ project, costBreakdowns });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const validatedData = insertProjectSchema.partial().parse(req.body);
      
      // Protect sample project scores from being overwritten - only recalculate for non-sample projects
      const updatePayload: Partial<NewProjectPayload> = project.isSample 
        ? validatedData  // Sample projects: use only provided data, preserve existing scores
        : {             // Non-sample projects: recalculate scores
            ...validatedData,
            ...calculateFeasibilityScores({ ...project, ...validatedData }, true)
          };
      
      const updatedProject = await storage.updateProject(id, updatePayload);

      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // PATCH route for updating application completion status
  app.patch('/api/projects/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
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
  app.get('/api/projects/:id/cost-breakdowns', async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const costBreakdowns = await storage.getProjectCostBreakdowns(id);
      res.json(costBreakdowns);
    } catch (error) {
      console.error("Error fetching cost breakdowns:", error);
      res.status(500).json({ message: "Failed to fetch cost breakdowns" });
    }
  });

  // Sample projects initialization route
  app.post('/api/initialize-sample-projects', async (req: any, res) => {
    try {
      const existingProjects = await storage.getAllProjects();
      
      if (existingProjects.length > 0) {
        return res.json({ message: "Sample projects already exist" });
      }

      const sampleProjects = await createSampleProjects('default-user');
      res.json(sampleProjects);
    } catch (error) {
      console.error("Error initializing sample projects:", error);
      res.status(500).json({ message: "Failed to initialize sample projects" });
    }
  });

  // Partner routes for FabAssure marketplace
  app.get('/api/partners', async (req: any, res) => {
    try {
      const partners = await storage.getAllPartners();
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get('/api/partners/:type', async (req: any, res) => {
    try {
      const { type } = req.params;
      const partners = await storage.getPartnersByType(type);
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners by type:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get('/api/projects/:projectId/partner-evaluations', async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const evaluations = await storage.getPartnerEvaluations(projectId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching partner evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post('/api/projects/:projectId/partner-evaluations', async (req: any, res) => {
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

  app.get('/api/projects/:projectId/partner-contracts', async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const contracts = await storage.getPartnerContracts(projectId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching partner contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post('/api/projects/:projectId/partner-contracts', async (req: any, res) => {
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
  app.post('/api/seed-partners', async (req: any, res) => {
    try {
      const samplePartners = await createSamplePartners();
      res.json({ message: "Sample partners created", count: samplePartners.length });
    } catch (error) {
      console.error("Error seeding partners:", error);
      res.status(500).json({ message: "Failed to seed partners" });
    }
  });

  // Simulator API route for Google Sheets integration
  app.post('/api/simulator/calculate', async (req: any, res) => {
    try {
      const simulatorParamsSchema = z.object({
        oneBedUnits: z.number().min(0).max(20),
        twoBedUnits: z.number().min(0).max(20),
        threeBedUnits: z.number().min(0).max(15),
        floors: z.number().min(2).max(4),
        buildingType: z.string(),
        parkingType: z.string(),
        location: z.string(),
        prevailingWage: z.boolean(),
        siteConditions: z.string(),
      });

      const validatedParams = simulatorParamsSchema.parse(req.body);
      const results = await googleSheetsService.updateSimulatorParams(validatedParams);
      
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid simulator parameters", errors: error.errors });
      }
      console.error("Error calculating costs:", error);
      res.status(500).json({ message: "Failed to calculate costs" });
    }
  });

  // EasyDesign API routes
  app.get('/api/projects/:projectId/design-documents', async (req: any, res) => {
    try {
      const documents = await storage.getDesignDocuments(req.params.projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching design documents:", error);
      res.status(500).json({ message: "Failed to fetch design documents" });
    }
  });

  app.post('/api/projects/:projectId/design-documents', async (req: any, res) => {
    try {
      const document = await storage.createDesignDocument({
        ...req.body,
        projectId: req.params.projectId,
        createdBy: 'default-user',
      });
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating design document:", error);
      res.status(500).json({ message: "Failed to create design document" });
    }
  });

  app.get('/api/projects/:projectId/material-specifications', async (req: any, res) => {
    try {
      const specs = await storage.getMaterialSpecifications(req.params.projectId);
      res.json(specs);
    } catch (error) {
      console.error("Error fetching material specifications:", error);
      res.status(500).json({ message: "Failed to fetch material specifications" });
    }
  });

  app.post('/api/projects/:projectId/material-specifications', async (req: any, res) => {
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

  app.get('/api/projects/:projectId/door-schedule', async (req: any, res) => {
    try {
      const doorItems = await storage.getDoorSchedule(req.params.projectId);
      res.json(doorItems);
    } catch (error) {
      console.error("Error fetching door schedule:", error);
      res.status(500).json({ message: "Failed to fetch door schedule" });
    }
  });

  app.post('/api/projects/:projectId/door-schedule', async (req: any, res) => {
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

  app.get('/api/projects/:projectId/design-workflows', async (req: any, res) => {
    try {
      const workflows = await storage.getDesignWorkflows(req.params.projectId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching design workflows:", error);
      res.status(500).json({ message: "Failed to fetch design workflows" });
    }
  });

  app.post('/api/projects/:projectId/design-workflows', async (req: any, res) => {
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

  app.get('/api/projects/:projectId/engineering-details', async (req: any, res) => {
    try {
      const details = await storage.getEngineeringDetails(req.params.projectId);
      res.json(details);
    } catch (error) {
      console.error("Error fetching engineering details:", error);
      res.status(500).json({ message: "Failed to fetch engineering details" });
    }
  });

  app.post('/api/projects/:projectId/engineering-details', async (req: any, res) => {
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
// Define typed payloads for project operations
type NewProjectPayload = Omit<InsertProject, 'id' | 'createdAt' | 'updatedAt'>;

// Define the exact return type for feasibility scores - only scalar fields that map to existing columns
type FeasibilityScoreResult = Pick<InsertProject, 
  'zoningScore' | 'zoningJustification' | 'massingScore' | 'massingJustification' | 
  'costScore' | 'costJustification' | 'sustainabilityScore' | 'sustainabilityJustification' | 
  'logisticsScore' | 'logisticsJustification' | 'buildTimeScore' | 'buildTimeJustification' | 
  'overallScore' | 'modularTotalCost' | 'modularCostPerUnit' | 'modularCostPerSf' | 
  'siteBuiltTotalCost' | 'siteBuiltCostPerUnit' | 'siteBuiltCostPerSf' | 'costSavingsPercent' | 
  'modularTimelineMonths' | 'siteBuiltTimelineMonths' | 'timeSavingsMonths' | 'factoryLocation' | 
  'zoningDistrict' | 'densityBonusEligible'
>;

function calculateFeasibilityScores(projectData: any, isNewProject: boolean = true): FeasibilityScoreResult {
  // Implement scoring algorithm based on RaaP's methodology
  const totalUnits = (projectData.studioUnits || 0) + (projectData.oneBedUnits || 0) + 
                    (projectData.twoBedUnits || 0) + (projectData.threeBedUnits || 0);
  
  // Base scores with different scoring for hotel/hostel vs other projects
  const isHotelProject = projectData.projectType === 'hotel' || projectData.projectType === 'hostel';
  
  const zoningScore = 5.0;
  const massingScore = 5.0;
  const costScore = isHotelProject ? 3.0 : 5.0; // Cost: 3 for hotel/hostel, 5 for others
  const sustainabilityScore = 5.0;
  const logisticsScore = isHotelProject ? 5.0 : 4.0; // Logistics: 5 for hotel/hostel, 4 for others
  const buildTimeScore = 5.0;

  // Calculate weighted overall score
  const overallScore = (
    zoningScore * 0.20 +
    massingScore * 0.15 +
    costScore * 0.20 +
    sustainabilityScore * 0.20 +
    logisticsScore * 0.15 +
    buildTimeScore * 0.10
  );

  // Calculate cost estimates - use NEW specifications only for new projects
  let modularTotalCost, costPerUnit, costPerSf, costSavingsPercent, siteBuiltTotalCost;
  
  // Prevent division by zero - use minimum of 1 unit if totalUnits is 0
  const safeUnits = Math.max(totalUnits, 1);
  
  if (isNewProject) {
    // NEW project specifications using Shadey Village actual data
    modularTotalCost = 35684879; // $35.68M from Shadey Village actual data
    costPerUnit = 346455; // $346,455 per unit for new projects
    costPerSf = 248; // $248 per sq ft for new projects
    costSavingsPercent = 22.8; // 22.8% savings from actual data ((46.22M - 35.68M) / 46.22M)
    siteBuiltTotalCost = 46221006; // $46.22M site-built cost from actual data
  } else {
    // Original logic for sample projects
    costPerUnit = projectData.projectType === 'affordable' ? 321621 : 
                  projectData.projectType === 'senior' ? 365000 :
                  projectData.projectType === 'workforce' ? 340000 : 350000;
    modularTotalCost = safeUnits * costPerUnit;
    costSavingsPercent = 30.0; // 30% savings consistently
    
    // Prevent infinite values in division - ensure denominator is not zero or negative
    const savingsRatio = costSavingsPercent / 100;
    if (savingsRatio >= 1) {
      siteBuiltTotalCost = modularTotalCost * 1.3; // Fallback to 30% higher
    } else {
      siteBuiltTotalCost = modularTotalCost / (1 - savingsRatio);
    }
    
    // Prevent division by zero in cost per sq ft calculation
    costPerSf = Math.round(modularTotalCost / (safeUnits * 800)); // Approximate sq ft calculation
  }

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
    modularCostPerSf: costPerSf.toString(),
    siteBuiltTotalCost: siteBuiltTotalCost.toString(),
    siteBuiltCostPerUnit: (siteBuiltTotalCost / (isNewProject ? 103 : safeUnits)).toString(),
    siteBuiltCostPerSf: Math.round(siteBuiltTotalCost / (safeUnits * 800)).toString(),
    costSavingsPercent: costSavingsPercent.toFixed(1),
    modularTimelineMonths: "30.5", // Fixed modular timeline
    siteBuiltTimelineMonths: "41.0", // Fixed site-built timeline  
    timeSavingsMonths: "10.5", // Fixed time savings (25% of 41 months)
    factoryLocation: projectData.factoryLocation || "Tracy, CA",
    zoningDistrict: "RM",
    densityBonusEligible: projectData.projectType === 'affordable',
  };
}

// Helper function to create sample cost breakdowns
async function createSampleCostBreakdowns(projectId: string, projectType?: string) {
  // Use hotel template for hotel/hostel projects, standard template for others
  const isHotelProject = projectType === 'hotel' || projectType === 'hostel';
  
  const breakdowns = isHotelProject ? [
    // Hotel/Hostel cost breakdown template (based on Sample Hotel Project)
    {
      projectId,
      category: "00 Fees",
      siteBuiltCost: "1526305",
      raapGcCost: "1004380",
      raapFabCost: "0",
      raapTotalCost: "1004380"
    },
    {
      projectId,
      category: "01 General Requirements",
      siteBuiltCost: "778773",
      raapGcCost: "567112",
      raapFabCost: "0",
      raapTotalCost: "567112"
    },
    {
      projectId,
      category: "03 Concrete",
      siteBuiltCost: "468998",
      raapGcCost: "165821",
      raapFabCost: "304214",
      raapTotalCost: "470035"
    },
    {
      projectId,
      category: "04 Masonry",
      siteBuiltCost: "184155",
      raapGcCost: "184155",
      raapFabCost: "0",
      raapTotalCost: "184155"
    },
    {
      projectId,
      category: "05 Metal",
      siteBuiltCost: "1092023",
      raapGcCost: "1092023",
      raapFabCost: "0",
      raapTotalCost: "1092023"
    },
    {
      projectId,
      category: "06 Wood & Plastics",
      siteBuiltCost: "2129166",
      raapGcCost: "434157",
      raapFabCost: "2806564",
      raapTotalCost: "3240721"
    },
    {
      projectId,
      category: "07 Thermal & Moisture Protection",
      siteBuiltCost: "667676",
      raapGcCost: "394625",
      raapFabCost: "425067",
      raapTotalCost: "819692"
    },
    {
      projectId,
      category: "08 Openings",
      siteBuiltCost: "798129",
      raapGcCost: "251261",
      raapFabCost: "557806",
      raapTotalCost: "809066"
    },
    {
      projectId,
      category: "09 Finishes",
      siteBuiltCost: "1317631",
      raapGcCost: "566835",
      raapFabCost: "892950",
      raapTotalCost: "1459785"
    },
    {
      projectId,
      category: "10 Specialties",
      siteBuiltCost: "0",
      raapGcCost: "0",
      raapFabCost: "0",
      raapTotalCost: "0"
    },
    {
      projectId,
      category: "11 Equipment",
      siteBuiltCost: "341606",
      raapGcCost: "341606",
      raapFabCost: "0",
      raapTotalCost: "341606"
    },
    {
      projectId,
      category: "12 Furnishing",
      siteBuiltCost: "445131",
      raapGcCost: "224401",
      raapFabCost: "220092",
      raapTotalCost: "444493"
    },
    {
      projectId,
      category: "13 Special Construction",
      siteBuiltCost: "8525",
      raapGcCost: "8525",
      raapFabCost: "0",
      raapTotalCost: "8525"
    },
    {
      projectId,
      category: "21 Fire Suppression",
      siteBuiltCost: "240348",
      raapGcCost: "180545",
      raapFabCost: "92233",
      raapTotalCost: "272778"
    },
    {
      projectId,
      category: "22 Plumbing",
      siteBuiltCost: "1058519",
      raapGcCost: "867075",
      raapFabCost: "739771",
      raapTotalCost: "1606846"
    },
    {
      projectId,
      category: "23 HVAC",
      siteBuiltCost: "551436",
      raapGcCost: "248009",
      raapFabCost: "305048",
      raapTotalCost: "553057"
    },
    {
      projectId,
      category: "26 Electrical",
      siteBuiltCost: "1105240",
      raapGcCost: "1347850",
      raapFabCost: "553257",
      raapTotalCost: "1901107"
    },
    {
      projectId,
      category: "31 Earthwork",
      siteBuiltCost: "460315",
      raapGcCost: "460315",
      raapFabCost: "0",
      raapTotalCost: "460315"
    },
    {
      projectId,
      category: "32 Exterior Improvements",
      siteBuiltCost: "664814",
      raapGcCost: "664814",
      raapFabCost: "0",
      raapTotalCost: "664814"
    },
    {
      projectId,
      category: "33 Utilities",
      siteBuiltCost: "677957",
      raapGcCost: "677957",
      raapFabCost: "0",
      raapTotalCost: "677957"
    }
  ] : [
    // Standard housing cost breakdown template - Shadey Village actual data
    {
      projectId,
      category: "03 Concrete",
      siteBuiltCost: "2533115",
      raapGcCost: "1373299",
      raapFabCost: "625628",
      raapTotalCost: "1998927"
    },
    {
      projectId,
      category: "04 Masonry",
      siteBuiltCost: "916443",
      raapGcCost: "845392",
      raapFabCost: "0",
      raapTotalCost: "845392"
    },
    {
      projectId,
      category: "05 Metal",
      siteBuiltCost: "3103653",
      raapGcCost: "2572095",
      raapFabCost: "241556",
      raapTotalCost: "2813651"
    },
    {
      projectId,
      category: "06 Wood & Plastics",
      siteBuiltCost: "8643831",
      raapGcCost: "41318",
      raapFabCost: "6378393",
      raapTotalCost: "6419712"
    },
    {
      projectId,
      category: "07 Thermal & Moisture Protection",
      siteBuiltCost: "2325482",
      raapGcCost: "1129942",
      raapFabCost: "960368",
      raapTotalCost: "2090309"
    },
    {
      projectId,
      category: "08 Openings",
      siteBuiltCost: "1393966",
      raapGcCost: "440895",
      raapFabCost: "792909",
      raapTotalCost: "1233804"
    },
    {
      projectId,
      category: "09 Finishes",
      siteBuiltCost: "5329218",
      raapGcCost: "59288",
      raapFabCost: "2906204",
      raapTotalCost: "2965492"
    },
    {
      projectId,
      category: "10 Specialties",
      siteBuiltCost: "200836",
      raapGcCost: "0",
      raapFabCost: "161890",
      raapTotalCost: "161890"
    },
    {
      projectId,
      category: "11 Equipment",
      siteBuiltCost: "29531",
      raapGcCost: "29531",
      raapFabCost: "0",
      raapTotalCost: "29531"
    },
    {
      projectId,
      category: "12 Furnishing",
      siteBuiltCost: "374255",
      raapGcCost: "18284",
      raapFabCost: "324648",
      raapTotalCost: "342932"
    },
    {
      projectId,
      category: "13 Special Construction",
      siteBuiltCost: "51729",
      raapGcCost: "51729",
      raapFabCost: "0",
      raapTotalCost: "51729"
    },
    {
      projectId,
      category: "21 Fire Suppression",
      siteBuiltCost: "982245",
      raapGcCost: "346948",
      raapFabCost: "351524",
      raapTotalCost: "698472"
    },
    {
      projectId,
      category: "22 Plumbing",
      siteBuiltCost: "2403740",
      raapGcCost: "1124362",
      raapFabCost: "1023475",
      raapTotalCost: "2147838"
    },
    {
      projectId,
      category: "23 HVAC",
      siteBuiltCost: "2505408",
      raapGcCost: "183153",
      raapFabCost: "1297260",
      raapTotalCost: "1480413"
    },
    {
      projectId,
      category: "26 Electrical",
      siteBuiltCost: "3960944",
      raapGcCost: "2811655",
      raapFabCost: "876365",
      raapTotalCost: "3688021"
    },
    {
      projectId,
      category: "31 Earthwork",
      siteBuiltCost: "1146618",
      raapGcCost: "1152469",
      raapFabCost: "0",
      raapTotalCost: "1152469"
    },
    {
      projectId,
      category: "32 Exterior Improvements",
      siteBuiltCost: "1521663",
      raapGcCost: "1521663",
      raapFabCost: "0",
      raapTotalCost: "1521663"
    },
    {
      projectId,
      category: "33 Utilities",
      siteBuiltCost: "1565388",
      raapGcCost: "1565388",
      raapFabCost: "0",
      raapTotalCost: "1565388"
    },
    {
      projectId,
      category: "01 General Requirements",
      siteBuiltCost: "2443868",
      raapGcCost: "959509",
      raapFabCost: "1012388",
      raapTotalCost: "1971897"
    },
    {
      projectId,
      category: "00 Fees",
      siteBuiltCost: "4789073",
      raapGcCost: "1864865",
      raapFabCost: "640485",
      raapTotalCost: "2505350"
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
    const scores = calculateFeasibilityScores(projectData, false); // Sample projects use original logic
    const project = await storage.createProject({
      ...projectData,
      ...scores,
    });
    
    // Create cost breakdowns for each project
    await createSampleCostBreakdowns(project.id, projectData.projectType);
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
    {
      name: "Metro Build Group",
      partnerType: "gc",
      location: "Atlanta, GA",
      city: "Atlanta",
      state: "GA",
      latitude: "33.7490",
      longitude: "-84.3880",
      yearEstablished: 2013,
      buildingTypeFocus: "multifamily",
      capacity: "8-20 concurrent projects, specializes in mid-rise developments",
      certifications: "Georgia CGC License, OSHA 30-Hour",
      contactEmail: "info@metrobuildgroup.com",
      contactPhone: "(404) 555-0145",
      website: "www.metrobuildgroup.com",
      description: "Southeast regional general contractor with extensive modular construction expertise",
      specialties: "Foundation systems, MEP coordination, modular installation, quality control",
      avgProjectSize: "medium",
      rating: "4.6",
      totalProjects: 142,
    },
    {
      name: "Northwest Construction Solutions",
      partnerType: "gc",
      location: "Portland, OR",
      city: "Portland",
      state: "OR",
      latitude: "45.5152",
      longitude: "-122.6784",
      yearEstablished: 2017,
      buildingTypeFocus: "multifamily",
      capacity: "3-12 concurrent projects, up to 200 units per project",
      certifications: "Oregon CCB License, Green Building Certified",
      contactEmail: "projects@nwconstruction.com",
      contactPhone: "(503) 555-0267",
      website: "www.northwestconstruction.com",
      description: "Pacific Northwest contractor focused on sustainable modular construction",
      specialties: "Green building, seismic compliance, moisture protection, local permitting",
      avgProjectSize: "medium",
      rating: "4.8",
      totalProjects: 98,
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
    {
      name: "Innovative Housing Architects",
      partnerType: "aor",
      location: "Austin, TX",
      city: "Austin",
      state: "TX",
      latitude: "30.2672",
      longitude: "-97.7431",
      yearEstablished: 2014,
      buildingTypeFocus: "multifamily",
      capacity: "6-10 concurrent projects, specializes in affordable housing",
      certifications: "Texas Registered Architect, LEED AP",
      contactEmail: "team@innovativehousing.com",
      contactPhone: "(512) 555-0432",
      website: "www.innovativehousingar.com",
      description: "Forward-thinking architectural practice focused on modular affordable housing solutions",
      specialties: "Affordable housing design, modular optimization, sustainable architecture",
      avgProjectSize: "medium",
      rating: "4.7",
      totalProjects: 134,
    },
    {
      name: "Coastal Architecture Studio",
      partnerType: "aor",
      location: "Miami, FL",
      city: "Miami",
      state: "FL",
      latitude: "25.7617",
      longitude: "-80.1918",
      yearEstablished: 2011,
      buildingTypeFocus: "multifamily",
      capacity: "4-8 concurrent projects, specializes in hurricane-resistant design",
      certifications: "Florida Registered Architect, NCARB Certified",
      contactEmail: "studio@coastalarchitecture.com",
      contactPhone: "(305) 555-0765",
      website: "www.coastalarchstudio.com",
      description: "Specialized architectural firm designing hurricane-resistant modular buildings for coastal regions",
      specialties: "Hurricane resistance, coastal construction, flood-resistant design, tropical climate adaptation",
      avgProjectSize: "small",
      rating: "4.9",
      totalProjects: 87,
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
    {
      name: "Precision Logistics Group",
      partnerType: "transportation",
      location: "Chicago, IL",
      city: "Chicago",
      state: "IL",
      latitude: "41.8781",
      longitude: "-87.6298",
      yearEstablished: 2019,
      buildingTypeFocus: "multifamily",
      capacity: "150+ modular deliveries per month, Midwest coverage",
      certifications: "DOT Certified, OSHA 10-Hour",
      contactEmail: "dispatch@precisionlogistics.com",
      contactPhone: "(312) 555-0543",
      website: "www.precisionlogisticsgroup.com",
      description: "Regional transportation specialist serving the Midwest modular construction market",
      specialties: "Route planning, weather contingency, urban delivery, crane coordination",
      avgProjectSize: "medium",
      rating: "4.5",
      totalProjects: 567,
    },
    {
      name: "Coastal Heavy Haul",
      partnerType: "transportation",
      location: "Norfolk, VA",
      city: "Norfolk",
      state: "VA",
      latitude: "36.8468",
      longitude: "-76.2852",
      yearEstablished: 2015,
      buildingTypeFocus: "multifamily",
      capacity: "100+ modular transports per month, East Coast coverage",
      certifications: "Virginia DOT Certified, Heavy Haul Permit Specialist",
      contactEmail: "operations@coastalheavyhaul.com",
      contactPhone: "(757) 555-0321",
      website: "www.coastalheavyhaul.com",
      description: "East Coast transportation company specializing in modular building delivery and installation",
      specialties: "Bridge navigation, coastal route expertise, port delivery, installation cranes",
      avgProjectSize: "medium",
      rating: "4.6",
      totalProjects: 423,
    },
    // Consultants
    {
      name: "Strategic Development Advisors",
      partnerType: "consultant",
      location: "New York, NY",
      city: "New York",
      state: "NY",
      latitude: "40.7128",
      longitude: "-74.0060",
      yearEstablished: 2009,
      buildingTypeFocus: "multifamily",
      capacity: "15-25 concurrent projects, specializes in feasibility analysis",
      certifications: "CCIM, MAI Appraisal",
      contactEmail: "consulting@strategicdev.com",
      contactPhone: "(212) 555-0876",
      website: "www.strategicdevelopmentadvisors.com",
      description: "Premier development consulting firm specializing in modular construction feasibility and market analysis",
      specialties: "Market analysis, financial modeling, entitlement strategy, development management",
      avgProjectSize: "large",
      rating: "4.8",
      totalProjects: 289,
    },
    {
      name: "Modular Efficiency Consultants",
      partnerType: "consultant",
      location: "Denver, CO",
      city: "Denver",
      state: "CO",
      latitude: "39.7392",
      longitude: "-104.9903",
      yearEstablished: 2018,
      buildingTypeFocus: "multifamily",
      capacity: "8-15 concurrent projects, specializes in process optimization",
      certifications: "Lean Six Sigma Black Belt, PMP",
      contactEmail: "info@modularefficiency.com",
      contactPhone: "(720) 555-0654",
      website: "www.modularefficiencyconsultants.com",
      description: "Specialized consultancy focused on optimizing modular construction workflows and efficiency",
      specialties: "Process optimization, lean construction, supply chain management, quality assurance",
      avgProjectSize: "medium",
      rating: "4.7",
      totalProjects: 156,
    },
    {
      name: "Urban Planning Solutions",
      partnerType: "consultant",
      location: "Los Angeles, CA",
      city: "Los Angeles", 
      state: "CA",
      latitude: "34.0522",
      longitude: "-118.2437",
      yearEstablished: 2012,
      buildingTypeFocus: "multifamily",
      capacity: "10-18 concurrent projects, specializes in zoning compliance",
      certifications: "AICP Certified, California Planning",
      contactEmail: "planning@urbanplannningsolutions.com",
      contactPhone: "(213) 555-0987",
      website: "www.urbanplanningsolutions.com",
      description: "Urban planning and zoning consultancy with extensive experience in modular development projects",
      specialties: "Zoning analysis, entitlement processing, community engagement, regulatory compliance",
      avgProjectSize: "medium",
      rating: "4.9",
      totalProjects: 203,
    },
    // Engineering
    {
      name: "Structural Engineering Associates",
      partnerType: "engineering",
      location: "San Jose, CA",
      city: "San Jose",
      state: "CA",
      latitude: "37.3382",
      longitude: "-121.8863",
      yearEstablished: 2010,
      buildingTypeFocus: "multifamily",
      capacity: "12-20 concurrent projects, specializes in seismic design",
      certifications: "California PE License, SE Certification",
      contactEmail: "engineering@structuralassociates.com",
      contactPhone: "(408) 555-0234",
      website: "www.structuralengineeringassoc.com",
      description: "Leading structural engineering firm specializing in modular building design and seismic compliance",
      specialties: "Seismic engineering, structural analysis, connection design, building codes",
      avgProjectSize: "large",
      rating: "4.9",
      totalProjects: 245,
    },
    {
      name: "MEP Solutions Group",
      partnerType: "engineering",
      location: "Boston, MA",
      city: "Boston",
      state: "MA",
      latitude: "42.3601",
      longitude: "-71.0589",
      yearEstablished: 2016,
      buildingTypeFocus: "multifamily",
      capacity: "8-16 concurrent projects, specializes in MEP systems",
      certifications: "Massachusetts PE License, LEED AP",
      contactEmail: "design@mepsolutionsgroup.com",
      contactPhone: "(617) 555-0765",
      website: "www.mepsolutionsgroup.com",
      description: "Mechanical, electrical, and plumbing engineering firm focused on modular construction systems",
      specialties: "MEP design, energy efficiency, modular system integration, building automation",
      avgProjectSize: "medium",
      rating: "4.6",
      totalProjects: 187,
    },
    {
      name: "Civil & Site Engineering",
      partnerType: "engineering",
      location: "Phoenix, AZ",
      city: "Phoenix",
      state: "AZ",
      latitude: "33.4484",
      longitude: "-112.0740",
      yearEstablished: 2014,
      buildingTypeFocus: "multifamily",
      capacity: "6-12 concurrent projects, specializes in site development",
      certifications: "Arizona PE License, LEED Green Associate",
      contactEmail: "civil@civilsiteengineering.com",
      contactPhone: "(602) 555-0432",
      website: "www.civilandsiteengineering.com",
      description: "Civil engineering firm specializing in site development and infrastructure for modular projects",
      specialties: "Site planning, utilities design, drainage systems, accessibility compliance",
      avgProjectSize: "medium",
      rating: "4.7",
      totalProjects: 164,
    },
  ];

  const createdPartners = [];
  for (const partnerData of samplePartners) {
    const partner = await storage.createPartner(partnerData);
    createdPartners.push(partner);
  }
  
  return createdPartners;
}
