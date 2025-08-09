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

  // Executive Summary
  addText('Executive Summary', 10, 14, 'bold');
  
  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);
  
  const recommendations = [
    `• Total ${totalUnits} units (${project.oneBedUnits || 0} x 1BR, ${project.twoBedUnits || 0} x 2BR, ${project.threeBedUnits || 0} x 3BR units)`,
    project.buildingDimensions ? `• Dimensions: ${project.buildingDimensions}` : `• ${project.targetFloors} floors`,
    project.constructionType ? `• Construction Type: ${project.constructionType}` : '',
    `• Total Parking Spaces: ${project.targetParkingSpaces}`,
  ].filter(Boolean);

  recommendations.forEach(rec => addText(rec, 10, 10, 'normal', pageWidth - 20));
  
  const overallScore = parseFloat(project.overallScore || '0');
  const fitAssessment = overallScore >= 3.5 ? 'Good fit' : 'Moderate fit';
  const scoreLevel = overallScore >= 4 ? 'high' : 'moderate';
  
  addText(`${fitAssessment} for modular construction with a ${scoreLevel} Modular Feasibility score of ${project.overallScore}/5 based on the six criteria below.`, 
           10, 10, 'normal', pageWidth - 20);
  
  yPosition += 10;

  // Scoring Summary Table
  addText('Feasibility Criteria Assessment', 10, 14, 'bold');
  yPosition += 5;

  const criteria = [
    { name: 'Zoning', score: project.zoningScore, weight: '20%', justification: project.zoningJustification },
    { name: 'Massing', score: project.massingScore, weight: '15%', justification: project.massingJustification },
    { name: 'Cost', score: project.costScore, weight: '20%', justification: project.costJustification },
    { name: 'Sustainability', score: project.sustainabilityScore, weight: '20%', justification: project.sustainabilityJustification },
    { name: 'Logistics', score: project.logisticsScore, weight: '15%', justification: project.logisticsJustification },
    { name: 'Build Time', score: project.buildTimeScore, weight: '10%', justification: project.buildTimeJustification },
  ];

  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Criteria', 10, yPosition);
  doc.text('Weight', 60, yPosition);
  doc.text('Score', 85, yPosition);
  doc.text('Justification', 110, yPosition);
  yPosition += 5;

  // Table data
  doc.setFont('helvetica', 'normal');
  criteria.forEach(criterion => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(criterion.name, 10, yPosition);
    doc.text(criterion.weight, 60, yPosition);
    doc.text(parseFloat(criterion.score || '0').toFixed(1), 85, yPosition);
    
    const justificationLines = doc.splitTextToSize(criterion.justification || '', 90);
    doc.text(justificationLines, 110, yPosition);
    yPosition += Math.max(12, justificationLines.length * 4);
  });

  yPosition += 10;

  // Cost Analysis
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Cost Analysis', 10, 14, 'bold');
  
  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0';
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  addText(`RaaP Modular Construction: ${formatCurrency(project.modularTotalCost)}`, 10, 11, 'bold');
  if (project.modularCostPerSf && project.modularCostPerUnit) {
    addText(`${formatCurrency(project.modularCostPerSf)}/sf • ${formatCurrency(project.modularCostPerUnit)}/unit`, 10, 10);
  }

  addText(`Traditional Site-Built: ${formatCurrency(project.siteBuiltTotalCost)}`, 10, 11, 'bold');
  if (project.siteBuiltCostPerSf && project.siteBuiltCostPerUnit) {
    addText(`${formatCurrency(project.siteBuiltCostPerSf)}/sf • ${formatCurrency(project.siteBuiltCostPerUnit)}/unit`, 10, 10);
  }

  if (project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0) {
    addText(`Cost Savings: ${project.costSavingsPercent}% savings with modular construction`, 10, 11, 'bold');
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

  // Zoning Analysis
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  addText('Zoning & Site Analysis', 10, 14, 'bold');
  addText(`Zoning District: ${project.zoningDistrict || 'RM'} (Residential Medium Density)`, 10, 11, 'bold');
  
  const zoningDetails = [
    '• Multi-unit Development Permitted',
    project.densityBonusEligible ? '• Density Bonus Eligible (AB 1287)' : '• Standard Density Requirements',
    '• 35\' max Building Height',
    '• 15\' Front, 5\' Side, 10\' Rear Setbacks',
  ];

  zoningDetails.forEach(detail => addText(detail, 10, 10));

  if (project.requiredWaivers) {
    addText('Required Waivers & Concessions:', 10, 11, 'bold');
    addText(project.requiredWaivers, 10, 10, 'normal', pageWidth - 20);
  }

  // Logistics Analysis
  yPosition += 10;
  addText('Logistics Assessment', 10, 14, 'bold');
  addText(`Factory Location: ${project.factoryLocation || 'Tracy, CA'}`, 10, 11, 'bold');
  
  if (project.transportationNotes) {
    addText('Transportation Notes:', 10, 11, 'bold');
    addText(project.transportationNotes, 10, 10, 'normal', pageWidth - 20);
  }

  if (project.stagingNotes) {
    addText('Staging Notes:', 10, 11, 'bold');
    addText(project.stagingNotes, 10, 10, 'normal', pageWidth - 20);
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
