// Types based on the costAnalysis schema from projects table
type CostAnalysisBreakdown = {
  category: string;
  categoryCode: string;
  siteBuiltCost: number;
  modularGcCost: number;
  modularFabCost: number;
  modularTotalCost: number;
  modularCostPerSf: number;
};

type CostAnalysis = {
  masterFormatBreakdown: CostAnalysisBreakdown[];
  detailedMetrics: {
    modularConstruction: {
      designPhaseMonths: number;
      fabricationMonths: number;
      siteWorkMonths: number;
    };
    siteBuiltConstruction: {
      designPhaseMonths: number;
      constructionMonths: number;
    };
    comparison: {
      costSavingsAmount: number;
      timeSavingsMonths: number;
      timeSavingsPercent: number;
    };
  };
  pricingValidation: {
    isComplete: boolean;
    validatedBy: string;
    validatedAt: string; // ISO string
    notes: string;
  };
};

export interface CsvRow {
  category: string;
  siteBuiltCost: number;
  siteBuiltCostPerSf: number;
  modularGcCost: number;
  modularFabCost: number;
  modularTotalCost: number;
  modularCostPerSf: number;
  savings: number;
}

export interface ParsedCsv {
  masterFormatBreakdown: CsvRow[];
  projectTotals: {
    siteBuiltTotal: number;
    modularTotal: number;
    savings: number;
    costSavingsPercent: number;
  };
}

// Helper function to clean currency strings and convert to numbers
function parseCurrency(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove quotes, dollar signs, commas, and whitespace
  let cleaned = value.replace(/["$,\s]/g, '');
  
  // Handle parentheses for negative numbers
  const isNegative = cleaned.includes('(') && cleaned.includes(')');
  if (isNegative) {
    cleaned = cleaned.replace(/[()]/g, '');
  }
  
  const number = parseFloat(cleaned);
  return isNaN(number) ? 0 : (isNegative ? -number : number);
}

// Helper function to normalize category names
function normalizeCategory(category: string): string {
  return category.replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

// Helper function to check if a row is a section header
function isSectionHeader(category: string): boolean {
  const sectionHeaders = [
    'Concrete, Masonry & Metals',
    'Rooms', 
    'Equipment & Special Construction',
    'MEPs',
    'Site Work',
    'GC Charges'
  ];
  
  const normalizedCategory = normalizeCategory(category);
  return sectionHeaders.some(header => 
    normalizedCategory.toLowerCase().includes(header.toLowerCase())
  );
}

// Improved CSV parser that handles quoted fields properly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
    i++;
  }
  
  result.push(currentField.trim());
  return result;
}

export function parseCostBreakdownCsv(csvContent: string): ParsedCsv {
  const lines = csvContent.split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim() !== '');
  
  const masterFormatBreakdown: CsvRow[] = [];
  let projectTotalsRow: CsvRow | null = null;
  
  for (const line of dataLines) {
    // Parse CSV line using proper CSV parsing
    const columns = parseCSVLine(line);
    
    if (columns.length < 8) continue; // Skip incomplete rows
    
    const category = normalizeCategory(columns[0]);
    
    // Skip empty categories
    if (!category) continue;
    
    // Handle PROJECT TOTAL row separately
    if (category.toLowerCase().includes('project total')) {
      projectTotalsRow = {
        category,
        siteBuiltCost: parseCurrency(columns[1]),
        siteBuiltCostPerSf: parseCurrency(columns[2]),
        modularGcCost: parseCurrency(columns[3]),
        modularFabCost: parseCurrency(columns[4]),
        modularTotalCost: parseCurrency(columns[5]),
        modularCostPerSf: parseCurrency(columns[6]),
        savings: parseCurrency(columns[7])
      };
      continue;
    }
    
    // Parse the row
    const rowData: CsvRow = {
      category,
      siteBuiltCost: parseCurrency(columns[1]),
      siteBuiltCostPerSf: parseCurrency(columns[2]),
      modularGcCost: parseCurrency(columns[3]),
      modularFabCost: parseCurrency(columns[4]),
      modularTotalCost: parseCurrency(columns[5]),
      modularCostPerSf: parseCurrency(columns[6]),
      savings: parseCurrency(columns[7])
    };
    
    // Only include line items (not section headers) in breakdown
    if (!isSectionHeader(category)) {
      masterFormatBreakdown.push(rowData);
    }
  }
  
  // Calculate project totals from data or use PROJECT TOTAL row
  let projectTotals;
  if (projectTotalsRow) {
    const costSavingsPercent = projectTotalsRow.siteBuiltCost > 0 
      ? (projectTotalsRow.savings / projectTotalsRow.siteBuiltCost) * 100 
      : 0;
      
    projectTotals = {
      siteBuiltTotal: projectTotalsRow.siteBuiltCost,
      modularTotal: projectTotalsRow.modularTotalCost,
      savings: projectTotalsRow.savings,
      costSavingsPercent: Math.max(0, costSavingsPercent)
    };
  } else {
    // Calculate totals from breakdown data
    const siteBuiltTotal = masterFormatBreakdown.reduce((sum, row) => sum + row.siteBuiltCost, 0);
    const modularTotal = masterFormatBreakdown.reduce((sum, row) => sum + row.modularTotalCost, 0);
    const savings = siteBuiltTotal - modularTotal;
    const costSavingsPercent = siteBuiltTotal > 0 ? (savings / siteBuiltTotal) * 100 : 0;
    
    projectTotals = {
      siteBuiltTotal,
      modularTotal,
      savings,
      // Ensure percentage is within database limits (precision 5, scale 2 = max 999.99)
      costSavingsPercent: Math.min(999.99, Math.max(0, costSavingsPercent))
    };
  }
  
  return {
    masterFormatBreakdown,
    projectTotals
  };
}

// Helper function to extract category code from category name (e.g., "03 Concrete" -> "03")
function extractCategoryCode(category: string): string {
  const match = category.match(/^\s*(\d{2})\s/);
  return match ? match[1] : '';
}

// Convert parsed CSV data to CostAnalysis format
export function createCostAnalysisFromCsv(parsedCsv: ParsedCsv, project: { modularTimelineMonths: number; siteBuiltTimelineMonths: number }): CostAnalysis {
  return {
    masterFormatBreakdown: parsedCsv.masterFormatBreakdown.map(row => ({
      category: row.category,
      categoryCode: extractCategoryCode(row.category),
      siteBuiltCost: row.siteBuiltCost,
      modularGcCost: row.modularGcCost,
      modularFabCost: row.modularFabCost,
      modularTotalCost: row.modularTotalCost,
      modularCostPerSf: row.modularCostPerSf
    })),
    detailedMetrics: {
      modularConstruction: {
        designPhaseMonths: Math.round(project.modularTimelineMonths * 0.3), // 30% for design
        fabricationMonths: Math.round(project.modularTimelineMonths * 0.4), // 40% for fabrication
        siteWorkMonths: Math.round(project.modularTimelineMonths * 0.3), // 30% for site work
      },
      siteBuiltConstruction: {
        designPhaseMonths: Math.round(project.siteBuiltTimelineMonths * 0.25), // 25% for design
        constructionMonths: Math.round(project.siteBuiltTimelineMonths * 0.75), // 75% for construction
      },
      comparison: {
        costSavingsAmount: parsedCsv.projectTotals.savings,
        timeSavingsMonths: project.siteBuiltTimelineMonths - project.modularTimelineMonths,
        timeSavingsPercent: parsedCsv.projectTotals.costSavingsPercent
      }
    },
    pricingValidation: {
      isComplete: true,
      validatedBy: 'CSV Import',
      validatedAt: new Date().toISOString(),
      notes: 'Cost data imported from CSV file'
    }
  };
}