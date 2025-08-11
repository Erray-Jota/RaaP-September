import type { Project } from '@shared/schema';

export const sampleProjects: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
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
    
    // Feasibility scoring - Serenity Village from the document
    zoningScore: "4.0",
    zoningJustification: "Score of 4/5 as concessions are required to reduce open space and parking requirements. Modular construction does not introduce any additional waivers or restrictions for this site.",
    massingScore: "5.0",
    massingJustification: "Score of 5/5 since we can achieve the goal of 24 units and unit mix as the traditional original design.",
    costScore: "4.0",
    costJustification: "$10.8M ($411/sf; $451K/unit). Prevailing Wage: 1.2% savings over site-built. Score of 4/5 since modular is cheaper than site-built.",
    sustainabilityScore: "5.0",
    sustainabilityJustification: "Score of 5/5 due to strong alignment with PHIUS and Net Zero Energy goals through modular design. Will require enhancements to foundation, walls, roof, windows, HVAC & lighting in addition to the investment in batteries & solar power.",
    logisticsScore: "5.0",
    logisticsJustification: "Score of 5/5 due to easy access from the highway and available open space for the staging site.",
    buildTimeScore: "4.0",
    buildTimeJustification: "9 months design + construction using modular approach vs 13 months for site built. Score of 4/5 due to savings of 4 months.",
    overallScore: "4.4",
    
    // Cost analysis - from the document
    modularTotalCost: "10821565",
    modularCostPerSf: "411",
    modularCostPerUnit: "450899",
    siteBuiltTotalCost: "10960303",
    siteBuiltCostPerSf: "422",
    siteBuiltCostPerUnit: "456679",
    costSavingsPercent: "1",
    
    // Timeline analysis
    modularTimelineMonths: 9,
    siteBuiltTimelineMonths: 13,
    timeSavingsMonths: 4,
    
    // Zoning details
    zoningDistrict: "RM",
    densityBonusEligible: true,
    requiredWaivers: "Concession for Open Space Reduction. Concessions can be used to lower parking requirement.",
    
    // Logistics details
    factoryLocation: "Tracy, CA",
    transportationNotes: "Within 1/2 mile of highway 70 and exit 18A to Olivehurst Ave and Chestnut Rd with no bridge or access issues observed for factory delivery.",
    stagingNotes: "Large open site, with no visible restrictions for staging. Overhead powerline on Chestnut Rd could cause some crane logistics concerns.",
  },
  
  {
    name: "Mountain View Apartments",
    address: "1425 Castro Street, Mountain View, CA",
    projectType: "senior",
    targetFloors: 4,
    studioUnits: 8,
    oneBedUnits: 20,
    twoBedUnits: 8,
    threeBedUnits: 0,
    targetParkingSpaces: 36,
    buildingDimensions: "180' X 75'",
    constructionType: "Type V-A",
    
    // Feasibility scoring
    zoningScore: "4.2",
    zoningJustification: "Strong zoning compatibility for senior housing with minor concessions needed for parking requirements.",
    massingScore: "4.8",
    massingJustification: "Excellent unit configuration for modular construction with efficient repetitive layouts.",
    costScore: "4.5",
    costJustification: "3% cost savings over site-built construction due to factory efficiencies and reduced labor costs.",
    sustainabilityScore: "4.5",
    sustainabilityJustification: "Good sustainability potential with modular design supporting energy efficiency goals.",
    logisticsScore: "4.0",
    logisticsJustification: "Urban location with some transportation constraints but adequate staging area.",
    buildTimeScore: "4.8",
    buildTimeJustification: "5 months time savings through parallel construction and factory efficiency.",
    overallScore: "4.6",
    
    // Cost analysis
    modularTotalCost: "18540000",
    modularCostPerSf: "485",
    modularCostPerUnit: "515000",
    siteBuiltTotalCost: "19158000",
    siteBuiltCostPerSf: "501",
    siteBuiltCostPerUnit: "532167",
    costSavingsPercent: "3",
    
    // Timeline analysis
    modularTimelineMonths: 8,
    siteBuiltTimelineMonths: 14,
    timeSavingsMonths: 6,
    
    // Zoning details
    zoningDistrict: "R4",
    densityBonusEligible: false,
    requiredWaivers: "Parking reduction for senior housing requirements.",
    
    // Logistics details
    factoryLocation: "Tracy, CA",
    transportationNotes: "Highway 101 access with urban delivery considerations. Route planning required for oversize loads.",
    stagingNotes: "Limited staging area requires careful logistics coordination. Street closures may be needed.",
  },
  
  {
    name: "University Housing Complex",
    address: "2100 17th Street, Boulder, CO",
    projectType: "student",
    targetFloors: 4,
    studioUnits: 24,
    oneBedUnits: 24,
    twoBedUnits: 0,
    threeBedUnits: 0,
    targetParkingSpaces: 24,
    buildingDimensions: "200' X 60'",
    constructionType: "Type III-A",
    
    // Feasibility scoring
    zoningScore: "3.5",
    zoningJustification: "Zoning allows student housing but height restrictions and setback requirements create some constraints.",
    massingScore: "4.2",
    massingJustification: "Good modular efficiency with repetitive unit layouts, 4-story construction well-suited for modular.",
    costScore: "3.8",
    costJustification: "4.65% cost savings over site-built. Good modular economics for student housing scale.",
    sustainabilityScore: "4.0",
    sustainabilityJustification: "Moderate sustainability benefits with modular construction supporting campus sustainability goals.",
    logisticsScore: "3.5",
    logisticsJustification: "Mountain location creates transportation challenges. Limited factory options in region.",
    buildTimeScore: "4.5",
    buildTimeJustification: "5 months time savings important for academic calendar timing.",
    overallScore: "4.4",
    
    // Cost analysis
    modularTotalCost: "24576000",
    modularCostPerSf: "512",
    modularCostPerUnit: "512000",
    siteBuiltTotalCost: "25774515",
    siteBuiltCostPerSf: "521",
    siteBuiltCostPerUnit: "536969",
    costSavingsPercent: "4.65",
    
    // Timeline analysis
    modularTimelineMonths: 11,
    siteBuiltTimelineMonths: 16,
    timeSavingsMonths: 5,
    
    // Zoning details
    zoningDistrict: "MU-2",
    densityBonusEligible: false,
    requiredWaivers: "Height variance for 5-story construction. Reduced parking for student housing.",
    
    // Logistics details
    factoryLocation: "Denver, CO",
    transportationNotes: "Mountain highway transport from Denver factory. Weather considerations for winter delivery.",
    stagingNotes: "Campus location with restrictions on construction hours and staging area access.",
  },
  
  {
    name: "Workforce Commons",
    address: "875 Elm Avenue, Denver, CO",
    projectType: "workforce",
    targetFloors: 4,
    studioUnits: 0,
    oneBedUnits: 16,
    twoBedUnits: 16,
    threeBedUnits: 0,
    targetParkingSpaces: 40,
    buildingDimensions: "165' X 70'",
    constructionType: "Type V-A",
    
    // Feasibility scoring
    zoningScore: "4.8",
    zoningJustification: "Excellent zoning compatibility for workforce housing with city incentives and streamlined approval process.",
    massingScore: "4.5",
    massingJustification: "Very good modular fit with 32 units (16 1-bed, 16 2-bed) and optimal building configuration.",
    costScore: "4.8",
    costJustification: "8.23% cost savings over site-built construction. Strong modular economics for this project scale.",
    sustainabilityScore: "4.7",
    sustainabilityJustification: "Excellent sustainability alignment with city green building requirements and modular efficiency.",
    logisticsScore: "4.8",
    logisticsJustification: "Optimal logistics with nearby factory, excellent highway access, and ample staging space.",
    buildTimeScore: "5.0",
    buildTimeJustification: "7 months time savings crucial for workforce housing delivery timeline.",
    overallScore: "4.6",
    
    // Cost analysis
    modularTotalCost: "17323946",
    modularCostPerSf: "448",
    modularCostPerUnit: "541373",
    siteBuiltTotalCost: "18877570",
    siteBuiltCostPerSf: "469",
    siteBuiltCostPerUnit: "589924",
    costSavingsPercent: "8.23",
    
    // Timeline analysis
    modularTimelineMonths: 7,
    siteBuiltTimelineMonths: 14,
    timeSavingsMonths: 7,
    
    // Zoning details
    zoningDistrict: "MX-3",
    densityBonusEligible: true,
    requiredWaivers: "None required. Project fully compliant with workforce housing incentives.",
    
    // Logistics details
    factoryLocation: "Denver, CO",
    transportationNotes: "Excellent highway access from local factory. Urban delivery route well-established.",
    stagingNotes: "Large development site with excellent staging area and no access restrictions.",
  }
];

export const sampleCostBreakdowns = [
  // Serenity Village cost breakdowns (from the document)
  {
    category: "03 Concrete",
    siteBuiltCost: "407021",
    raapGcCost: "285136",
    raapFabCost: "164393",
    raapTotalCost: "449528"
  },
  {
    category: "06 Wood & Plastics",
    siteBuiltCost: "1982860",
    raapGcCost: "14171",
    raapFabCost: "2137612",
    raapTotalCost: "2151783"
  },
  {
    category: "07 Thermal & Moisture",
    siteBuiltCost: "490766",
    raapGcCost: "289407",
    raapFabCost: "293030",
    raapTotalCost: "582437"
  },
  {
    category: "22 Plumbing",
    siteBuiltCost: "767391",
    raapGcCost: "431516",
    raapFabCost: "306882",
    raapTotalCost: "738398"
  },
  {
    category: "26 Electrical",
    siteBuiltCost: "978984",
    raapGcCost: "776008",
    raapFabCost: "170998",
    raapTotalCost: "947005"
  }
];

export function calculateFeasibilityScores(projectData: any) {
  const totalUnits = (projectData.studioUnits || 0) + (projectData.oneBedUnits || 0) + 
                    (projectData.twoBedUnits || 0) + (projectData.threeBedUnits || 0);
  
  // Scoring based on project characteristics
  let zoningScore = 3.5;
  let massingScore = 4.0;
  let costScore = 4.0;
  let sustainabilityScore = 4.0;
  let logisticsScore = 4.0;
  let buildTimeScore = 4.0;

  // Adjust scores based on project type
  if (projectData.projectType === 'affordable') {
    zoningScore = 4.0; // Better zoning for affordable housing
    sustainabilityScore = 5.0; // High sustainability focus
  } else if (projectData.projectType === 'senior') {
    zoningScore = 4.2; // Good zoning for senior housing
    costScore = 4.5; // Higher cost efficiency
  } else if (projectData.projectType === 'workforce') {
    zoningScore = 4.8; // Excellent zoning incentives
    costScore = 4.8; // Strong economics
    buildTimeScore = 5.0; // Time critical
  } else if (projectData.projectType === 'student') {
    zoningScore = 3.5; // More zoning constraints
    logisticsScore = 3.5; // Campus logistics challenges
  }

  // Adjust for unit count
  if (totalUnits >= 30) {
    massingScore = Math.min(5.0, massingScore + 0.5);
    costScore = Math.min(5.0, costScore + 0.3);
  } else if (totalUnits < 20) {
    costScore = Math.max(3.0, costScore - 0.3);
  }

  // Adjust for floors
  if (projectData.targetFloors >= 5) {
    massingScore = Math.max(3.5, massingScore - 0.3);
    logisticsScore = Math.max(3.5, logisticsScore - 0.3);
  } else if (projectData.targetFloors <= 3) {
    sustainabilityScore = Math.min(5.0, sustainabilityScore + 0.3);
  }

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
  const baseCostPerUnit = projectData.projectType === 'affordable' ? 451000 : 
                         projectData.projectType === 'senior' ? 515000 :
                         projectData.projectType === 'workforce' ? 480000 : 512000;
  
  const modularTotalCost = totalUnits * baseCostPerUnit;
  const costSavingsPercent = costScore >= 4.5 ? 4.5 : costScore >= 4.0 ? 1.2 : 0.8;
  const siteBuiltTotalCost = modularTotalCost * (1 + costSavingsPercent / 100);
  
  // Timeline estimates
  const baseModularTime = 9;
  const modularTime = projectData.targetFloors >= 5 ? baseModularTime + 2 : baseModularTime;
  const timeSavings = buildTimeScore >= 4.5 ? 6 : buildTimeScore >= 4.0 ? 4 : 3;
  const siteBuiltTime = modularTime + timeSavings;

  return {
    zoningScore: zoningScore.toFixed(1),
    zoningJustification: getZoningJustification(zoningScore, projectData.projectType),
    massingScore: massingScore.toFixed(1),
    massingJustification: getMassingJustification(massingScore, totalUnits),
    costScore: costScore.toFixed(1),
    costJustification: getCostJustification(costScore, costSavingsPercent),
    sustainabilityScore: sustainabilityScore.toFixed(1),
    sustainabilityJustification: getSustainabilityJustification(sustainabilityScore),
    logisticsScore: logisticsScore.toFixed(1),
    logisticsJustification: getLogisticsJustification(logisticsScore),
    buildTimeScore: buildTimeScore.toFixed(1),
    buildTimeJustification: getBuildTimeJustification(buildTimeScore, timeSavings),
    overallScore: overallScore.toFixed(1),
    modularTotalCost: modularTotalCost.toString(),
    modularCostPerUnit: baseCostPerUnit.toString(),
    siteBuiltTotalCost: siteBuiltTotalCost.toString(),
    siteBuiltCostPerUnit: (siteBuiltTotalCost / totalUnits).toString(),
    costSavingsPercent: costSavingsPercent.toFixed(1),
    modularTimelineMonths: modularTime,
    siteBuiltTimelineMonths: siteBuiltTime,
    timeSavingsMonths: timeSavings,
    factoryLocation: "Tracy, CA",
    zoningDistrict: "RM",
    densityBonusEligible: projectData.projectType === 'affordable' || projectData.projectType === 'workforce',
  };
}

function getZoningJustification(score: number, projectType: string): string {
  if (score >= 4.5) return "Excellent zoning compatibility with streamlined approval process and favorable regulations.";
  if (score >= 4.0) return "Good zoning fit with minor concessions required for optimal project configuration.";
  if (score >= 3.5) return "Moderate zoning compatibility with some restrictions and waiver requirements.";
  return "Challenging zoning situation requiring significant variances and concessions.";
}

function getMassingJustification(score: number, totalUnits: number): string {
  if (score >= 4.5) return `Excellent modular efficiency with ${totalUnits} units configured for optimal factory construction.`;
  if (score >= 4.0) return `Good modular fit achieving target unit count with efficient repetitive layouts.`;
  if (score >= 3.5) return `Moderate modular compatibility with some design adaptations needed.`;
  return "Challenging massing configuration requiring significant modular design modifications.";
}

function getCostJustification(score: number, savings: number): string {
  if (score >= 4.5) return `Strong cost advantages with ${savings.toFixed(1)}% savings over site-built construction.`;
  if (score >= 4.0) return `Cost competitive with ${savings.toFixed(1)}% savings through modular efficiencies.`;
  if (score >= 3.5) return `Moderate cost benefits with minimal savings over traditional construction.`;
  return "Cost neutral or slightly higher than site-built construction.";
}

function getSustainabilityJustification(score: number): string {
  if (score >= 4.5) return "Excellent sustainability alignment with Net Zero Energy and PHIUS certification potential.";
  if (score >= 4.0) return "Good sustainability benefits through modular construction waste reduction and efficiency.";
  if (score >= 3.5) return "Moderate sustainability improvements over traditional construction methods.";
  return "Limited sustainability advantages with modular construction approach.";
}

function getLogisticsJustification(score: number): string {
  if (score >= 4.5) return "Excellent logistics with optimal factory proximity, highway access, and staging capabilities.";
  if (score >= 4.0) return "Good logistics setup with reasonable transportation routes and adequate staging space.";
  if (score >= 3.5) return "Moderate logistics challenges with some transportation or staging constraints.";
  return "Significant logistics obstacles requiring careful planning and coordination.";
}

function getBuildTimeJustification(score: number, savings: number): string {
  if (score >= 4.5) return `Excellent time savings of ${savings} months through parallel construction and factory efficiency.`;
  if (score >= 4.0) return `Good time advantages with ${savings} months savings over traditional construction timeline.`;
  if (score >= 3.5) return `Moderate time benefits with ${savings} months reduction in project schedule.`;
  return "Minimal time advantages over site-built construction methods.";
}
