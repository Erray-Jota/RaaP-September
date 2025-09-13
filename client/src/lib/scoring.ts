// Shared scoring utilities for consistent score generation across components

// Seeded random number generator (mulberry32) for deterministic score generation
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Create a seed from project ID for consistent scores
function createSeed(projectId: number): number {
  return Math.abs(projectId * 31415927) % 2147483647;
}

// Sample project detection - centralized logic
export function isSampleProject(projectName: string): boolean {
  const sampleProjectNames = ["Serenity Village", "Mountain View Apartments", "University Housing Complex", "Workforce Commons"];
  return sampleProjectNames.includes(projectName);
}

// Generate deterministic random score for NEW projects
export function generateDeterministicScore(projectId: number): string {
  const rng = mulberry32(createSeed(projectId));
  return (rng() * 0.6 + 4.4).toFixed(1);
}

// Calculate feasibility scores for a project (deterministic for NEW projects)
export function calculateProjectScores(projectId: number, projectName: string, storedOverallScore?: string) {
  if (isSampleProject(projectName)) {
    // Use original stored scores for sample projects
    return {
      overall: storedOverallScore || "4.0",
      individual: {
        zoning: "4.0",
        massing: "4.0", 
        sustainability: "4.0",
        cost: "4.0",
        logistics: "4.0",
        buildTime: "4.0"
      }
    };
  } else {
    // Generate deterministic scores for NEW projects using seeded random
    const rng = mulberry32(createSeed(projectId));
    const scores = {
      zoning: (rng() * 0.6 + 4.4).toFixed(1),
      massing: (rng() * 0.6 + 4.4).toFixed(1),
      sustainability: (rng() * 0.6 + 4.4).toFixed(1),
      cost: (rng() * 0.6 + 4.4).toFixed(1),
      logistics: (rng() * 0.6 + 4.4).toFixed(1),
      buildTime: (rng() * 0.6 + 4.4).toFixed(1)
    };
    
    // Calculate weighted overall score
    const overall = ((parseFloat(scores.zoning) * 0.2) + 
                    (parseFloat(scores.massing) * 0.15) + 
                    (parseFloat(scores.sustainability) * 0.2) + 
                    (parseFloat(scores.cost) * 0.2) + 
                    (parseFloat(scores.logistics) * 0.15) + 
                    (parseFloat(scores.buildTime) * 0.1)).toFixed(1);
    
    return {
      overall,
      individual: scores
    };
  }
}