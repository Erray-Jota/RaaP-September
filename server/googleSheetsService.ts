// Temporarily disabled google sheets import to fix module resolution issue
// import { google } from 'googleapis';

// const SPREADSHEET_ID = '12fsKnG2rKFGpE6DTsLM0uaqFspzVWwCJjrIvbwrDXnk';

export interface SimulatorParams {
  oneBedUnits: number;
  twoBedUnits: number;
  threeBedUnits: number;
  floors: number;
  buildingType: string;
  parkingType: string;
  location: string;
  prevailingWage: boolean;
  siteConditions: string;
}

export interface CostResults {
  totalCost: number;
  costPerSF: number;
  costPerUnit: number;
  modularTotal: number;
  siteBuiltTotal: number;
  savings: number;
  savingsPercent: number;
  breakdown: {
    sitePreparation: number;
    foundation: number;
    modularUnits: number;
    siteAssembly: number;
    mepConnections: number;
    finishWork: number;
    softCosts: number;
  };
}

class GoogleSheetsService {
  // private sheets: any;

  constructor() {
    // Temporarily disabled google sheets authentication
    // this.sheets = google.sheets({ 
    //   version: 'v4', 
    //   auth: process.env.GOOGLE_SHEETS_API_KEY 
    // });
  }

  async updateSimulatorParams(params: SimulatorParams): Promise<CostResults> {
    // Temporarily return static results instead of using Google Sheets
    console.log('Using static results for cost calculation');
    return this.getStaticResults(params);
  }

  // Temporarily removed Google Sheets methods - using static calculation only

  private getStaticResults(params: SimulatorParams): CostResults {
    // Calculate basic adjustments based on parameters for fallback
    const totalUnits = params.oneBedUnits + params.twoBedUnits + params.threeBedUnits;
    const baseTotal = 10800000;
    const floorMultiplier = params.floors / 3; // Base is 3 floors
    const unitMultiplier = totalUnits / 24; // Base is 24 units
    const wageMultiplier = params.prevailingWage ? 1.15 : 1.0;
    
    const adjustedTotal = baseTotal * floorMultiplier * unitMultiplier * wageMultiplier;
    
    return {
      totalCost: Math.round(adjustedTotal),
      costPerSF: Math.round(adjustedTotal / (totalUnits * 800)), // Assuming 800 SF average
      costPerUnit: Math.round(adjustedTotal / totalUnits),
      modularTotal: Math.round(adjustedTotal),
      siteBuiltTotal: Math.round(adjustedTotal * 1.012),
      savings: Math.round(adjustedTotal * 0.012),
      savingsPercent: 1.2,
      breakdown: {
        sitePreparation: Math.round(adjustedTotal * 0.045),
        foundation: Math.round(adjustedTotal * 0.072),
        modularUnits: Math.round(adjustedTotal * 0.574),
        siteAssembly: Math.round(adjustedTotal * 0.085),
        mepConnections: Math.round(adjustedTotal * 0.102),
        finishWork: Math.round(adjustedTotal * 0.077),
        softCosts: Math.round(adjustedTotal * 0.045),
      },
    };
  }
}

export default new GoogleSheetsService();