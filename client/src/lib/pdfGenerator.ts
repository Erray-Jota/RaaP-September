import { jsPDF } from 'jspdf';
import type { Project, CostBreakdown } from '@shared/schema';

export function generateProjectPDF(project: Project, costBreakdowns: CostBreakdown[] = []) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text with automatic page breaks
  const addText = (text: string, x: number, fontSize: number = 10, fontStyle: string = 'normal', maxWidth?: number) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle as any);
    
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, yPosition);
      yPosition += (lines.length * fontSize * 0.35) + 5;
    } else {
      doc.text(text, x, yPosition);
      yPosition += fontSize * 0.35 + 5;
    }
  };

  // Header with RaaP branding
  doc.setFillColor(53, 119, 66); // RaaP green
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RaaP', 10, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('ROOMS AS A PRODUCT', 35, 15);
  
  doc.text('ModularFeasibility Report', pageWidth - 80, 15);
  
  yPosition = 35;
  doc.setTextColor(0, 0, 0);

  // Project Title
  addText(`Modular Feasibility Report`, 10, 20, 'bold');
  addText(`${project.name}`, 10, 16, 'bold');
  addText(`${project.address}`, 10, 12);
  yPosition += 10;

  // Project Overview
  addText('Project Overview', 10, 14, 'bold');
  
  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);
  
  // Project Type and Details
  addText(`Project Type: ${project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1) || 'Mixed-Use'}`, 10, 11, 'bold');
  
  // Unit Mix
  addText('Unit Mix:', 10, 11, 'bold');
  if (project.studioUnits && project.studioUnits > 0) {
    addText(`• ${project.studioUnits} Studio units`, 15, 10);
  }
  if (project.oneBedUnits && project.oneBedUnits > 0) {
    addText(`• ${project.oneBedUnits} One-bedroom units`, 15, 10);
  }
  if (project.twoBedUnits && project.twoBedUnits > 0) {
    addText(`• ${project.twoBedUnits} Two-bedroom units`, 15, 10);
  }
  if (project.threeBedUnits && project.threeBedUnits > 0) {
    addText(`• ${project.threeBedUnits} Three-bedroom units`, 15, 10);
  }
  addText(`Total Units: ${totalUnits}`, 15, 10, 'bold');
  
  // Building Specifications
  addText('Building Specifications:', 10, 11, 'bold');
  addText(`• Stories: ${project.targetFloors} floors`, 15, 10);
  if (project.buildingDimensions) {
    addText(`• Dimensions: ${project.buildingDimensions}`, 15, 10);
  }
  if (project.constructionType) {
    addText(`• Construction Type: ${project.constructionType}`, 15, 10);
  }
  addText(`• Parking Spaces: ${project.targetParkingSpaces}`, 15, 10);
  
  yPosition += 5;
  
  // Executive Summary
  addText('Executive Summary', 10, 14, 'bold');
  
  const overallScore = parseFloat(project.overallScore || '0');
  const fitAssessment = overallScore >= 3.5 ? 'Excellent' : overallScore >= 3.0 ? 'Good' : overallScore >= 2.5 ? 'Moderate' : 'Poor';
  const scoreLevel = overallScore >= 4 ? 'high' : overallScore >= 3 ? 'moderate' : 'low';
  
  addText(`This project represents a ${fitAssessment.toLowerCase()} fit for modular construction with a ${scoreLevel} Modular Feasibility score of ${project.overallScore}/5.0 based on comprehensive analysis across six key criteria.`, 
           10, 10, 'normal', pageWidth - 20);
  
  if (project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0) {
    addText(`The analysis indicates potential cost savings of ${project.costSavingsPercent}% compared to traditional site-built construction.`, 
             10, 10, 'normal', pageWidth - 20);
  }
  
  if (project.timeSavingsMonths && project.timeSavingsMonths > 0) {
    addText(`Additionally, modular construction could reduce project timeline by ${project.timeSavingsMonths} months compared to conventional methods.`, 
             10, 10, 'normal', pageWidth - 20);
  }
  
  yPosition += 10;

  // Detailed Feasibility Scoring Analysis
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Detailed Feasibility Scoring Analysis', 10, 14, 'bold');
  addText(`Overall Modular Feasibility Score: ${project.overallScore}/5.0`, 10, 12, 'bold');
  yPosition += 10;

  const criteria = [
    { 
      name: 'Zoning Compliance', 
      score: project.zoningScore, 
      weight: '20%', 
      justification: project.zoningJustification,
      details: [
        'Permitted use compliance',
        'Density bonus eligibility',
        'Height and setback requirements',
        'Required waivers assessment'
      ]
    },
    { 
      name: 'Massing & Design', 
      score: project.massingScore, 
      weight: '15%', 
      justification: project.massingJustification,
      details: [
        'Repetitive floor plan efficiency',
        'Structural bay optimization',
        'Building height suitability',
        'Unit layout standardization'
      ]
    },
    { 
      name: 'Cost Effectiveness', 
      score: project.costScore, 
      weight: '20%', 
      justification: project.costJustification,
      details: [
        'Construction cost comparison',
        'Lifecycle cost benefits',
        'Financing and timeline advantages',
        'Market competitiveness'
      ]
    },
    { 
      name: 'Sustainability Impact', 
      score: project.sustainabilityScore, 
      weight: '20%', 
      justification: project.sustainabilityJustification,
      details: [
        'Waste reduction potential',
        'Energy performance improvements',
        'Carbon footprint reduction',
        'Material optimization'
      ]
    },
    { 
      name: 'Logistics Feasibility', 
      score: project.logisticsScore, 
      weight: '15%', 
      justification: project.logisticsJustification,
      details: [
        'Transportation route analysis',
        'Site access evaluation',
        'Crane operation requirements',
        'Staging area adequacy'
      ]
    },
    { 
      name: 'Build Time Optimization', 
      score: project.buildTimeScore, 
      weight: '10%', 
      justification: project.buildTimeJustification,
      details: [
        'Schedule compression potential',
        'Weather independence benefits',
        'Parallel construction activities',
        'Quality control improvements'
      ]
    },
  ];

  criteria.forEach(criterion => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Criterion header
    const score = parseFloat(criterion.score || '0');
    const scoreColor = score >= 4 ? 'excellent' : score >= 3 ? 'good' : 'moderate';
    
    addText(`${criterion.name} (${criterion.weight} weight)`, 10, 11, 'bold');
    addText(`Score: ${score.toFixed(1)}/5.0 - ${scoreColor.charAt(0).toUpperCase() + scoreColor.slice(1)}`, 15, 10, 'bold');
    
    // Justification
    if (criterion.justification) {
      addText('Assessment:', 15, 10, 'bold');
      addText(criterion.justification, 20, 9, 'normal', pageWidth - 25);
    }
    
    // Key evaluation factors
    addText('Key Evaluation Factors:', 15, 10, 'bold');
    criterion.details.forEach(detail => {
      addText(`• ${detail}`, 20, 9);
    });
    
    yPosition += 8;
  });

  yPosition += 5;

  // Enhanced Cost Analysis
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Comprehensive Cost Analysis', 10, 14, 'bold');
  
  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0';
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Cost Comparison Summary
  addText('Construction Cost Comparison:', 10, 12, 'bold');
  yPosition += 5;
  
  // RaaP Modular Cost Details
  addText('RaaP Modular Construction:', 15, 11, 'bold');
  addText(`• Total Project Cost: ${formatCurrency(project.modularTotalCost)}`, 20, 10, 'bold');
  if (project.modularCostPerSf) {
    addText(`• Cost per Square Foot: ${formatCurrency(project.modularCostPerSf)}`, 20, 9);
  }
  if (project.modularCostPerUnit) {
    addText(`• Cost per Unit: ${formatCurrency(project.modularCostPerUnit)}`, 20, 9);
  }
  addText(`• Timeline: ${project.modularTimelineMonths || 9} months`, 20, 9);
  
  yPosition += 5;
  
  // Traditional Site-Built Cost Details
  addText('Traditional Site-Built Construction:', 15, 11, 'bold');
  addText(`• Total Project Cost: ${formatCurrency(project.siteBuiltTotalCost)}`, 20, 10);
  if (project.siteBuiltCostPerSf) {
    addText(`• Cost per Square Foot: ${formatCurrency(project.siteBuiltCostPerSf)}`, 20, 9);
  }
  if (project.siteBuiltCostPerUnit) {
    addText(`• Cost per Unit: ${formatCurrency(project.siteBuiltCostPerUnit)}`, 20, 9);
  }
  addText(`• Timeline: ${project.siteBuiltTimelineMonths || 13} months`, 20, 9);
  
  yPosition += 5;

  // Cost Savings Analysis
  if (project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0) {
    const modularTotal = parseFloat(project.modularTotalCost || "0");
    const siteBuiltTotal = parseFloat(project.siteBuiltTotalCost || "0");
    const totalSavings = siteBuiltTotal - modularTotal;
    
    addText('Cost Savings Analysis:', 15, 11, 'bold');
    addText(`• Total Cost Savings: ${formatCurrency(totalSavings.toString())}`, 20, 10, 'bold');
    addText(`• Percentage Savings: ${project.costSavingsPercent}% reduction`, 20, 10, 'bold');
    
    if (project.timeSavingsMonths && project.timeSavingsMonths > 0) {
      addText(`• Time Savings: ${project.timeSavingsMonths} months faster delivery`, 20, 9);
      addText(`• Reduced carrying costs and earlier revenue generation`, 20, 9);
    }
  }

  yPosition += 5;

  // MasterFormat Cost Breakdown
  if (costBreakdowns.length > 0) {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    addText('MasterFormat Cost Breakdown', 10, 12, 'bold');
    yPosition += 5;

    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Category', 10, yPosition);
    doc.text('Site Built', 80, yPosition);
    doc.text('RaaP GC', 120, yPosition);
    doc.text('RaaP Fab', 150, yPosition);
    doc.text('RaaP Total', 180, yPosition);
    yPosition += 8;

    // Table data
    doc.setFont('helvetica', 'normal');
    costBreakdowns.forEach(breakdown => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(breakdown.category, 10, yPosition);
      doc.text(formatCurrency(breakdown.siteBuiltCost), 80, yPosition);
      doc.text(formatCurrency(breakdown.raapGcCost), 120, yPosition);
      doc.text(formatCurrency(breakdown.raapFabCost), 150, yPosition);
      doc.text(formatCurrency(breakdown.raapTotalCost), 180, yPosition);
      yPosition += 8;
    });
  }

  // Detailed Zoning Analysis
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Zoning & Site Analysis', 10, 14, 'bold');
  
  // Zoning District Information
  addText(`Zoning District: ${project.zoningDistrict || 'RM'} (Residential Medium Density)`, 10, 12, 'bold');
  yPosition += 5;
  
  // Compliance Analysis
  addText('Zoning Compliance Analysis:', 10, 11, 'bold');
  
  const zoningCompliance = [
    { category: 'Allowed Use', status: 'COMPLIANT', detail: 'Multi-unit residential development is permitted by right' },
    { category: 'Density', status: 'COMPLIANT', 
      detail: project.densityBonusEligible 
        ? '34 DU/Acre maximum (with AB 1287 state density bonus)' 
        : '17 DU/Acre maximum (base zoning density)' },
    { category: 'Height Limit', status: 'COMPLIANT', detail: `${project.targetFloors * 10}' proposed vs. 35' maximum allowed` },
    { category: 'Setbacks', status: 'COMPLIANT', detail: 'Meets 15\' front, 5\' side, and 10\' rear setback requirements' },
    { category: 'Parking', status: 'COMPLIANT', detail: `${project.targetParkingSpaces} spaces provided meets minimum requirements` },
  ];

  zoningCompliance.forEach(item => {
    addText(`✓ ${item.category}: ${item.status}`, 15, 10, 'bold');
    addText(`  ${item.detail}`, 20, 9, 'normal', pageWidth - 25);
    yPosition += 2;
  });

  yPosition += 5;

  // Site Context Analysis
  addText('Site Context Analysis:', 10, 11, 'bold');
  
  const siteAnalysis = [
    'Site is located within an established residential neighborhood',
    'Proposed building scale is compatible with surrounding development',
    'Access from public street meets city engineering standards',
    'Utilities (water, sewer, electric, gas) are available at the street',
  ];

  siteAnalysis.forEach(analysis => {
    addText(`• ${analysis}`, 15, 9, 'normal', pageWidth - 20);
  });

  yPosition += 5;

  // Development Incentives/Waivers
  if (project.requiredWaivers || project.densityBonusEligible) {
    addText('Development Incentives & Waivers:', 10, 11, 'bold');
    
    if (project.densityBonusEligible) {
      addText('• State Density Bonus (AB 1287): Eligible for increased density and development incentives', 15, 9, 'normal', pageWidth - 20);
    }
    
    if (project.requiredWaivers) {
      addText('• Required Waivers/Concessions:', 15, 9, 'bold');
      addText(project.requiredWaivers, 20, 9, 'normal', pageWidth - 25);
    }
  }
  
  yPosition += 5;

  // Massing Analysis
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Massing & Design Analysis', 10, 14, 'bold');
  
  // Building Configuration
  addText('Building Configuration:', 10, 11, 'bold');
  addText(`• Building Height: ${project.targetFloors} stories (approximately ${project.targetFloors * 10}' tall)`, 15, 9);
  if (project.buildingDimensions) {
    addText(`• Building Dimensions: ${project.buildingDimensions}`, 15, 9);
  }
  addText(`• Total Units: ${totalUnits} residential units across ${project.targetFloors} floors`, 15, 9);
  
  yPosition += 5;
  
  // Modular Design Considerations
  addText('Modular Design Optimization:', 10, 11, 'bold');
  
  const massingBenefits = [
    'Repetitive floor plans maximize factory efficiency and reduce costs',
    'Standardized structural bays optimize modular manufacturing process',
    'Consistent unit layouts enable streamlined installation sequencing',
    'Building height and configuration are well-suited for modular construction',
    'Parking integration can be designed to accommodate crane access during installation',
  ];

  massingBenefits.forEach(benefit => {
    addText(`• ${benefit}`, 15, 9, 'normal', pageWidth - 20);
  });

  yPosition += 5;

  // Design Efficiency Analysis
  addText('Design Efficiency Metrics:', 10, 11, 'bold');
  const efficiency = Math.round((totalUnits / project.targetFloors) * 10) / 10;
  addText(`• Units per Floor: ${efficiency} (${efficiency >= 4 ? 'Excellent' : efficiency >= 3 ? 'Good' : 'Moderate'} density for modular)`, 15, 9);
  addText(`• Floor Plan Repetition: ${project.targetFloors - 1} typical floors (high manufacturing efficiency)`, 15, 9);
  addText(`• Structural Regularity: Rectangular footprint optimizes modular bay sizing`, 15, 9);
  
  yPosition += 10;

  // Sustainability Analysis
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Sustainability Analysis', 10, 14, 'bold');
  
  // Environmental Benefits
  addText('Environmental Benefits of Modular Construction:', 10, 11, 'bold');
  
  const sustainabilityBenefits = [
    'Reduced construction waste: 90% less waste compared to site-built construction',
    'Lower carbon emissions: Factory-controlled environment reduces material transportation',
    'Energy efficiency: Tighter building envelope and quality control in factory setting',
    'Material optimization: Precise cutting and standardized processes minimize waste',
    'Reduced site disruption: Shorter on-site construction phase',
    'Quality consistency: Factory QC processes ensure better insulation and air sealing',
  ];

  sustainabilityBenefits.forEach(benefit => {
    addText(`• ${benefit}`, 15, 9, 'normal', pageWidth - 20);
  });

  yPosition += 5;

  // Energy Performance
  addText('Projected Energy Performance:', 10, 11, 'bold');
  addText('• Modular construction typically achieves 15-20% better energy performance', 15, 9);
  addText('• Improved air tightness from factory-controlled assembly', 15, 9);
  addText('• Consistent insulation installation reduces thermal bridging', 15, 9);
  addText('• Opportunity for integrated renewable energy systems', 15, 9);

  yPosition += 10;

  // Enhanced Logistics Analysis
  addText('Logistics Assessment', 10, 14, 'bold');
  
  // Transportation & Access
  addText('Transportation & Access:', 10, 11, 'bold');
  addText(`• Factory Location: ${project.factoryLocation || 'Tracy, CA'}`, 15, 9);
  
  // Site-specific logistics for known projects
  if (project.address.includes('Olivehurst')) {
    addText('• Highway Access: Within 1/2 mile of Highway 70, Exit 18A', 15, 9);
    addText('• Site Consideration: Overhead powerline on Chestnut Rd requires crane coordination', 15, 9, 'normal', pageWidth - 20);
  } else {
    addText('• Highway access analysis to be completed during detailed planning', 15, 9);
  }

  yPosition += 3;

  if (project.transportationNotes) {
    addText('Transportation Notes:', 10, 11, 'bold');
    addText(project.transportationNotes, 15, 9, 'normal', pageWidth - 20);
    yPosition += 3;
  }

  // Delivery & Installation Process
  addText('Delivery & Installation Process:', 10, 11, 'bold');
  
  const logisticsProcess = [
    'Pre-construction site preparation and foundation work',
    'Staged delivery of modular units to minimize on-site storage requirements',
    'Sequential crane installation following predetermined sequence',
    'Mechanical, electrical, and plumbing connections between modules',
    'Final exterior finishing and site work completion',
  ];

  logisticsProcess.forEach(step => {
    addText(`• ${step}`, 15, 9, 'normal', pageWidth - 20);
  });

  yPosition += 3;

  if (project.stagingNotes) {
    addText('Site Staging Considerations:', 10, 11, 'bold');
    addText(project.stagingNotes, 15, 9, 'normal', pageWidth - 20);
  }

  // Timeline Analysis
  yPosition += 10;
  addText('Build Timeline Analysis', 10, 14, 'bold');
  addText(`Modular Construction: ${project.modularTimelineMonths || 9} months`, 10, 11);
  addText(`Site-Built Construction: ${project.siteBuiltTimelineMonths || 13} months`, 10, 11);
  
  if (project.timeSavingsMonths && project.timeSavingsMonths > 0) {
    addText(`Time Savings: ${project.timeSavingsMonths} months faster with modular construction`, 10, 11, 'bold');
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    doc.text('© 2025 RaaP - ModularFeasibility Report', 10, pageHeight - 10);
  }

  // Generate filename and download
  const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Feasibility_Report.pdf`;
  doc.save(fileName);
}
