#!/usr/bin/env tsx

/**
 * Data Migration Script: Cost Breakdown Consolidation
 * 
 * This script migrates existing cost breakdown data from the separate 
 * costBreakdowns table into the unified costAnalysis JSON field in the projects table.
 * 
 * Run with: npx tsx server/migrate-cost-data.ts
 */

import { db } from "./db";
import { projects, costBreakdowns } from "@shared/schema";
import { eq } from "drizzle-orm";

async function migrateCostData() {
  console.log("🔄 Starting cost data migration...");
  
  try {
    // Get all projects
    const allProjects = await db.select().from(projects);
    console.log(`📊 Found ${allProjects.length} projects to process`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const project of allProjects) {
      // Skip if costAnalysis already exists and has data
      if (project.costAnalysis && 
          project.costAnalysis.masterFormatBreakdown && 
          project.costAnalysis.masterFormatBreakdown.length > 0) {
        console.log(`⏭️  Project ${project.name} already has unified cost data, skipping`);
        skippedCount++;
        continue;
      }
      
      // Get cost breakdowns for this project
      const projectCostBreakdowns = await db
        .select()
        .from(costBreakdowns)
        .where(eq(costBreakdowns.projectId, project.id));
      
      if (projectCostBreakdowns.length === 0) {
        console.log(`ℹ️  Project ${project.name} has no cost breakdown data to migrate`);
        skippedCount++;
        continue;
      }
      
      // Transform cost breakdown data to unified structure
      const masterFormatBreakdown = projectCostBreakdowns.map(breakdown => ({
        category: breakdown.category,
        categoryCode: breakdown.category.split(' - ')[0] || breakdown.category, // Extract code if format is "Code - Description"
        siteBuiltCost: parseFloat(breakdown.siteBuiltCost || "0"),
        modularGcCost: parseFloat(breakdown.raapGcCost || "0"),
        modularFabCost: parseFloat(breakdown.raapFabCost || "0"), 
        modularTotalCost: parseFloat(breakdown.raapTotalCost || "0"),
        modularCostPerSf: 0 // Will be calculated if needed
      }));
      
      // Calculate totals for comparison metrics
      const siteBuiltTotal = masterFormatBreakdown.reduce((sum, item) => sum + item.siteBuiltCost, 0);
      const modularTotal = masterFormatBreakdown.reduce((sum, item) => sum + item.modularTotalCost, 0);
      const costSavingsAmount = siteBuiltTotal - modularTotal;
      const timeSavingsMonths = parseFloat(project.timeSavingsMonths || "0");
      
      // Create unified cost analysis structure
      const unifiedCostAnalysis = {
        masterFormatBreakdown,
        detailedMetrics: {
          modularConstruction: {
            designPhaseMonths: parseFloat(project.modularTimelineMonths || "0") * 0.3, // Estimated 30% for design
            fabricationMonths: parseFloat(project.modularTimelineMonths || "0") * 0.5, // Estimated 50% for fabrication
            siteWorkMonths: parseFloat(project.modularTimelineMonths || "0") * 0.2 // Estimated 20% for site work
          },
          siteBuiltConstruction: {
            designPhaseMonths: parseFloat(project.siteBuiltTimelineMonths || "0") * 0.2, // Estimated 20% for design
            constructionMonths: parseFloat(project.siteBuiltTimelineMonths || "0") * 0.8 // Estimated 80% for construction
          },
          comparison: {
            costSavingsAmount,
            timeSavingsMonths,
            timeSavingsPercent: project.siteBuiltTimelineMonths ? 
              (timeSavingsMonths / parseFloat(project.siteBuiltTimelineMonths)) * 100 : 0
          }
        },
        pricingValidation: {
          isComplete: project.pricingValidationComplete || false,
          validatedBy: project.finalSelectedFabricator || "System Migration",
          validatedAt: new Date().toISOString(),
          notes: `Migrated from legacy cost breakdown data on ${new Date().toLocaleDateString()}`
        }
      };
      
      // Update project with unified cost analysis
      await db
        .update(projects)
        .set({ costAnalysis: unifiedCostAnalysis })
        .where(eq(projects.id, project.id));
      
      console.log(`✅ Migrated cost data for project: ${project.name} (${projectCostBreakdowns.length} cost items)`);
      migratedCount++;
    }
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📈 Projects migrated: ${migratedCount}`);
    console.log(`⏭️  Projects skipped: ${skippedCount}`);
    console.log(`📊 Total projects: ${allProjects.length}`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCostData()
    .then(() => {
      console.log("✨ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateCostData };