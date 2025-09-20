import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight,
  Download, 
  MapPin, 
  Building, 
  FileText, 
  Leaf, 
  DollarSign, 
  Truck, 
  Clock,
  CheckCircle,
  Home,
  Layout,
  Layers,
  Map
} from "lucide-react";
import ProjectSiteMap from "@/components/ProjectSiteMap";
import RouteMap from "@/components/RouteMap";
import { generateProjectPDF } from "@/lib/pdfGenerator";
import type { Project, CostBreakdown } from "@shared/schema";
// Removed calculateProjectScores import - using database values directly

// Helper function to format currency values
function formatCurrency(value: number | string | null | undefined): string {
  if (!value) return '$0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0';
  return numValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Helper function to format numbers
function formatNumber(value: number | string | null | undefined): string {
  if (!value) return '0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';
  return numValue.toLocaleString('en-US');
}

// Helper function to calculate cost savings amount
function calculateCostSavings(siteBuilt: number | string | null | undefined, modular: number | string | null | undefined): number {
  const siteBuiltNum = typeof siteBuilt === 'string' ? parseFloat(siteBuilt) : (siteBuilt || 0);
  const modularNum = typeof modular === 'string' ? parseFloat(modular) : (modular || 0);
  return Math.max(0, siteBuiltNum - modularNum);
}

// Helper function to get cost breakdown data by category
function getCostBreakdownByCategory(costBreakdowns: CostBreakdown[] | undefined, category: string): CostBreakdown | null {
  if (!costBreakdowns) return null;
  return costBreakdowns.find(cb => cb.category === category) || null;
}

// Helper function to calculate per square foot cost  
function calculateCostPerSf(totalCost: string | null | undefined, totalSqFt: number = 17360): string {
  if (!totalCost) return '$0';
  const cost = parseFloat(totalCost);
  if (isNaN(cost) || totalSqFt === 0) return '$0';
  return `$${Math.round(cost / totalSqFt)}`;
}

// Helper function to format cost values for mobile display
function formatCostForMobile(costStr: string): string {
  // Remove currency symbols and parentheses
  const cleanStr = costStr.replace(/[\$,()]/g, '');
  const isNegative = costStr.includes('(') || costStr.includes('-');
  const numValue = parseFloat(cleanStr);
  
  if (isNaN(numValue)) return costStr;
  
  let formatted;
  if (Math.abs(numValue) >= 1000000) {
    formatted = `$${(numValue / 1000000).toFixed(1)}M`;
  } else if (Math.abs(numValue) >= 1000) {
    formatted = `$${Math.round(numValue / 1000)}K`;
  } else {
    formatted = `$${Math.round(numValue)}`;
  }
  
  return isNegative ? `(${formatted})` : formatted;
}

// Mobile responsive currency cell component
const MobileCurrencyCell: React.FC<{ amount: number | string; className?: string }> = ({ amount, className = "" }) => {
  const formatted = formatCurrency(amount);
  return (
    <td className={`px-3 py-2 text-right ${className}`}>
      <span className="sm:hidden">{formatCostForMobile(formatted)}</span>
      <span className="hidden sm:inline">{formatted}</span>
    </td>
  );
};

// Import generated images for Massing tab
import vallejoFloorPlanImage from "@assets/Vallejo Floor Plan 2_1757773129441.png";
import vallejoBuildingRenderingImage from "@assets/Vallejo Building 2_1757773134770.png";
import vallejoSitePlanImage from "@assets/Vallejo Site 2_1757773140827.png";
import serenityFloorPlanImage from "@assets/Mutual Floor Plan_1757785148171.png";
import serenityBuildingRenderingImage from "@assets/Mutual Building 3_1757785148170.png";
import serenitySitePlanImage from "@assets/Mutual SIte Plan_1757785148169.png";
import unitPlansImage from "@assets/generated_images/apartment_unit_floor_plans_5298881c.png";
import oneBedImage from "@assets/1 Bed_1754836945408.png";
import twoBedImage from "@assets/2 Bed_1754837154542.png";
import threeBedImage from "@assets/3 Bed_1754837154543.png";
import tracyRouteImage from "@assets/Tracy to Olivehurst_1754838644869.png";
import zoningMapImage from "@assets/Serinity Zoning Map_1754839677898.png";
import olivehurstMapImage from "@assets/Olivehurst Map_1754839713206.png";
import timelineComparisonImage from "@assets/image_1756583015103.png";

export default function ModularFeasibility() {
  const [, params] = useRoute("/projects/:id/modular-feasibility");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;
  const [activeTab, setActiveTab] = useState("summary");

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: costBreakdowns, error: costError } = useQuery<CostBreakdown[]>({
    queryKey: ["/api/projects", projectId, "cost-breakdowns"],
    enabled: !!projectId,
  });

  // Direct database values - single source of truth
  const projectScores = useMemo(() => {
    if (!project) return { overall: "0.0", individual: { zoning: "0.0", massing: "0.0", sustainability: "0.0", cost: "0.0", logistics: "0.0", buildTime: "0.0" } };
    return {
      overall: project.overallScore || "0.0",
      individual: {
        zoning: project.zoningScore || "0.0",
        massing: project.massingScore || "0.0",
        sustainability: project.sustainabilityScore || "0.0",
        cost: project.costScore || "0.0", 
        logistics: project.logisticsScore || "0.0",
        buildTime: project.buildTimeScore || "0.0"
      }
    };
  }, [project?.overallScore, project?.zoningScore, project?.massingScore, project?.sustainabilityScore, project?.costScore, project?.logisticsScore, project?.buildTimeScore]);

  const markAsComplete = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, {
        modularFeasibilityComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "ModularFeasibility Complete",
        description: "Your feasibility assessment is complete. You can now proceed to SmartStart.",
      });
      navigate(`/projects/${projectId}/workflow`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Handle authentication errors using useEffect to avoid violating rules of hooks
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  useEffect(() => {
    if (costError && isUnauthorizedError(costError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [costError, toast]);

  const handleDownloadReport = () => {
    if (project) {
      generateProjectPDF(project, costBreakdowns || []);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <Button onClick={() => navigate("/")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 4) return "text-raap-green";
    if (numScore >= 3) return "text-raap-mustard";
    return "text-red-600";
  };

  // Use shared sample project detection

  // Function to download cost breakdown as CSV using real API data
  const downloadCostBreakdown = () => {
    if (!costBreakdowns || costBreakdowns.length === 0) {
      toast({ title: "Error", description: "No cost breakdown data available for download", variant: "destructive" });
      return;
    }

    const costBreakdownData = [
      // Header
      ['MasterFormat Division', 'Site Built Total', 'Site Built $/sf', 'RaaP GC', 'RaaP Fab', 'RaaP Total', 'RaaP $/sf', 'Savings']
    ];

    // Helper function to add a row with calculated values
    const addRow = (name: string, siteBuilt: number, raapGc: number, raapFab: number, isSection: boolean = false) => {
      const raapTotal = raapGc + raapFab;
      const savings = siteBuilt - raapTotal;
      costBreakdownData.push([
        name,
        formatCurrency(siteBuilt),
        calculateCostPerSf(siteBuilt.toString()),
        formatCurrency(raapGc),
        formatCurrency(raapFab),
        formatCurrency(raapTotal),
        calculateCostPerSf(raapTotal.toString()),
        savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`
      ]);
    };

    // Define all divisions and their groupings
    const divisions = [
      // Concrete, Masonry & Metals
      { category: '03 Concrete', section: 'Concrete, Masonry & Metals' },
      { category: '04 Masonry', section: 'Concrete, Masonry & Metals' },
      { category: '05 Metal', section: 'Concrete, Masonry & Metals' },
      
      // Rooms
      { category: '06 Wood & Plastics', section: 'Rooms' },
      { category: '07 Thermal & Moisture Protection', section: 'Rooms' },
      { category: '08 Openings', section: 'Rooms' },
      { category: '09 Finishes', section: 'Rooms' },
      
      // Equipment & Special Construction
      { category: '10 Specialties', section: 'Equipment & Special Construction' },
      { category: '11 Equipment', section: 'Equipment & Special Construction' },
      { category: '12 Furnishing', section: 'Equipment & Special Construction' },
      { category: '13 Special Construction', section: 'Equipment & Special Construction' },
      
      // MEPs
      { category: '21 Fire Suppression', section: 'MEPs' },
      { category: '22 Plumbing', section: 'MEPs' },
      { category: '23 HVAC', section: 'MEPs' },
      { category: '26 Electrical', section: 'MEPs' },
      
      // Site Work
      { category: '02 Existing Conditions', section: 'Site Work' },
      { category: '31 Earthwork', section: 'Site Work' },
      { category: '32 Exterior Improvements', section: 'Site Work' },
      { category: '33 Utilities', section: 'Site Work' },
      
      // GC Charges
      { category: '01 General Requirements', section: 'GC Charges' },
      { category: '00 Fees', section: 'GC Charges' }
    ];

    // Group divisions by section and calculate totals
    const sections = ['Concrete, Masonry & Metals', 'Rooms', 'Equipment & Special Construction', 'MEPs', 'Site Work', 'GC Charges'];
    let projectSiteBuilt = 0, projectRaapGc = 0, projectRaapFab = 0;

    sections.forEach(sectionName => {
      const sectionDivisions = divisions.filter(d => d.section === sectionName);
      let sectionSiteBuilt = 0, sectionRaapGc = 0, sectionRaapFab = 0;

      // Add section header
      sectionDivisions.forEach(division => {
        const data = getCostBreakdownByCategory(costBreakdowns, division.category);
        if (data) {
          const siteBuilt = parseFloat(data.siteBuiltCost || '0');
          const raapGc = parseFloat(data.raapGcCost || '0');
          const raapFab = parseFloat(data.raapFabCost || '0');
          
          sectionSiteBuilt += siteBuilt;
          sectionRaapGc += raapGc;
          sectionRaapFab += raapFab;
        }
      });

      // Add section total
      addRow(sectionName, sectionSiteBuilt, sectionRaapGc, sectionRaapFab, true);

      // Add individual divisions
      sectionDivisions.forEach(division => {
        const data = getCostBreakdownByCategory(costBreakdowns, division.category);
        if (data) {
          const siteBuilt = parseFloat(data.siteBuiltCost || '0');
          const raapGc = parseFloat(data.raapGcCost || '0');
          const raapFab = parseFloat(data.raapFabCost || '0');
          
          addRow(`  ${division.category}`, siteBuilt, raapGc, raapFab);
        }
      });

      // Add to project totals
      projectSiteBuilt += sectionSiteBuilt;
      projectRaapGc += sectionRaapGc;
      projectRaapFab += sectionRaapFab;
    });

    // Add empty row and project total
    costBreakdownData.push(['', '', '', '', '', '', '', '']);
    addRow('PROJECT TOTAL', projectSiteBuilt, projectRaapGc, projectRaapFab, true);
    
    // Convert to CSV
    const csvContent = costBreakdownData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_MasterFormat_Cost_Breakdown.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV download function for Summary tab - raw input data only
  const downloadSummaryData = () => {
    const summaryData = [
      ['Field', 'Value'],
      ['Project Name', project.name || ''],
      ['Address', project.address || ''],
      ['Project Type', project.projectType || ''],
      ['Target Floors', project.targetFloors || ''],
      ['Studio Units', project.studioUnits || ''],
      ['One Bedroom Units', project.oneBedUnits || ''],
      ['Two Bedroom Units', project.twoBedUnits || ''],
      ['Three Bedroom Units', project.threeBedUnits || ''],
      ['Target Parking Spaces', project.targetParkingSpaces || ''],
      ['Overall Score', scores.overall || ''],
      ['Zoning Score', scores.zoning || ''],
      ['Massing Score', scores.massing || ''],
      ['Sustainability Score', scores.sustainability || ''],
      ['Cost Score', scores.cost || ''],
      ['Logistics Score', scores.logistics || ''],
      ['Build Time Score', scores.buildTime || '']
    ];
    
    const csvContent = summaryData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_Summary.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV download function for Zoning tab - raw zoning input data only
  const downloadZoningData = () => {
    const zoningData = [
      ['Field', 'Value'],
      ['Zoning District', project.zoningDistrict || ''],
      ['Density Bonus Eligible', project.densityBonusEligible || ''],
      ['Required Waivers', project.requiredWaivers || '']
    ];
    
    const csvContent = zoningData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_Zoning.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV download function for Massing tab - raw massing input data only
  const downloadMassingData = () => {
    const massingData = [
      ['Field', 'Value'],
      ['Construction Type', project.constructionType || ''],
      ['Target Floors', project.targetFloors || ''],
      ['Studio Units', project.studioUnits || ''],
      ['One Bedroom Units', project.oneBedUnits || ''],
      ['Two Bedroom Units', project.twoBedUnits || ''],
      ['Three Bedroom Units', project.threeBedUnits || ''],
      ['Building Dimensions', project.buildingDimensions || '']
    ];
    
    const csvContent = massingData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_Massing.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV download function for Sustainability tab - assessment results only (read-only)
  const downloadSustainabilityData = () => {
    const sustainabilityData = [
      ['Field', 'Assessment Result'],
      ['Solar PV Ready', 'Yes'],
      ['Battery Storage Prep', 'Included'],
      ['High Performance Envelope', 'Upgrade Required'],
      ['HVAC Efficiency', 'Upgrade Required'],
      ['LED Lighting Package', 'Standard'],
      ['Air Tightness', 'Factory Controlled'],
      ['Thermal Bridge Reduction', 'Optimized'],
      ['Window Performance', 'Upgrade Required'],
      ['Ventilation System', 'HRV Required'],
      ['Quality Assurance', 'Factory QC']
    ];
    
    const csvContent = sustainabilityData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_Sustainability.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV download function for Logistics tab - raw logistics input data only
  const downloadLogisticsData = () => {
    const logisticsData = [
      ['Field', 'Value'],
      ['Factory Location', project.factoryLocation || ''],
      ['Transportation Notes', project.transportationNotes || ''],
      ['Staging Notes', project.stagingNotes || '']
    ];
    
    const csvContent = logisticsData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_Logistics.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV download function for Build Time tab - raw timeline input data only
  const downloadBuildTimeData = () => {
    const buildTimeData = [
      ['Field', 'Value'],
      ['Modular Timeline Months', project.modularTimelineMonths || ''],
      ['Site Built Timeline Months', project.siteBuiltTimelineMonths || '']
    ];
    
    const csvContent = buildTimeData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_BuildTime.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV upload functions
  const uploadSummaryData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const data: Record<string, string> = {};
        
        // Skip header, parse data with proper CSV handling
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with quoted values containing commas
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const parts = line.split(csvRegex);
          
          if (parts.length >= 2) {
            const field = parts[0].replace(/"/g, '').trim();
            const value = parts[1].replace(/"/g, '').trim();
            if (field && value) {
              data[field] = value;
            }
          }
        }
        
        // Update project with uploaded data - core fields and scores only
        const updateData = {
          name: data['Project Name'] || project.name,
          address: data['Address'] || project.address,
          projectType: data['Project Type'] || project.projectType,
          targetFloors: data['Target Floors'] || project.targetFloors,
          studioUnits: data['Studio Units'] || project.studioUnits,
          oneBedUnits: data['One Bedroom Units'] || project.oneBedUnits,
          twoBedUnits: data['Two Bedroom Units'] || project.twoBedUnits,
          threeBedUnits: data['Three Bedroom Units'] || project.threeBedUnits,
          targetParkingSpaces: data['Target Parking Spaces'] || project.targetParkingSpaces,
          // Score fields - single source of truth
          overallScore: data['Overall Score'] || project.overallScore,
          zoningScore: data['Zoning Score'] || project.zoningScore,
          massingScore: data['Massing Score'] || project.massingScore,
          sustainabilityScore: data['Sustainability Score'] || project.sustainabilityScore,
          costScore: data['Cost Score'] || project.costScore,
          logisticsScore: data['Logistics Score'] || project.logisticsScore,
          buildTimeScore: data['Build Time Score'] || project.buildTimeScore
        };
        
        await apiRequest("PATCH", `/api/projects/${projectId}`, updateData);
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        toast({ title: "Success", description: "Summary data uploaded successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload summary data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const uploadZoningData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const data: Record<string, string> = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with quoted values containing commas
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const parts = line.split(csvRegex);
          
          if (parts.length >= 2) {
            const field = parts[0].replace(/"/g, '').trim();
            const value = parts[1].replace(/"/g, '').trim();
            if (field && value) {
              data[field] = value;
            }
          }
        }
        
        const updateData = {
          zoningDistrict: data['Zoning District'] || project.zoningDistrict,
          densityBonusEligible: data['Density Bonus Eligible'] || project.densityBonusEligible,
          requiredWaivers: data['Required Waivers'] || project.requiredWaivers
        };
        
        await apiRequest("PATCH", `/api/projects/${projectId}`, updateData);
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        toast({ title: "Success", description: "Zoning data uploaded successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload zoning data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const uploadMassingData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const data: Record<string, string> = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with quoted values containing commas
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const parts = line.split(csvRegex);
          
          if (parts.length >= 2) {
            const field = parts[0].replace(/"/g, '').trim();
            const value = parts[1].replace(/"/g, '').trim();
            if (field && value) {
              data[field] = value;
            }
          }
        }
        
        const updateData = {
          constructionType: data['Construction Type'] || project.constructionType,
          targetFloors: data['Target Floors'] || project.targetFloors,
          studioUnits: data['Studio Units'] || project.studioUnits,
          oneBedUnits: data['One Bedroom Units'] || project.oneBedUnits,
          twoBedUnits: data['Two Bedroom Units'] || project.twoBedUnits,
          threeBedUnits: data['Three Bedroom Units'] || project.threeBedUnits,
          buildingDimensions: data['Building Dimensions'] || project.buildingDimensions
        };
        
        await apiRequest("PATCH", `/api/projects/${projectId}`, updateData);
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        toast({ title: "Success", description: "Massing data uploaded successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload massing data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const uploadSustainabilityData = (file: File) => {
    // Sustainability data is read-only assessment results, not user input
    toast({ title: "Info", description: "Sustainability data is assessment results and cannot be modified via upload" });
  };

  const uploadLogisticsData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const data: Record<string, string> = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with quoted values containing commas
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const parts = line.split(csvRegex);
          
          if (parts.length >= 2) {
            const field = parts[0].replace(/"/g, '').trim();
            const value = parts[1].replace(/"/g, '').trim();
            if (field && value) {
              data[field] = value;
            }
          }
        }
        
        const updateData = {
          factoryLocation: data['Factory Location'] || project.factoryLocation,
          transportationNotes: data['Transportation Notes'] || project.transportationNotes,
          stagingNotes: data['Staging Notes'] || project.stagingNotes
        };
        
        await apiRequest("PATCH", `/api/projects/${projectId}`, updateData);
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        toast({ title: "Success", description: "Logistics data uploaded successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload logistics data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const uploadBuildTimeData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const data: Record<string, string> = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with quoted values containing commas
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const parts = line.split(csvRegex);
          
          if (parts.length >= 2) {
            const field = parts[0].replace(/"/g, '').trim();
            const value = parts[1].replace(/"/g, '').trim();
            if (field && value) {
              data[field] = value;
            }
          }
        }
        
        const updateData = {
          modularTimelineMonths: data['Modular Timeline Months'] || project.modularTimelineMonths,
          siteBuiltTimelineMonths: data['Site Built Timeline Months'] || project.siteBuiltTimelineMonths
        };
        
        await apiRequest("PATCH", `/api/projects/${projectId}`, updateData);
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        toast({ title: "Success", description: "Build time data uploaded successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to upload build time data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  // CSV upload function for Cost Breakdown tab - handles detailed cost breakdown data
  const uploadCostBreakdown = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({ title: "Error", description: "CSV file must contain at least a header and one data row", variant: "destructive" });
          return;
        }
        
        // Parse the CSV header to understand the structure
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        // Expected headers: MasterFormat Division, Site Built Total, Site Built $/sf, RaaP GC, RaaP Fab, RaaP Total, RaaP $/sf, Savings
        const costBreakdowns = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle CSV parsing with quoted values containing commas
          const csvRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const parts = line.split(csvRegex).map(p => p.replace(/"/g, '').trim());
          
          if (parts.length >= 4) {
            const division = parts[0];
            const siteBuiltTotal = parts[1].replace(/[\$,()]/g, '');
            const raapGc = parts[3] ? parts[3].replace(/[\$,()]/g, '') : '0';
            const raapFab = parts[4] ? parts[4].replace(/[\$,()]/g, '') : '0';
            
            // Skip header rows and totals, process individual divisions
            if (division && !division.toLowerCase().includes('total') && !division.toLowerCase().includes('masterformat')) {
              costBreakdowns.push({
                category: division,
                siteBuiltCost: siteBuiltTotal || '0',
                raapGcCost: raapGc || '0',
                raapFabCost: raapFab || '0'
              });
            }
          }
        }
        
        if (costBreakdowns.length === 0) {
          toast({ title: "Error", description: "No valid cost breakdown data found in CSV file", variant: "destructive" });
          return;
        }
        
        // Update cost breakdowns via API
        await apiRequest("POST", `/api/projects/${projectId}/cost-breakdowns`, { costBreakdowns });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "cost-breakdowns"] });
        toast({ title: "Success", description: "Cost breakdown data uploaded successfully" });
      } catch (error) {
        console.error('Cost breakdown upload error:', error);
        toast({ title: "Error", description: "Failed to upload cost breakdown data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  // Use deterministic scores that match ProjectCard exactly
  const scores = {
    overall: projectScores.overall,
    zoning: projectScores.individual.zoning,
    massing: projectScores.individual.massing,
    sustainability: projectScores.individual.sustainability,
    cost: projectScores.individual.cost,
    logistics: projectScores.individual.logistics,
    buildTime: projectScores.individual.buildTime
  };
  
  const overallScore = projectScores.overall;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/projects/${projectId}/workflow`)}
              className="text-raap-green hover:text-green-700 mb-4 p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflow
            </Button>
            <h1 className="text-3xl font-bold text-raap-dark mb-2">ModularFeasibility Assessment</h1>
            <h2 className="text-xl text-gray-700 mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)} Housing • {totalUnits} Units • {project.targetFloors} Stories
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-sm text-gray-500 mb-4">Overall Score</div>
            {project.modularFeasibilityComplete && (
              <Badge className="bg-green-500 text-white mb-2">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Badge>
            )}
            <div>
              <Button 
                onClick={handleDownloadReport}
                variant="outline"
                className="mr-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>

        {/* Seven Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-7 w-full mb-8">
            <TabsTrigger value="summary" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="zoning" className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Zoning</span>
            </TabsTrigger>
            <TabsTrigger value="massing" className="flex items-center space-x-1">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Massing</span>
            </TabsTrigger>
            <TabsTrigger value="sustainability" className="flex items-center space-x-1">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">Sustainability</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Cost</span>
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex items-center space-x-1">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Logistics</span>
            </TabsTrigger>
            <TabsTrigger value="buildtime" className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Build Time</span>
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Project Summary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadSummaryData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </button>
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadSummaryData(file);
                        }}
                        className="hidden"
                      />
                      Upload CSV
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Overall Modular Feasibility Assessment</h3>
                      <div className="text-4xl font-bold text-green-600">{overallScore}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      <strong>Good fit for modular construction</strong> with a high Modular Feasibility score of {overallScore}/5 based on the six criteria below, with no additional restrictions introduced by modular construction.
                    </p>
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-800 mb-2">Assessment Summary</h4>
                      <p className="text-sm text-gray-700">
                        {project.isSample ? (
                          '24 units of Affordable Housing, 6 X 1BR, 12 X 2BR, 6 X 3BR. Dimensions 146 (L) X 66 (W) X 36 (H). Construction Type: V-A. 24 Parking Spaces.'
                        ) : (
                          `103 units of ${project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)} Housing, 14 X Studios, 67 X 1BR, 22 X 2BR. Dimensions 519 (L) X 67 (W) X 57 (H). Construction Type: III-A. 100 Parking Spaces.`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 6 Assessment Criteria Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(scores.zoning)}`}>
                        {scores.zoning}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Zoning</div>
                      <div className="text-xs text-gray-400">20% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(scores.massing)}`}>
                        {scores.massing}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Massing</div>
                      <div className="text-xs text-gray-400">15% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(scores.sustainability)}`}>
                        {scores.sustainability}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Sustainability</div>
                      <div className="text-xs text-gray-400">20% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(scores.cost)}`}>
                        {scores.cost}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Cost</div>
                      <div className="text-xs text-gray-400">20% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(scores.logistics)}`}>
                        {scores.logistics}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Logistics</div>
                      <div className="text-xs text-gray-400">15% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(scores.buildTime)}`}>
                        {scores.buildTime}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Build Time</div>
                      <div className="text-xs text-gray-400">10% weight</div>
                    </div>
                  </div>

                  {/* Cost & Build Time Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        ${project.modularTotalCost ? (parseFloat(project.modularTotalCost) / 1000000).toFixed(1) : "0.0"}M
                      </div>
                      <div className="text-sm text-gray-500">Modular Cost</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {project.modularTimelineMonths || 0} mo
                      </div>
                      <div className="text-sm text-gray-500">Build Time</div>
                    </div>
                    {((project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0)) && (
                      <div className="text-center p-4 bg-green-100 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {project.costSavingsPercent}%
                        </div>
                        <div className="text-sm text-gray-500">Cost Savings</div>
                      </div>
                    )}
                  </div>

                  {/* Site Map and Specifications Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-4">Site Location</h4>
                      <ProjectSiteMap 
                        address={project.address}
                        projectName={project.name}
                        height="280px"
                        className="border rounded-lg"
                      />
                    </div>
                    
                    <div className="bg-raap-green/10 border border-raap-green rounded-lg p-6">
                      <h4 className="font-semibold text-raap-green mb-4">Project Specifications</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
                        <div><strong>Total Units:</strong> {totalUnits}</div>
                        {(project.studioUnits || 0) > 0 && <div><strong>Studio:</strong> {project.studioUnits} units</div>}
                        {(project.oneBedUnits || 0) > 0 && <div><strong>1 Bedroom:</strong> {project.oneBedUnits} units</div>}
                        {(project.twoBedUnits || 0) > 0 && <div><strong>2 Bedroom:</strong> {project.twoBedUnits} units</div>}
                        {(project.threeBedUnits || 0) > 0 && <div><strong>3 Bedroom:</strong> {project.threeBedUnits} units</div>}
                        <div><strong>Floors:</strong> {project.targetFloors}</div>
                        {project.buildingDimensions && <div><strong>Dimensions:</strong> {project.buildingDimensions}</div>}
                        {project.constructionType && <div><strong>Construction Type:</strong> {project.constructionType}</div>}
                        <div><strong>Parking Spaces:</strong> {project.targetParkingSpaces}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional tabs would be added here with the detailed assessments... */}
          <TabsContent value="zoning">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Site & Zoning</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      Score: {scores.zoning}/5.0
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadZoningData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </button>
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadZoningData(file);
                        }}
                        className="hidden"
                      />
                      Upload CSV
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-blue-800">Zoning Assessment</h3>
                      <div className="text-3xl font-bold text-blue-600">{scores.zoning}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of {scores.zoning}/5:</strong> Concessions are required to reduce open space and parking requirements. 
                      Modular construction does not introduce any additional waivers or restrictions for this site. 
                      The project qualifies for density bonus provisions under AB 1287 due to affordable unit mix.
                    </p>
                    <div className="text-xs text-blue-600 font-medium">
                      Weight: 20% of overall feasibility score
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> This is a preliminary zoning & code review. A more complete analysis will be completed during the SmartStart & Entitlement phases.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Zoning District</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <p className="text-lg font-semibold text-raap-green">Residential Medium Density (RM)</p>
                        <div className="mt-4 space-y-2">
                          <p><strong>Base Density:</strong> 17 DU/Acre Max</p>
                          <p><strong>With AB 1287:</strong> Additional 100% density increase (34 DU/Acre Max)</p>
                          <p><strong>Proposed:</strong> 24 DU/Acre (71% of max allowed)</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Site Information</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2">
                          <p><strong>Address:</strong> {project.isSample ? '1234 Olivehurst Avenue' : project.address}</p>
                          <p><strong>APN:</strong> 014-240-005</p>
                          <p><strong>Lot Size:</strong> 1.0 acre (43,560 sf)</p>
                          <p><strong>Current Use:</strong> Vacant residential land</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Compliance Analysis</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Requirement</th>
                            <th className="px-4 py-3 text-left font-semibold">Required</th>
                            <th className="px-4 py-3 text-left font-semibold">Proposed</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3">Height Limit</td>
                            <td className="px-4 py-3">{project.isSample ? '40 ft max' : '65 ft max'}</td>
                            <td className="px-4 py-3">{project.isSample ? '36 ft' : '57 ft'}</td>
                            <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ Compliant</span></td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Front Setback</td>
                            <td className="px-4 py-3">20 ft min</td>
                            <td className="px-4 py-3">25 ft</td>
                            <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ Compliant</span></td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Rear Setback</td>
                            <td className="px-4 py-3">20 ft min</td>
                            <td className="px-4 py-3">20 ft</td>
                            <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ Compliant</span></td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Side Setbacks</td>
                            <td className="px-4 py-3">10 ft min each</td>
                            <td className="px-4 py-3">12 ft each</td>
                            <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ Compliant</span></td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Open Space</td>
                            <td className="px-4 py-3">25% min</td>
                            <td className="px-4 py-3">20%</td>
                            <td className="px-4 py-3"><span className="text-orange-600 font-semibold">⚠ Variance Required</span></td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Parking</td>
                            <td className="px-4 py-3">{project.isSample ? '1.5 spaces/unit' : '1.0 spaces/unit'}</td>
                            <td className="px-4 py-3">{project.isSample ? '1 space/unit' : '0.97 spaces/unit'}</td>
                            <td className="px-4 py-3"><span className="text-orange-600 font-semibold">⚠ Variance Required</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="massing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Massing</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Score: {scores.massing}/5.0
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadMassingData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </button>
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadMassingData(file);
                        }}
                        className="hidden"
                      />
                      Upload CSV
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Massing Assessment</h3>
                      <div className="text-3xl font-bold text-green-600">{scores.massing}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of {scores.massing}/5:</strong> No additional constraints caused by modular structure. 
                      {project.isSample ? 'Modular construction provides optimal efficiency for this unit configuration and site layout.' : 'We can achieve the goal of 103 units and unit mix (14 studios, 67 1BR, 22 2BR) as the traditional original design.'}
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Weight: 15% of overall feasibility score
                    </div>
                  </div>

                  {/* Sub-Tabs */}
                  <Tabs defaultValue="specifications" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-gray-100">
                      <TabsTrigger value="specifications" className="text-sm">Specifications</TabsTrigger>
                      <TabsTrigger value="unitplans" className="text-sm">Unit Plans</TabsTrigger>
                      <TabsTrigger value="floorplan" className="text-sm">Floor Plan</TabsTrigger>
                      <TabsTrigger value="3dview" className="text-sm">3D View</TabsTrigger>
                      <TabsTrigger value="siteplan" className="text-sm">Site Plan</TabsTrigger>
                    </TabsList>

                    {/* Specifications Sub-Tab */}
                    <TabsContent value="specifications" className="mt-6">
                      <div className="space-y-6">
                        {/* Unit Mix Summary matching the image */}
                        <div className="bg-white border rounded-lg p-6">
                          <h4 className="font-semibold text-gray-800 mb-6">Unit Mix Summary</h4>
                          {project.isSample ? (
                            // Sample projects: show original 1BR/2BR/3BR mix
                            <div className="grid grid-cols-3 gap-6">
                              <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="text-4xl font-bold text-green-600 mb-2">6</div>
                                <div className="font-semibold text-gray-700">1-Bedroom Units</div>
                                <div className="text-sm text-gray-500">563 SF Average</div>
                              </div>
                              <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="text-4xl font-bold text-blue-600 mb-2">12</div>
                                <div className="font-semibold text-gray-700">2-Bedroom Units</div>
                                <div className="text-sm text-gray-500">813 SF Average</div>
                              </div>
                              <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="text-4xl font-bold text-orange-600 mb-2">6</div>
                                <div className="font-semibold text-gray-700">3-Bedroom Units</div>
                                <div className="text-sm text-gray-500">980 SF Average</div>
                              </div>
                            </div>
                          ) : (
                            // NEW projects: show Studio/1BR/2BR mix
                            <div className="grid grid-cols-3 gap-6">
                              <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="text-4xl font-bold text-purple-600 mb-2">14</div>
                                <div className="font-semibold text-gray-700">Studio Units</div>
                                <div className="text-sm text-gray-500">450 SF Average</div>
                              </div>
                              <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="text-4xl font-bold text-green-600 mb-2">67</div>
                                <div className="font-semibold text-gray-700">1-Bedroom Units</div>
                                <div className="text-sm text-gray-500">600 SF Average</div>
                              </div>
                              <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="text-4xl font-bold text-blue-600 mb-2">22</div>
                                <div className="font-semibold text-gray-700">2-Bedroom Units</div>
                                <div className="text-sm text-gray-500">850 SF Average</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-raap-dark mb-3">Building Specifications</h4>
                            <div className="bg-white border rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span>Total Units</span>
                                  <span className="font-semibold">{project.isSample ? '24 units' : '103 units'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Building Stories</span>
                                  <span className="font-semibold">{project.isSample ? '3 stories' : '5 stories'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Building Height</span>
                                  <span className="font-semibold">{project.isSample ? '32 feet' : '57 feet'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Building Area</span>
                                  <span className="font-semibold">19,008 sf</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Site Coverage</span>
                                  <span className="font-semibold">14.5%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Parking Spaces</span>
                                  <span className="font-semibold">{project.isSample ? '24 spaces' : '100 spaces'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-raap-dark mb-3">Modular Specifications</h4>
                            <div className="bg-white border rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span>Module Size</span>
                                  <span className="font-semibold">14' x 60'</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Modules</span>
                                  <span className="font-semibold">60 modules</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Construction Type</span>
                                  <span className="font-semibold">{project.isSample ? 'V-A' : 'III-A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Structural System</span>
                                  <span className="font-semibold">{project.isSample ? 'Light Frame' : 'Wood'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Base</span>
                                  <span className="font-semibold">{project.isSample ? 'Concrete Slab' : 'Concrete Podium'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Shipping Weight</span>
                                  <span className="font-semibold">~45 tons each</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-raap-dark mb-3">Modular vs Site-Built Comparison</h4>
                          <div className="bg-white border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold">Aspect</th>
                                  <th className="px-4 py-3 text-left font-semibold">Site-Built</th>
                                  <th className="px-4 py-3 text-left font-semibold">RaaP Modular</th>
                                  <th className="px-4 py-3 text-left font-semibold">Impact</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                <tr>
                                  <td className="px-4 py-3">Unit Count</td>
                                  <td className="px-4 py-3">{project.isSample ? '24 units' : '103 units'}</td>
                                  <td className="px-4 py-3">{project.isSample ? '24 units' : '103 units'}</td>
                                  <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ No Change</span></td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">{project.isSample ? 'Building Footprint' : 'Gross Sq. Ft.'}</td>
                                  <td className="px-4 py-3">{project.isSample ? '6,336 sf' : '142,924 sf'}</td>
                                  <td className="px-4 py-3">{project.isSample ? '6,336 sf' : '143,648 sf'}</td>
                                  <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ No Change</span></td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">Floor Area Ratio</td>
                                  <td className="px-4 py-3">0.44</td>
                                  <td className="px-4 py-3">0.44</td>
                                  <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ No Change</span></td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">Structural Efficiency</td>
                                  <td className="px-4 py-3">Standard</td>
                                  <td className="px-4 py-3">Optimized</td>
                                  <td className="px-4 py-3"><span className="text-blue-600 font-semibold">↑ Improved</span></td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">Design Flexibility</td>
                                  <td className="px-4 py-3">High</td>
                                  <td className="px-4 py-3">Moderate</td>
                                  <td className="px-4 py-3"><span className="text-orange-600 font-semibold">↓ Reduced</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Unit Plans Sub-Tab */}
                    <TabsContent value="unitplans" className="mt-6">
                      <div className="space-y-6">
                        <h4 className="font-semibold text-raap-dark mb-4">Individual Unit Floor Plans</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <img 
                              src={oneBedImage} 
                              alt="1 Bedroom Unit Floor Plan - 563 sf"
                              className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white mb-3"
                              style={{ maxHeight: '400px' }}
                            />
                            <h5 className="font-semibold text-green-600 mb-1">1 Bedroom Unit</h5>
                            <p className="text-sm text-gray-600 mb-2">563 sf • 6 units</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>1 Bedroom, 1 Bathroom</div>
                              <div>Kitchen, Living Room</div>
                              <div>In-unit Washer/Dryer</div>
                            </div>
                          </div>
                          <div className="text-center">
                            <img 
                              src={twoBedImage} 
                              alt="2 Bedroom Unit Floor Plan - 813 sf"
                              className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white mb-3"
                              style={{ maxHeight: '400px' }}
                            />
                            <h5 className="font-semibold text-blue-600 mb-1">2 Bedroom Unit</h5>
                            <p className="text-sm text-gray-600 mb-2">813 sf • 12 units</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>2 Bedrooms, 2 Bathrooms</div>
                              <div>Kitchen, Living/Dining</div>
                              <div>In-unit Washer/Dryer</div>
                            </div>
                          </div>
                          <div className="text-center">
                            <img 
                              src={threeBedImage} 
                              alt="3 Bedroom Unit Floor Plan - 980 sf"
                              className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white mb-3"
                              style={{ maxHeight: '400px' }}
                            />
                            <h5 className="font-semibold text-orange-600 mb-1">3 Bedroom Unit</h5>
                            <p className="text-sm text-gray-600 mb-2">980 sf • 6 units</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>3 Bedrooms, 2 Bathrooms</div>
                              <div>Kitchen, Living/Dining</div>
                              <div>In-unit Washer/Dryer</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Floor Plan Sub-Tab */}
                    <TabsContent value="floorplan" className="mt-6">
                      <div className="space-y-6">
                        <h4 className="font-semibold text-raap-dark mb-4">Building Floor Plans</h4>
                        <div className="space-y-6">
                          <div className="text-center">
                            <img 
                              src={project.isSample ? serenityFloorPlanImage : vallejoFloorPlanImage} 
                              alt="Building floor plan showing unit layout and circulation"
                              className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white mb-3"
                              style={{ maxHeight: '70vh' }}
                            />
                            <h5 className="font-semibold text-gray-800 mb-2">Typical Floor Plan</h5>
                            <p className="text-sm text-gray-600">Shows unit layout, circulation, and common areas</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white border rounded-lg p-4">
                              <h6 className="font-semibold text-raap-dark mb-3">Floor Plan Features</h6>
                              <ul className="text-sm text-gray-700 space-y-2">
                                <li>• Double-loaded corridor for efficiency</li>
                                <li>• Central stairwell with elevator access</li>
                                <li>• Natural light in all units</li>
                                <li>• Compliant with accessibility requirements</li>
                                <li>• Optimized for modular construction grid</li>
                              </ul>
                            </div>
                            <div className="bg-white border rounded-lg p-4">
                              <h6 className="font-semibold text-raap-dark mb-3">Circulation & Access</h6>
                              <ul className="text-sm text-gray-700 space-y-2">
                                <li>• Two means of egress per code</li>
                                <li>• ADA compliant unit distribution</li>
                                <li>• Efficient corridor width (6 feet)</li>
                                <li>• Direct exterior access from ground floor</li>
                                <li>• Covered parking beneath building</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* 3D View Sub-Tab */}
                    <TabsContent value="3dview" className="mt-6">
                      <div className="space-y-6">
                        <h4 className="font-semibold text-raap-dark mb-4">3D Building Renderings</h4>
                        <div className="text-center">
                          <img 
                            src={project.isSample ? serenityBuildingRenderingImage : vallejoBuildingRenderingImage} 
                            alt="3D rendering of the modular apartment building"
                            className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white mb-4"
                            style={{ maxHeight: '70vh' }}
                          />
                          <h5 className="font-semibold text-gray-800 mb-2">Exterior Building Rendering</h5>
                          <p className="text-sm text-gray-600">Three-story modular apartment building with contemporary design</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-semibold text-raap-dark mb-3">Design Features</h6>
                            <ul className="text-sm text-gray-700 space-y-2">
                              <li>• Contemporary architectural style</li>
                              <li>• Mixed exterior materials (siding, brick)</li>
                              <li>• Energy-efficient windows</li>
                              <li>• Covered parking at ground level</li>
                              <li>• Landscaped common areas</li>
                              <li>• Balconies for upper floor units</li>
                            </ul>
                          </div>
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-semibold text-raap-dark mb-3">Modular Advantages</h6>
                            <ul className="text-sm text-gray-700 space-y-2">
                              <li>• Factory-controlled quality</li>
                              <li>• Consistent material finishes</li>
                              <li>• Reduced on-site construction time</li>
                              <li>• Enhanced structural performance</li>
                              <li>• Better weather protection during build</li>
                              <li>• Improved dimensional accuracy</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Site Plan Sub-Tab */}
                    <TabsContent value="siteplan" className="mt-6">
                      <div className="space-y-6">
                        <h4 className="font-semibold text-raap-dark mb-4">Site Layout & Planning</h4>
                        <div className="text-center">
                          <img 
                            src={project.isSample ? serenitySitePlanImage : vallejoSitePlanImage} 
                            alt="Site plan showing building placement, parking, and landscaping"
                            className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white mb-4"
                            style={{ maxHeight: '70vh' }}
                          />
                          <h5 className="font-semibold text-gray-800 mb-2">Site Plan Layout</h5>
                          <p className="text-sm text-gray-600">Building placement, parking layout, and site circulation</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-semibold text-raap-dark mb-3">Site Statistics</h6>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Total Site Area</span>
                                <span className="font-semibold">1.75 acres</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Building Coverage</span>
                                <span className="font-semibold">14.5%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Parking Spaces</span>
                                <span className="font-semibold">24 spaces</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Open Space</span>
                                <span className="font-semibold">65%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Landscaping</span>
                                <span className="font-semibold">20%</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white border rounded-lg p-4">
                            <h6 className="font-semibold text-raap-dark mb-3">Site Features</h6>
                            <ul className="text-sm text-gray-700 space-y-2">
                              <li>• Surface parking with covered spaces</li>
                              <li>• Central courtyard for residents</li>
                              <li>• Perimeter landscaping and screening</li>
                              <li>• Accessible pathways throughout</li>
                              <li>• Stormwater management features</li>
                              <li>• Utility service access points</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sustainability">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Leaf className="h-5 w-5" />
                    <span>Sustainability</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Score: {scores.sustainability}/5.0
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadSustainabilityData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </button>
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadSustainabilityData(file);
                        }}
                        className="hidden"
                      />
                      Upload CSV
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Sustainability Assessment</h3>
                      <div className="text-3xl font-bold text-green-600">{scores.sustainability}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of {scores.sustainability}/5:</strong> Project readily supports Net Zero Energy (NZE) and PHIUS with minimal site-built upgrades. 
                      Will require enhancements to foundation, walls, roof, windows, HVAC & lighting in addition to investment in batteries & solar power. 
                      Modular construction can reduce waste generation and increase installation quality.
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Weight: 20% of overall feasibility score
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Net Zero Energy (NZE) Readiness</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Solar PV Ready Roof</span>
                            <span className="text-green-600 font-semibold">✓ Ready</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Battery Storage Prep</span>
                            <span className="text-green-600 font-semibold">✓ Included</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>High-Performance Envelope</span>
                            <span className="text-orange-600 font-semibold">⚠ Upgrade Required</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>HVAC Efficiency</span>
                            <span className="text-orange-600 font-semibold">⚠ Upgrade Required</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>LED Lighting Package</span>
                            <span className="text-green-600 font-semibold">✓ Standard</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">PHIUS Certification Path</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Air Tightness</span>
                            <span className="text-green-600 font-semibold">✓ Factory Controlled</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Thermal Bridge Reduction</span>
                            <span className="text-green-600 font-semibold">✓ Optimized</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Window Performance</span>
                            <span className="text-orange-600 font-semibold">⚠ Upgrade Required</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Ventilation System</span>
                            <span className="text-orange-600 font-semibold">⚠ HRV Required</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Quality Assurance</span>
                            <span className="text-green-600 font-semibold">✓ Factory QC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Required Enhancements for NZE/PHIUS</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Component</th>
                            <th className="px-4 py-3 text-left font-semibold">Standard Spec</th>
                            <th className="px-4 py-3 text-left font-semibold">Enhanced Spec</th>
                            <th className="px-4 py-3 text-left font-semibold">Cost Impact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3">Walls</td>
                            <td className="px-4 py-3">R-19 Insulation</td>
                            <td className="px-4 py-3">R-24+ Continuous</td>
                            <td className="px-4 py-3 text-orange-600">+$8K</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Windows</td>
                            <td className="px-4 py-3">U-0.30 Standard</td>
                            <td className="px-4 py-3">U-0.15 Triple Glazed</td>
                            <td className="px-4 py-3 text-orange-600">+$25K</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">HVAC</td>
                            <td className="px-4 py-3">Standard Heat Pump</td>
                            <td className="px-4 py-3">High-Efficiency HP + HRV</td>
                            <td className="px-4 py-3 text-orange-600">+$35K</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Solar + Battery</td>
                            <td className="px-4 py-3">None</td>
                            <td className="px-4 py-3">120kW Solar + 200kWh Battery</td>
                            <td className="px-4 py-3 text-orange-600">+$180K</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Modular Construction Advantages</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Factory-controlled environment ensures consistent air sealing</li>
                      <li>• Reduced thermal bridging through optimized assembly</li>
                      <li>• Quality control testing for each module before delivery</li>
                      <li>• Minimized construction waste (up to 50% reduction)</li>
                      <li>• Reduced on-site disruption and faster installation</li>
                      <li>• Pre-wired electrical and plumbing reduces field errors</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Cost Analysis</span>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                    Score: {scores.cost}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Cost Assessment</h3>
                      <div className="text-3xl font-bold text-green-600">{scores.cost}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of {scores.cost}/5:</strong> ${(parseFloat(project.modularTotalCost || '0') / 1000000).toFixed(1)}M (${project.modularCostPerSf || '0'}/sf; ${project.modularCostPerUnit || '0'}/unit) with Prevailing Wage. 
                      {project.costSavingsPercent || '0'}% savings over site-built. Modular construction provides cost advantages.
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Weight: 20% of overall feasibility score
                    </div>
                  </div>

                  {/* Detailed MasterFormat Cost Breakdown */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-raap-dark">Detailed MasterFormat Cost Breakdown</h4>
                      <div className="flex space-x-3">
                        <button
                          onClick={downloadCostBreakdown}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          data-testid="button-download-cost-breakdown"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download CSV
                        </button>
                        <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadCostBreakdown(file);
                            }}
                          />
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload CSV
                        </label>
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-700 text-white">
                          <tr>
                            <th className="px-3 py-3 text-left font-semibold">MasterFormat Division</th>
                            <th className="px-3 py-3 text-right font-semibold">Site Built Total</th>
                            <th className="px-3 py-3 text-right font-semibold">Site Built $/sf</th>
                            <th className="px-3 py-3 text-right font-semibold">RaaP GC</th>
                            <th className="px-3 py-3 text-right font-semibold">RaaP Fab</th>
                            <th className="px-3 py-3 text-right font-semibold">RaaP Total</th>
                            <th className="px-3 py-3 text-right font-semibold">RaaP $/sf</th>
                            <th className="px-3 py-3 text-right font-semibold">Savings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {/* Concrete, Masonry & Metals Section - Using real cost breakdown data */}
                          {(() => {
                            // Calculate totals for the section
                            const concreteData = getCostBreakdownByCategory(costBreakdowns, '03 Concrete');
                            const masonryData = getCostBreakdownByCategory(costBreakdowns, '04 Masonry');
                            const metalData = getCostBreakdownByCategory(costBreakdowns, '05 Metal');
                            
                            const siteBuiltTotal = (parseFloat(concreteData?.siteBuiltCost || '0') + 
                                                   parseFloat(masonryData?.siteBuiltCost || '0') + 
                                                   parseFloat(metalData?.siteBuiltCost || '0'));
                            const raapGcTotal = (parseFloat(concreteData?.raapGcCost || '0') + 
                                               parseFloat(masonryData?.raapGcCost || '0') + 
                                               parseFloat(metalData?.raapGcCost || '0'));
                            const raapFabTotal = (parseFloat(concreteData?.raapFabCost || '0') + 
                                                 parseFloat(masonryData?.raapFabCost || '0') + 
                                                 parseFloat(metalData?.raapFabCost || '0'));
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-blue-50">
                                <td className="px-3 py-2 font-semibold text-blue-800">Concrete, Masonry & Metals</td>
                                <MobileCurrencyCell amount={siteBuiltTotal} className="font-semibold" />
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <MobileCurrencyCell amount={raapGcTotal} />
                                <MobileCurrencyCell amount={raapFabTotal} />
                                <MobileCurrencyCell amount={raapTotal} className="font-semibold" />
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">
                                  <span className="sm:hidden">{savings >= 0 ? formatCostForMobile(formatCurrency(savings)) : `(${formatCostForMobile(formatCurrency(Math.abs(savings)))})`}</span>
                                  <span className="hidden sm:inline">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</span>
                                </td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '03 Concrete');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">03 Concrete</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '04 Masonry');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">04 Masonry</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{raapFab === 0 ? '$0' : formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '05 Metal');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">05 Metal</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}

                          {/* Rooms Section - Using real cost breakdown data */}
                          {(() => {
                            // Calculate totals for the Rooms section
                            const woodData = getCostBreakdownByCategory(costBreakdowns, '06 Wood & Plastics');
                            const thermalData = getCostBreakdownByCategory(costBreakdowns, '07 Thermal & Moisture Protection');
                            const openingsData = getCostBreakdownByCategory(costBreakdowns, '08 Openings');
                            const finishesData = getCostBreakdownByCategory(costBreakdowns, '09 Finishes');
                            
                            const siteBuiltTotal = (parseFloat(woodData?.siteBuiltCost || '0') + 
                                                   parseFloat(thermalData?.siteBuiltCost || '0') + 
                                                   parseFloat(openingsData?.siteBuiltCost || '0') + 
                                                   parseFloat(finishesData?.siteBuiltCost || '0'));
                            const raapGcTotal = (parseFloat(woodData?.raapGcCost || '0') + 
                                               parseFloat(thermalData?.raapGcCost || '0') + 
                                               parseFloat(openingsData?.raapGcCost || '0') + 
                                               parseFloat(finishesData?.raapGcCost || '0'));
                            const raapFabTotal = (parseFloat(woodData?.raapFabCost || '0') + 
                                                 parseFloat(thermalData?.raapFabCost || '0') + 
                                                 parseFloat(openingsData?.raapFabCost || '0') + 
                                                 parseFloat(finishesData?.raapFabCost || '0'));
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-green-50">
                                <td className="px-3 py-2 font-semibold text-green-800">Rooms</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(siteBuiltTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGcTotal)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFabTotal)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '06 Wood & Plastics');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">06 Wood & Plastics</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '07 Thermal & Moisture Protection');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">07 Thermal & Moisture Protection</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '08 Openings');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">08 Openings</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '09 Finishes');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">09 Finishes</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}

                          {/* Equipment & Special Construction Section - Using real cost breakdown data */}
                          {(() => {
                            // Calculate totals for the Equipment & Special Construction section
                            const specialtiesData = getCostBreakdownByCategory(costBreakdowns, '10 Specialties');
                            const equipmentData = getCostBreakdownByCategory(costBreakdowns, '11 Equipment');
                            const furnishingData = getCostBreakdownByCategory(costBreakdowns, '12 Furnishing');
                            const specialConstructionData = getCostBreakdownByCategory(costBreakdowns, '13 Special Construction');
                            
                            const siteBuiltTotal = (parseFloat(specialtiesData?.siteBuiltCost || '0') + 
                                                   parseFloat(equipmentData?.siteBuiltCost || '0') + 
                                                   parseFloat(furnishingData?.siteBuiltCost || '0') + 
                                                   parseFloat(specialConstructionData?.siteBuiltCost || '0'));
                            const raapGcTotal = (parseFloat(specialtiesData?.raapGcCost || '0') + 
                                               parseFloat(equipmentData?.raapGcCost || '0') + 
                                               parseFloat(furnishingData?.raapGcCost || '0') + 
                                               parseFloat(specialConstructionData?.raapGcCost || '0'));
                            const raapFabTotal = (parseFloat(specialtiesData?.raapFabCost || '0') + 
                                                 parseFloat(equipmentData?.raapFabCost || '0') + 
                                                 parseFloat(furnishingData?.raapFabCost || '0') + 
                                                 parseFloat(specialConstructionData?.raapFabCost || '0'));
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-orange-50">
                                <td className="px-3 py-2 font-semibold text-orange-800">Equipment & Special Construction</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(siteBuiltTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGcTotal)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFabTotal)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '10 Specialties');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">10 Specialties</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{raapGc === 0 ? '$0' : formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '11 Equipment');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">11 Equipment</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{raapFab === 0 ? '$0' : formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{savings === 0 ? '$0' : (savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`)}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '12 Furnishing');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">12 Furnishing</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '13 Special Construction');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">13 Special Construction</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{raapFab === 0 ? '$0' : formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{savings === 0 ? '$0' : (savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`)}</td>
                              </tr>
                            );
                          })()}

                          {/* MEPs Section - Using real cost breakdown data */}
                          {(() => {
                            // Calculate totals for the MEPs section
                            const fireData = getCostBreakdownByCategory(costBreakdowns, '21 Fire Suppression');
                            const plumbingData = getCostBreakdownByCategory(costBreakdowns, '22 Plumbing');
                            const hvacData = getCostBreakdownByCategory(costBreakdowns, '23 HVAC');
                            const electricalData = getCostBreakdownByCategory(costBreakdowns, '26 Electrical');
                            
                            const siteBuiltTotal = (parseFloat(fireData?.siteBuiltCost || '0') + 
                                                   parseFloat(plumbingData?.siteBuiltCost || '0') + 
                                                   parseFloat(hvacData?.siteBuiltCost || '0') + 
                                                   parseFloat(electricalData?.siteBuiltCost || '0'));
                            const raapGcTotal = (parseFloat(fireData?.raapGcCost || '0') + 
                                               parseFloat(plumbingData?.raapGcCost || '0') + 
                                               parseFloat(hvacData?.raapGcCost || '0') + 
                                               parseFloat(electricalData?.raapGcCost || '0'));
                            const raapFabTotal = (parseFloat(fireData?.raapFabCost || '0') + 
                                                 parseFloat(plumbingData?.raapFabCost || '0') + 
                                                 parseFloat(hvacData?.raapFabCost || '0') + 
                                                 parseFloat(electricalData?.raapFabCost || '0'));
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-purple-50">
                                <td className="px-3 py-2 font-semibold text-purple-800">MEPs</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(siteBuiltTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGcTotal)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFabTotal)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '21 Fire Suppression');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">21 Fire Suppression</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '22 Plumbing');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">22 Plumbing</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '23 HVAC');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">23 HVAC</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '26 Electrical');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">26 Electrical</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}

                          {/* Site Work Section - Using real cost breakdown data */}
                          {(() => {
                            // Calculate totals for the Site Work section
                            const earthworkData = getCostBreakdownByCategory(costBreakdowns, '31 Earthwork');
                            const exteriorData = getCostBreakdownByCategory(costBreakdowns, '32 Exterior Improvements');
                            const utilitiesData = getCostBreakdownByCategory(costBreakdowns, '33 Utilities');
                            // Note: 02 Existing Conditions uses static values, not included in calculations
                            
                            const siteBuiltTotal = (parseFloat(earthworkData?.siteBuiltCost || '0') + 
                                                   parseFloat(exteriorData?.siteBuiltCost || '0') + 
                                                   parseFloat(utilitiesData?.siteBuiltCost || '0') + 
                                                   124789); // Static value for 02 Existing Conditions
                            const raapGcTotal = (parseFloat(earthworkData?.raapGcCost || '0') + 
                                               parseFloat(exteriorData?.raapGcCost || '0') + 
                                               parseFloat(utilitiesData?.raapGcCost || '0') + 
                                               124789); // Static value for 02 Existing Conditions
                            const raapFabTotal = (parseFloat(earthworkData?.raapFabCost || '0') + 
                                                 parseFloat(exteriorData?.raapFabCost || '0') + 
                                                 parseFloat(utilitiesData?.raapFabCost || '0')); // Fab cost is 0 for site work
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-brown-50 border-gray-300 border-t-2">
                                <td className="px-3 py-2 font-semibold text-yellow-900">Site Work</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(siteBuiltTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGcTotal)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFabTotal)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-green-600 font-semibold">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          <tr>
                            <td className="px-3 py-2 pl-6">02 Existing Conditions</td>
                            <td className="px-3 py-2 text-right">$124,789</td>
                            <td className="px-3 py-2 text-right">$5</td>
                            <td className="px-3 py-2 text-right">$124,789</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">$124,789</td>
                            <td className="px-3 py-2 text-right">$5</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '31 Earthwork');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">31 Earthwork</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{raapFab === 0 ? '$0' : formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-green-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '32 Exterior Improvements');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">32 Exterior Improvements</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{raapFab === 0 ? '$0' : formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{savings === 0 ? '$0' : (savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`)}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '33 Utilities');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">33 Utilities</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{raapFab === 0 ? '$0' : formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{savings === 0 ? '$0' : (savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`)}</td>
                              </tr>
                            );
                          })()}

                          {/* GC Charges Section - Using real cost breakdown data */}
                          {(() => {
                            // Calculate totals for the GC Charges section
                            const generalReqData = getCostBreakdownByCategory(costBreakdowns, '01 General Requirements');
                            const feesData = getCostBreakdownByCategory(costBreakdowns, '00 Fees');
                            
                            const siteBuiltTotal = (parseFloat(generalReqData?.siteBuiltCost || '0') + 
                                                   parseFloat(feesData?.siteBuiltCost || '0'));
                            const raapGcTotal = (parseFloat(generalReqData?.raapGcCost || '0') + 
                                               parseFloat(feesData?.raapGcCost || '0'));
                            const raapFabTotal = (parseFloat(generalReqData?.raapFabCost || '0') + 
                                                 parseFloat(feesData?.raapFabCost || '0'));
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-gray-100">
                                <td className="px-3 py-2 font-semibold text-gray-800">GC Charges</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(siteBuiltTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGcTotal)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFabTotal)}</td>
                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '01 General Requirements');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">01 General Requirements</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                          {(() => {
                            const itemData = getCostBreakdownByCategory(costBreakdowns, '00 Fees');
                            if (!itemData) return null;
                            const siteBuilt = parseFloat(itemData.siteBuiltCost || '0');
                            const raapGc = parseFloat(itemData.raapGcCost || '0');
                            const raapFab = parseFloat(itemData.raapFabCost || '0');
                            const raapTotal = raapGc + raapFab;
                            const savings = siteBuilt - raapTotal;
                            return (
                              <tr>
                                <td className="px-3 py-2 pl-6">00 Fees</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(siteBuilt)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(siteBuilt.toString())}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapGc)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapFab)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-2 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-2 text-right text-red-600">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}

                          {/* Total Row - Using real cost breakdown data */}
                          {(() => {
                            // Calculate project totals from all cost breakdowns
                            const allCosts = costBreakdowns || [];
                            
                            const siteBuiltTotal = allCosts.reduce((sum, item) => sum + parseFloat(item.siteBuiltCost || '0'), 0);
                            const raapGcTotal = allCosts.reduce((sum, item) => sum + parseFloat(item.raapGcCost || '0'), 0);
                            const raapFabTotal = allCosts.reduce((sum, item) => sum + parseFloat(item.raapFabCost || '0'), 0);
                            const raapTotal = raapGcTotal + raapFabTotal;
                            const savings = siteBuiltTotal - raapTotal;
                            
                            return (
                              <tr className="bg-gray-700 text-white font-bold text-base">
                                <td className="px-3 py-3">PROJECT TOTAL</td>
                                <td className="px-3 py-3 text-right">{formatCurrency(siteBuiltTotal)}</td>
                                <td className="px-3 py-3 text-right">{calculateCostPerSf(siteBuiltTotal.toString())}</td>
                                <td className="px-3 py-3 text-right">{formatCurrency(raapGcTotal)}</td>
                                <td className="px-3 py-3 text-right">{formatCurrency(raapFabTotal)}</td>
                                <td className="px-3 py-3 text-right">{formatCurrency(raapTotal)}</td>
                                <td className="px-3 py-3 text-right">{calculateCostPerSf(raapTotal.toString())}</td>
                                <td className="px-3 py-3 text-right text-red-400">{savings >= 0 ? formatCurrency(savings) : `(${formatCurrency(Math.abs(savings))})`}</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Project Cost Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <span>RaaP Modular Cost</span>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">{formatCurrency(project.modularTotalCost)}</div>
                            <div className="text-sm text-gray-600">{formatCurrency(project.modularCostPerSf)}/sf • {formatNumber(project.modularTimelineMonths)} Months</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Traditional Site-Built</span>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(project.siteBuiltTotalCost)}</div>
                            <div className="text-sm text-gray-600">{formatCurrency(project.siteBuiltCostPerSf)}/sf • {formatNumber(project.siteBuiltTimelineMonths)} Months</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span>Cost Savings</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{formatCurrency(calculateCostSavings(project.siteBuiltTotalCost, project.modularTotalCost))}</div>
                            <div className="text-sm text-gray-600">{formatNumber(project.costSavingsPercent)}% savings</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Per Unit Analysis</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Number of Units</span>
                            <span className="font-semibold">{(project.studioUnits || 0) + (project.oneBedUnits || 0) + (project.twoBedUnits || 0) + (project.threeBedUnits || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Unit Area</span>
                            <span className="font-semibold">792 sf</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between">
                            <span>Cost per Unit (RaaP)</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(project.modularCostPerUnit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost per Sq Ft (RaaP)</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(project.modularCostPerSf)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Logistics</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Score: {scores.logistics}/5.0
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadLogisticsData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </button>
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadLogisticsData(file);
                        }}
                        className="hidden"
                      />
                      Upload CSV
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Logistics Assessment</h3>
                      <div className="text-3xl font-bold text-green-600">{scores.logistics}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of {scores.logistics}/5:</strong> The site presents ideal logistics conditions for modular construction with excellent highway access, ample staging space, and minimal delivery constraints. The proximity to Highway 70 and straightforward route from the Tracy fabrication facility ensures efficient module transportation and installation.
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Weight: 15% of overall feasibility score
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Delivery Route: Boise to Project Site</h4>
                    <RouteMap 
                      destinationAddress={project.address}
                      projectName={project.name}
                      height="400px"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Transportation & Access</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Highway Access</span>
                            <span className="text-green-600 font-semibold">✓ Excellent</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Route Complexity</span>
                            <span className="text-green-600 font-semibold">✓ Simple</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Street Width</span>
                            <span className="text-green-600 font-semibold">✓ Adequate</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Turning Radius</span>
                            <span className="text-green-600 font-semibold">✓ Sufficient</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Bridge Clearances</span>
                            <span className="text-green-600 font-semibold">✓ No Issues</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Site Staging</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Staging Area</span>
                            <span className="text-green-600 font-semibold">✓ Ample Space</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Crane Access</span>
                            <span className="text-green-600 font-semibold">✓ Multiple Points</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Utility Coordination</span>
                            <span className="text-green-600 font-semibold">✓ Straightforward</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Traffic Impact</span>
                            <span className="text-green-600 font-semibold">✓ Minimal</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Neighbor Impact</span>
                            <span className="text-green-600 font-semibold">✓ Low</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Delivery Schedule</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Phase</th>
                            <th className="px-4 py-3 text-left font-semibold">Modules</th>
                            <th className="px-4 py-3 text-left font-semibold">Duration</th>
                            <th className="px-4 py-3 text-left font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3">Foundation Prep</td>
                            <td className="px-4 py-3">0</td>
                            <td className="px-4 py-3">4 weeks</td>
                            <td className="px-4 py-3">Site preparation concurrent with module fabrication</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Ground Floor</td>
                            <td className="px-4 py-3">8 modules</td>
                            <td className="px-4 py-3">1 week</td>
                            <td className="px-4 py-3">2 modules per day delivery & installation</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Second Floor</td>
                            <td className="px-4 py-3">8 modules</td>
                            <td className="px-4 py-3">1 week</td>
                            <td className="px-4 py-3">Same delivery pace maintained</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Third Floor</td>
                            <td className="px-4 py-3">8 modules</td>
                            <td className="px-4 py-3">1 week</td>
                            <td className="px-4 py-3">Final installation phase</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Logistics Advantages</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Direct highway access minimizes delivery time and costs</li>
                      <li>• Large, flat site provides excellent staging opportunities</li>
                      <li>• No special permits required for standard module transport</li>
                      <li>• Multiple crane positions possible for efficient installation</li>
                      <li>• Standard utility coordination required</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buildtime">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Build Time</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Score: {scores.buildTime}/5.0
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={downloadBuildTimeData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </button>
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadBuildTimeData(file);
                        }}
                        className="hidden"
                      />
                      Upload CSV
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Build Time Assessment</h3>
                      <div className="text-3xl font-bold text-green-600">{scores.buildTime}/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of {scores.buildTime}/5:</strong> 30.5 months total project delivery using modular approach vs 41 months for site built. 
                      Savings of 10.5 months (25% timeline reduction).
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Weight: 10% of overall feasibility score
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Timeline Comparison</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">{formatNumber(project.modularTimelineMonths)}</div>
                          <div className="font-semibold text-blue-600">RaaP Modular</div>
                          <div className="text-xs text-gray-600">months total</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded border">
                          <div className="text-2xl font-bold text-gray-600">{formatNumber(project.siteBuiltTimelineMonths)}</div>
                          <div className="font-semibold text-gray-600">Site-Built</div>
                          <div className="text-xs text-gray-600">months total</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{project.siteBuiltTimelineMonths && project.modularTimelineMonths ? Math.round(((Number(project.siteBuiltTimelineMonths) - Number(project.modularTimelineMonths)) / Number(project.siteBuiltTimelineMonths)) * 100) : 0}%</div>
                          <div className="font-semibold text-green-600">Time Savings</div>
                          <div className="text-xs text-gray-600">reduction</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Key Advantages</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Parallel Fabrication</span>
                            <span className="text-green-600 font-semibold">✓ Major Advantage</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Weather Independence</span>
                            <span className="text-green-600 font-semibold">✓ Factory Control</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Quality Control</span>
                            <span className="text-green-600 font-semibold">✓ Reduced Rework</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Site Coordination</span>
                            <span className="text-blue-600 font-semibold">→ Simplified</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Inspection Process</span>
                            <span className="text-blue-600 font-semibold">→ Streamlined</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Timeline Visualization</h4>
                    <div className="w-full">
                      <img 
                        src={timelineComparisonImage} 
                        alt="Timeline comparison showing modular vs site-built construction phases and duration"
                        className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white"
                        style={{ maxHeight: '50vh' }}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Phase-by-Phase Breakdown</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Project Phase</th>
                            <th className="px-4 py-3 text-left font-semibold">Site-Built</th>
                            <th className="px-4 py-3 text-left font-semibold">RaaP Modular</th>
                            <th className="px-4 py-3 text-left font-semibold">Time Savings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3">Pre-Construction</td>
                            <td className="px-4 py-3">8 months</td>
                            <td className="px-4 py-3">8 months</td>
                            <td className="px-4 py-3">0 months</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Foundation & Site</td>
                            <td className="px-4 py-3">4 months</td>
                            <td className="px-4 py-3">4 months</td>
                            <td className="px-4 py-3">0 months</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Structure & MEP</td>
                            <td className="px-4 py-3">18 months</td>
                            <td className="px-4 py-3">8 months</td>
                            <td className="px-4 py-3 text-green-600 font-semibold">10 months</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Finishes & MEP</td>
                            <td className="px-4 py-3">8 months</td>
                            <td className="px-4 py-3">7.5 months</td>
                            <td className="px-4 py-3 text-green-600 font-semibold">0.5 months</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">Final Inspections</td>
                            <td className="px-4 py-3">3 months</td>
                            <td className="px-4 py-3">3 months</td>
                            <td className="px-4 py-3">0 months</td>
                          </tr>
                          <tr className="bg-gray-50 font-semibold">
                            <td className="px-4 py-3">Total Duration</td>
                            <td className="px-4 py-3">41 months</td>
                            <td className="px-4 py-3">30.5 months</td>
                            <td className="px-4 py-3 text-green-600">10.5 months</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Modular Time Advantages</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Factory fabrication concurrent with site preparation</li>
                      <li>• Weather-independent production maintains schedule</li>
                      <li>• Quality control reduces field rework and delays</li>
                      <li>• Simplified inspection process with factory pre-approval</li>
                      <li>• Reduced coordination complexity on-site</li>
                      <li>• Earlier occupancy and faster return on investment</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Assessment Button */}
        {!project.modularFeasibilityComplete && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Complete ModularFeasibility Assessment</h3>
                  <p className="text-gray-600">
                    Once you've reviewed all the assessment criteria and are satisfied with the feasibility analysis, 
                    mark this application as complete to proceed to SmartStart.
                  </p>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => markAsComplete.mutate()}
                  disabled={markAsComplete.isPending}
                  data-testid="button-complete-assessment"
                >
                  {markAsComplete.isPending ? "Completing..." : "Complete Assessment"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {project.modularFeasibilityComplete && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Assessment Complete</h3>
                    <p className="text-green-700">
                      Your ModularFeasibility assessment is complete. You can now proceed to SmartStart.
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => navigate(`/projects/${projectId}/workflow`)}
                  data-testid="button-continue-workflow"
                >
                  Continue to Workflow
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}