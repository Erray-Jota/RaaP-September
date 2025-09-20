import type { Project, CostBreakdown } from '@shared/schema';

export interface CostTotals {
  siteBuiltTotal: number;
  modularTotal: number;
  savings: number;
  costSavingsPercent: number;
  modularCostPerSf: number;
  siteBuiltCostPerSf: number;
  modularCostPerUnit: number;
  siteBuiltCostPerUnit: number;
  totalSqFt: number;
  totalUnits: number;
}

/**
 * Helper function to safely parse currency/number strings
 * Handles commas, dollar signs, parentheses, and other formatting
 */
function safeParseNumber(value: string | null | undefined): number {
  if (!value) return 0;
  
  const str = value.toString();
  
  // Check if parentheses indicate negative value (accounting format)
  const isNegative = /\(.*\)/.test(str);
  
  // Remove common formatting: $, commas, spaces, parentheses
  const cleaned = str
    .replace(/[$,\s()]/g, '')
    .replace(/[^\d.-]/g, '');
    
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  
  return isNegative ? -Math.abs(num) : num;
}

/**
 * SINGLE SOURCE OF TRUTH for cost calculations
 * Calculates all cost metrics from MasterFormat breakdown data
 * This ensures consistency across the entire application
 */
export function calculateCostTotals(project: Project, costBreakdowns: CostBreakdown[]): CostTotals {
  // Ensure we have stable defaults
  const safeProject = project || {} as Project;
  const safeCostBreakdowns = costBreakdowns || [];
    // Calculate total units
    const totalUnits = (safeProject.studioUnits || 0) + (safeProject.oneBedUnits || 0) + 
                      (safeProject.twoBedUnits || 0) + (safeProject.threeBedUnits || 0);
    
    // Calculate total square footage from project data
    const getTotalSqFt = (): number => {
      // Try to parse building dimensions if available (e.g., "146' X 66'")
      if (safeProject.buildingDimensions) {
        const match = safeProject.buildingDimensions.match(/(\d+)'?\s*[xX×]\s*(\d+)'/);
        if (match) {
          const width = parseInt(match[1]);
          const height = parseInt(match[2]);
          return width * height;
        }
      }
      
      // Estimate total sq ft based on units (assuming ~720 sq ft average per unit)
      // This is a reasonable default for multifamily residential
      if (totalUnits > 0) {
        return totalUnits * 720;
      }
      
      // Final fallback
      return 17360;
    };

    const totalSqFt = getTotalSqFt();

    // Return zero values if no cost breakdown data
    if (!safeCostBreakdowns || safeCostBreakdowns.length === 0) {
      return {
        siteBuiltTotal: 0,
        modularTotal: 0,
        savings: 0,
        costSavingsPercent: 0,
        modularCostPerSf: 0,
        siteBuiltCostPerSf: 0,
        modularCostPerUnit: 0,
        siteBuiltCostPerUnit: 0,
        totalSqFt,
        totalUnits
      };
    }

    // Calculate totals from MasterFormat breakdown data using safe parsing
    const siteBuiltTotal = safeCostBreakdowns.reduce((sum, breakdown) => {
      return sum + safeParseNumber(breakdown.siteBuiltCost);
    }, 0);
    
    const modularTotal = safeCostBreakdowns.reduce((sum, breakdown) => {
      return sum + safeParseNumber(breakdown.raapTotalCost);
    }, 0);
    
    const savings = siteBuiltTotal - modularTotal;
    const costSavingsPercent = siteBuiltTotal > 0 ? ((savings / siteBuiltTotal) * 100) : 0;

    // Calculate per-unit and per-sf from actual breakdown totals
    const modularCostPerSf = totalSqFt > 0 ? modularTotal / totalSqFt : 0;
    const siteBuiltCostPerSf = totalSqFt > 0 ? siteBuiltTotal / totalSqFt : 0;
    const modularCostPerUnit = totalUnits > 0 ? modularTotal / totalUnits : 0;
    const siteBuiltCostPerUnit = totalUnits > 0 ? siteBuiltTotal / totalUnits : 0;

  return {
    siteBuiltTotal,
    modularTotal,
    savings,
    costSavingsPercent,
    modularCostPerSf,
    siteBuiltCostPerSf,
    modularCostPerUnit,
    siteBuiltCostPerUnit,
    totalSqFt,
    totalUnits
  };
}

/**
 * Hook wrapper for calculateCostTotals to maintain compatibility
 * This is now just a simple wrapper around the calculation function
 */
export function useCostTotals(project: Project, costBreakdowns: CostBreakdown[]): CostTotals {
  return calculateCostTotals(project, costBreakdowns);
}

/**
 * Helper function to format currency values
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Helper function to calculate cost per square foot
 * Uses the same project-based calculation logic for consistency
 */
export function calculateCostPerSf(cost: number, project: Project): string {
  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);
  
  let totalSqFt = 17360; // fallback
  
  if (project.buildingDimensions) {
    const match = project.buildingDimensions.match(/(\d+)'?\s*[xX×]\s*(\d+)'/);
    if (match) {
      totalSqFt = parseInt(match[1]) * parseInt(match[2]);
    }
  } else if (totalUnits > 0) {
    totalSqFt = totalUnits * 720;
  }
  
  if (totalSqFt === 0) return '$0';
  return `$${Math.round(cost / totalSqFt)}`;
}