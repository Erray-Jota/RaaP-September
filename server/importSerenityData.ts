import { readFileSync } from 'fs';
import { parseCostBreakdownCsv, createCostAnalysisFromCsv } from './csvImporter';
import { storage } from './storage';

// Serenity Village project ID (we'll need to find this)
const SERENITY_VILLAGE_PROJECT_ID = '7c932d1a-01d5-4c4e-b5a5-bd69ee05944a';

async function importSerenityVillageData() {
  try {
    console.log('Starting Serenity Village CSV import...');
    
    // Read the CSV file
    const csvContent = readFileSync('../attached_assets/Serenity Village Cost_1757900952614.csv', 'utf-8');
    
    // Parse the CSV data
    const parsedCsv = parseCostBreakdownCsv(csvContent);
    console.log(`Parsed ${parsedCsv.masterFormatBreakdown.length} cost breakdown items`);
    console.log(`Project totals: Site Built: $${parsedCsv.projectTotals.siteBuiltTotal.toLocaleString()}, Modular: $${parsedCsv.projectTotals.modularTotal.toLocaleString()}`);
    
    // Get the current project to use timeline data
    const project = await storage.getProject(SERENITY_VILLAGE_PROJECT_ID);
    if (!project) {
      throw new Error('Serenity Village project not found');
    }
    
    // Create cost analysis from CSV data
    const costAnalysis = createCostAnalysisFromCsv(parsedCsv, {
      modularTimelineMonths: parseFloat(project.modularTimelineMonths || '9'),
      siteBuiltTimelineMonths: parseFloat(project.siteBuiltTimelineMonths || '13')
    });
    
    // Calculate per-unit and per-sq-ft costs with proper precision
    const totalSqFt = 26000; // Updated based on realistic sqft for 24 units 
    const totalUnits = 24;
    
    // Update the project with the new cost analysis and totals
    await storage.updateProject(SERENITY_VILLAGE_PROJECT_ID, {
      costAnalysis,
      modularTotalCost: parsedCsv.projectTotals.modularTotal.toString(),
      siteBuiltTotalCost: parsedCsv.projectTotals.siteBuiltTotal.toString(),
      // Ensure percentage fits in precision 5, scale 2 field (max 999.99)
      costSavingsPercent: Math.min(99.99, parsedCsv.projectTotals.costSavingsPercent).toFixed(2),
      modularCostPerSf: (parsedCsv.projectTotals.modularTotal / totalSqFt).toFixed(2),
      siteBuiltCostPerSf: (parsedCsv.projectTotals.siteBuiltTotal / totalSqFt).toFixed(2),
      modularCostPerUnit: (parsedCsv.projectTotals.modularTotal / totalUnits).toFixed(2),
      siteBuiltCostPerUnit: (parsedCsv.projectTotals.siteBuiltTotal / totalUnits).toFixed(2)
    });
    
    console.log('✅ Successfully imported Serenity Village cost data!');
    console.log(`Updated costAnalysis with ${costAnalysis.masterFormatBreakdown.length} breakdown items`);
    console.log(`Cost savings: ${parsedCsv.projectTotals.costSavingsPercent.toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Error importing Serenity Village data:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importSerenityVillageData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { importSerenityVillageData };