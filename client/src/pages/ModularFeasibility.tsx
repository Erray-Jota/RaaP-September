import { useState, useMemo } from "react";
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
import { generateProjectPDF } from "@/lib/pdfGenerator";
import type { Project, CostBreakdown } from "@shared/schema";
import { calculateProjectScores, isSampleProject } from "@/lib/scoring";

// Import generated images for Massing tab
import floorPlanImage from "@assets/Vallejo Floor Plan 2_1757773129441.png";
import buildingRenderingImage from "@assets/Vallejo Building 2_1757773134770.png";
import sitePlanImage from "@assets/Vallejo Site 2_1757773140827.png";
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

  // Handle authentication errors
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

  // Function to download cost breakdown as CSV
  const downloadCostBreakdown = () => {
    const costBreakdownData = [
      // Header
      ['MasterFormat Division', 'Site Built Total', 'Site Built $/sf', 'RaaP GC', 'RaaP Fab', 'RaaP Total', 'RaaP $/sf', 'Savings'],
      
      // Concrete, Masonry & Metals Section
      ['Concrete, Masonry & Metals', isSampleProject(project.name) ? '$1,311,770' : '$6,553,211', isSampleProject(project.name) ? '$50' : '$38', isSampleProject(project.name) ? '$1,147,404' : '$4,790,786', isSampleProject(project.name) ? '$281,220' : '$867,184', isSampleProject(project.name) ? '$1,428,623' : '$5,657,970', isSampleProject(project.name) ? '$54' : '$39', isSampleProject(project.name) ? '-$116,853' : '($895,241)'],
      ['  03 Concrete', isSampleProject(project.name) ? '$407,021' : '$2,533,115', isSampleProject(project.name) ? '$16' : '$15', isSampleProject(project.name) ? '$285,136' : '$1,373,299', isSampleProject(project.name) ? '$164,393' : '$625,628', isSampleProject(project.name) ? '$449,528' : '$1,998,927', isSampleProject(project.name) ? '$17' : '$14', isSampleProject(project.name) ? '-$42,507' : '($534,188)'],
      ['  04 Masonry', isSampleProject(project.name) ? '$233,482' : '$916,443', isSampleProject(project.name) ? '$9' : '$5', isSampleProject(project.name) ? '$260,237' : '$845,392', isSampleProject(project.name) ? '-' : '0', isSampleProject(project.name) ? '$260,237' : '$845,392', isSampleProject(project.name) ? '$10' : '$6', isSampleProject(project.name) ? '-$26,755' : '($71,051)'],
      ['  05 Metal', isSampleProject(project.name) ? '$671,267' : '$3,103,653', isSampleProject(project.name) ? '$26' : '$18', isSampleProject(project.name) ? '$602,031' : '$2,572,095', isSampleProject(project.name) ? '$116,827' : '$241,556', isSampleProject(project.name) ? '$718,859' : '$2,813,651', isSampleProject(project.name) ? '$27' : '$20', isSampleProject(project.name) ? '-$47,592' : '($290,003)'],
      
      // Rooms Section
      ['Rooms', isSampleProject(project.name) ? '$4,452,553' : '$17,692,497', isSampleProject(project.name) ? '$171' : '$102', isSampleProject(project.name) ? '$465,938' : '$1,671,442', isSampleProject(project.name) ? '$4,121,807' : '$11,037,874', isSampleProject(project.name) ? '$4,587,745' : '$12,709,316', isSampleProject(project.name) ? '$174' : '$88', isSampleProject(project.name) ? '-$135,192' : '($4,983,181)'],
      ['  06 Wood & Plastics', isSampleProject(project.name) ? '$1,982,860' : '$8,643,831', isSampleProject(project.name) ? '$76' : '$50', isSampleProject(project.name) ? '$14,171' : '$41,318', isSampleProject(project.name) ? '$2,137,612' : '$6,378,393', isSampleProject(project.name) ? '$2,151,783' : '$6,419,712', isSampleProject(project.name) ? '$82' : '$45', isSampleProject(project.name) ? '-$168,923' : '($2,224,120)'],
      ['  07 Thermal & Moisture Protection', isSampleProject(project.name) ? '$490,766' : '$2,325,482', isSampleProject(project.name) ? '$19' : '$13', isSampleProject(project.name) ? '$289,407' : '$1,129,942', isSampleProject(project.name) ? '$293,030' : '$960,368', isSampleProject(project.name) ? '$582,437' : '$2,090,309', isSampleProject(project.name) ? '$22' : '$15', isSampleProject(project.name) ? '-$91,671' : '($235,172)'],
      ['  08 Openings', isSampleProject(project.name) ? '$486,606' : '$1,393,966', isSampleProject(project.name) ? '$19' : '$8', isSampleProject(project.name) ? '$138,123' : '$440,895', isSampleProject(project.name) ? '$337,164' : '$792,909', isSampleProject(project.name) ? '$475,287' : '$1,233,804', isSampleProject(project.name) ? '$18' : '$9', isSampleProject(project.name) ? '$11,319' : '($160,163)'],
      ['  09 Finishes', isSampleProject(project.name) ? '$1,492,321' : '$5,329,218', isSampleProject(project.name) ? '$57' : '$31', isSampleProject(project.name) ? '$24,237' : '$59,288', isSampleProject(project.name) ? '$1,354,001' : '$2,906,204', isSampleProject(project.name) ? '$1,378,238' : '$2,965,492', isSampleProject(project.name) ? '$52' : '$21', isSampleProject(project.name) ? '$114,083' : '($2,363,726)'],
      
      // Equipment & Special Construction Section
      ['Equipment & Special Construction', isSampleProject(project.name) ? '$221,062' : '$656,351', isSampleProject(project.name) ? '$9' : '$4', isSampleProject(project.name) ? '$68,827' : '$99,544', isSampleProject(project.name) ? '$139,859' : '$486,539', isSampleProject(project.name) ? '$208,686' : '$586,082', isSampleProject(project.name) ? '$8' : '$4', isSampleProject(project.name) ? '$12,376' : '($70,269)'],
      ['  10 Specialties', isSampleProject(project.name) ? '$55,363' : '$200,836', isSampleProject(project.name) ? '$2' : '$1', isSampleProject(project.name) ? '-' : '0', isSampleProject(project.name) ? '$47,078' : '$161,890', isSampleProject(project.name) ? '$47,078' : '$161,890', isSampleProject(project.name) ? '$2' : '$1', isSampleProject(project.name) ? '$8,285' : '($38,946)'],
      ['  11 Equipment', isSampleProject(project.name) ? '$16,837' : '$29,531', isSampleProject(project.name) ? '$1' : '$0', isSampleProject(project.name) ? '$16,837' : '$29,531', isSampleProject(project.name) ? '-' : '0', isSampleProject(project.name) ? '$16,837' : '$29,531', isSampleProject(project.name) ? '$1' : '$0', isSampleProject(project.name) ? '$0' : '$0'],
      ['  12 Furnishing', isSampleProject(project.name) ? '$99,730' : '$374,255', isSampleProject(project.name) ? '$4' : '$2', isSampleProject(project.name) ? '$2,858' : '$18,284', isSampleProject(project.name) ? '$92,781' : '$324,648', isSampleProject(project.name) ? '$95,639' : '$342,932', isSampleProject(project.name) ? '$4' : '$2', isSampleProject(project.name) ? '$4,091' : '($31,322)'],
      ['  13 Special Construction', isSampleProject(project.name) ? '$49,132' : '$51,729', isSampleProject(project.name) ? '$2' : '$0', isSampleProject(project.name) ? '$49,132' : '$51,729', isSampleProject(project.name) ? '-' : '0', isSampleProject(project.name) ? '$49,132' : '$51,729', isSampleProject(project.name) ? '$2' : '$0', isSampleProject(project.name) ? '$0' : '$0'],
      
      // MEPs Section
      ['MEPs', isSampleProject(project.name) ? '$1,938,147' : '$9,852,336', isSampleProject(project.name) ? '$74' : '$57', isSampleProject(project.name) ? '$1,026,490' : '$4,466,118', isSampleProject(project.name) ? '$1,323,688' : '$3,548,625', isSampleProject(project.name) ? '$2,350,178' : '$8,014,743', isSampleProject(project.name) ? '$90' : '$56', isSampleProject(project.name) ? '-$412,031' : '($1,837,593)'],
      ['  21 Fire Suppression', isSampleProject(project.name) ? '$234,567' : '$982,245', isSampleProject(project.name) ? '$9' : '$6', isSampleProject(project.name) ? '$156,789' : '$346,948', isSampleProject(project.name) ? '$123,456' : '$351,524', isSampleProject(project.name) ? '$280,245' : '$698,472', isSampleProject(project.name) ? '$11' : '$5', isSampleProject(project.name) ? '-$45,678' : '($283,774)'],
      ['  22 Plumbing', isSampleProject(project.name) ? '$456,789' : '$2,403,740', isSampleProject(project.name) ? '$18' : '$14', isSampleProject(project.name) ? '$234,567' : '$1,124,362', isSampleProject(project.name) ? '$345,678' : '$1,023,475', isSampleProject(project.name) ? '$580,245' : '$2,147,838', isSampleProject(project.name) ? '$22' : '$15', isSampleProject(project.name) ? '-$123,456' : '($255,902)'],
      ['  23 HVAC', isSampleProject(project.name) ? '$678,901' : '$2,505,408', isSampleProject(project.name) ? '$26' : '$14', isSampleProject(project.name) ? '$345,678' : '$183,153', isSampleProject(project.name) ? '$456,789' : '$1,297,260', isSampleProject(project.name) ? '$802,467' : '$1,480,413', isSampleProject(project.name) ? '$31' : '$10', isSampleProject(project.name) ? '-$123,566' : '($1,024,994)'],
      ['  26 Electrical', isSampleProject(project.name) ? '$567,890' : '$3,960,944', isSampleProject(project.name) ? '$22' : '$23', isSampleProject(project.name) ? '$289,456' : '$2,811,655', isSampleProject(project.name) ? '$398,765' : '$876,365', isSampleProject(project.name) ? '$688,221' : '$3,688,021', isSampleProject(project.name) ? '$26' : '$26', isSampleProject(project.name) ? '-$120,331' : '($272,923)'],
      
      // Site Work Section
      ['Site Work', isSampleProject(project.name) ? '$1,247,892' : '$4,233,670', isSampleProject(project.name) ? '$48' : '$24', isSampleProject(project.name) ? '$1,247,892' : '$4,239,520', '$0', isSampleProject(project.name) ? '$1,247,892' : '$4,239,520', isSampleProject(project.name) ? '$48' : '$30', isSampleProject(project.name) ? '$0' : '$5,851'],
      ['  02 Existing Conditions', isSampleProject(project.name) ? '$124,789' : '$0', isSampleProject(project.name) ? '$5' : '$0', isSampleProject(project.name) ? '$124,789' : '$0', '$0', isSampleProject(project.name) ? '$124,789' : '$0', isSampleProject(project.name) ? '$5' : '$0', '$0'],
      ['  31 Earthwork', isSampleProject(project.name) ? '$456,123' : '$1,146,618', isSampleProject(project.name) ? '$17' : '$7', isSampleProject(project.name) ? '$456,123' : '$1,152,469', '$0', isSampleProject(project.name) ? '$456,123' : '$1,152,469', isSampleProject(project.name) ? '$17' : '$8', isSampleProject(project.name) ? '$0' : '$5,851'],
      ['  32 Exterior Improvements', isSampleProject(project.name) ? '$332,456' : '$1,521,663', isSampleProject(project.name) ? '$13' : '$9', isSampleProject(project.name) ? '$332,456' : '$1,521,663', '$0', isSampleProject(project.name) ? '$332,456' : '$1,521,663', isSampleProject(project.name) ? '$13' : '$11', '$0'],
      ['  33 Utilities', isSampleProject(project.name) ? '$334,524' : '$1,565,388', isSampleProject(project.name) ? '$13' : '$9', isSampleProject(project.name) ? '$334,524' : '$1,565,388', '$0', isSampleProject(project.name) ? '$334,524' : '$1,565,388', isSampleProject(project.name) ? '$13' : '$11', '$0'],
      
      // GC Charges Section
      ['GC Charges', isSampleProject(project.name) ? '$892,345' : '$7,232,941', isSampleProject(project.name) ? '$34' : '$42', isSampleProject(project.name) ? '$456,789' : '$2,824,374', isSampleProject(project.name) ? '$234,567' : '$1,652,873', isSampleProject(project.name) ? '$691,356' : '$4,477,246', isSampleProject(project.name) ? '$26' : '$31', isSampleProject(project.name) ? '$200,989' : '($2,755,695)'],
      ['  01 General Requirements', isSampleProject(project.name) ? '$692,345' : '$2,443,868', isSampleProject(project.name) ? '$27' : '$14', isSampleProject(project.name) ? '$356,789' : '$959,509', isSampleProject(project.name) ? '$134,567' : '$1,012,388', isSampleProject(project.name) ? '$491,356' : '$1,971,897', isSampleProject(project.name) ? '$19' : '$14', isSampleProject(project.name) ? '$200,989' : '($471,972)'],
      ['  00 Fees', isSampleProject(project.name) ? '$200,000' : '$4,789,073', isSampleProject(project.name) ? '$8' : '$28', isSampleProject(project.name) ? '$100,000' : '$1,864,865', isSampleProject(project.name) ? '$100,000' : '$640,485', isSampleProject(project.name) ? '$200,000' : '$2,505,350', isSampleProject(project.name) ? '$8' : '$17', isSampleProject(project.name) ? '$0' : '($2,283,723)'],
      
      // Project Total
      ['', '', '', '', '', '', '', ''], // Empty row for spacing
      ['PROJECT TOTAL', isSampleProject(project.name) ? '$10,060,303' : '$46,221,006', isSampleProject(project.name) ? '$387' : '$266', 
       isSampleProject(project.name) ? '$4,777,945' : '$18,091,784', isSampleProject(project.name) ? '$6,462,156' : '$17,593,094', 
       isSampleProject(project.name) ? '$11,240,101' : '$35,684,879', isSampleProject(project.name) ? '$432' : '$248', 
       isSampleProject(project.name) ? '-$179,798' : '($10,536,128)']
    ];
    
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

  // Use deterministic scores that match ProjectCard exactly
  const projectScores = useMemo(() => {
    return calculateProjectScores(Number(project.id), project.name, project.overallScore || undefined);
  }, [project.id, project.name, project.overallScore]);
  
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
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Project Summary</span>
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
                        {isSampleProject(project.name) ? (
                          '24 units of Affordable Housing, 6 X 1BR, 12 X 2BR, 6 X 3BR. Dimensions 142 (L) X 61 (W) X 36 (H). Construction Type: V-A. 24 Parking Spaces.'
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

                  {/* Image and Specifications Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <img 
                        src={olivehurstMapImage} 
                        alt="Serinity Village project location in Olivehurst, California showing regional context and site accessibility" 
                        className="w-full h-64 rounded-lg object-contain bg-white border"
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
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Site & Zoning</span>
                  <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
                    Score: {scores.zoning}/5.0
                  </Badge>
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
                          <p><strong>Address:</strong> {isSampleProject(project.name) ? '1234 Olivehurst Avenue' : project.address}</p>
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
                            <td className="px-4 py-3">65 ft max</td>
                            <td className="px-4 py-3">57 ft</td>
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
                            <td className="px-4 py-3">{isSampleProject(project.name) ? '2.0 spaces/unit' : '1.0 spaces/unit'}</td>
                            <td className="px-4 py-3">{isSampleProject(project.name) ? '1.5 spaces/unit' : '0.97 spaces/unit'}</td>
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
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Massing</span>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                    Score: {scores.massing}/5.0
                  </Badge>
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
                      {isSampleProject(project.name) ? 'Modular construction provides optimal efficiency for this unit configuration and site layout.' : 'We can achieve the goal of 103 units and unit mix (14 studios, 67 1BR, 22 2BR) as the traditional original design.'}
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
                          {isSampleProject(project.name) ? (
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
                                  <span className="font-semibold">{isSampleProject(project.name) ? '24 units' : '103 units'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Building Stories</span>
                                  <span className="font-semibold">{isSampleProject(project.name) ? '3 stories' : '5 stories'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Building Height</span>
                                  <span className="font-semibold">{isSampleProject(project.name) ? '32 feet' : '57 feet'}</span>
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
                                  <span className="font-semibold">{isSampleProject(project.name) ? '24 spaces' : '100 spaces'}</span>
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
                                  <span className="font-semibold">{isSampleProject(project.name) ? 'V-A' : 'III-A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Structural System</span>
                                  <span className="font-semibold">{isSampleProject(project.name) ? 'Light Frame' : 'Wood'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Base</span>
                                  <span className="font-semibold">{isSampleProject(project.name) ? 'Concrete Slab' : 'Concrete Podium'}</span>
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
                                  <td className="px-4 py-3">{isSampleProject(project.name) ? '24 units' : '103 units'}</td>
                                  <td className="px-4 py-3">{isSampleProject(project.name) ? '24 units' : '103 units'}</td>
                                  <td className="px-4 py-3"><span className="text-green-600 font-semibold">✓ No Change</span></td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-3">{isSampleProject(project.name) ? 'Building Footprint' : 'Gross Sq. Ft.'}</td>
                                  <td className="px-4 py-3">{isSampleProject(project.name) ? '6,336 sf' : '142,924 sf'}</td>
                                  <td className="px-4 py-3">{isSampleProject(project.name) ? '6,336 sf' : '143,648 sf'}</td>
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
                              src={floorPlanImage} 
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
                            src={buildingRenderingImage} 
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
                            src={sitePlanImage} 
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
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5" />
                  <span>Sustainability</span>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                    Score: {scores.sustainability}/5.0
                  </Badge>
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
                          {/* Concrete, Masonry & Metals Section */}
                          <tr className="bg-blue-50">
                            <td className="px-3 py-2 font-semibold text-blue-800">Concrete, Masonry & Metals</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$1,311,770' : '$6,553,211'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$50' : '$38'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,147,404' : '$4,790,786'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$281,220' : '$867,184'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$1,428,623' : '$5,657,970'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$54' : '$39'}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">{isSampleProject(project.name) ? '-$116,853' : '($895,241)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">03 Concrete</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$407,021' : '$2,533,115'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$16' : '$15'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$285,136' : '$1,373,299'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$164,393' : '$625,628'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$449,528' : '$1,998,927'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$17' : '$14'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$42,507' : '($534,188)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">04 Masonry</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$233,482' : '$916,443'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$9' : '$5'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$260,237' : '$845,392'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '-' : '0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$260,237' : '$845,392'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$10' : '$6'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$26,755' : '($71,051)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">05 Metal</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$671,267' : '$3,103,653'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$26' : '$18'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$602,031' : '$2,572,095'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$116,827' : '$241,556'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$718,859' : '$2,813,651'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$27' : '$20'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$47,592' : '($290,003)'}</td>
                          </tr>

                          {/* Rooms Section */}
                          <tr className="bg-green-50">
                            <td className="px-3 py-2 font-semibold text-green-800">Rooms</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$4,452,553' : '$17,692,497'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$171' : '$102'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$465,938' : '$1,671,442'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$4,121,807' : '$11,037,874'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$4,587,745' : '$12,709,316'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$174' : '$88'}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">{isSampleProject(project.name) ? '-$135,192' : '($4,983,181)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">06 Wood & Plastics</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,982,860' : '$8,643,831'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$76' : '$50'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$14,171' : '$41,318'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2,137,612' : '$6,378,393'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2,151,783' : '$6,419,712'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$82' : '$45'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$168,923' : '($2,224,120)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">07 Thermal & Moisture Protection</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$490,766' : '$2,325,482'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$19' : '$13'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$289,407' : '$1,129,942'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$293,030' : '$960,368'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$582,437' : '$2,090,309'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$22' : '$15'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$91,671' : '($235,172)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">08 Openings</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$486,606' : '$1,393,966'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$19' : '$8'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$138,123' : '$440,895'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$337,164' : '$792,909'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$475,287' : '$1,233,804'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$18' : '$9'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '$11,319' : '($160,163)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">09 Finishes</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,492,321' : '$5,329,218'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$57' : '$31'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$24,237' : '$59,288'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,354,001' : '$2,906,204'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,378,238' : '$2,965,492'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$52' : '$21'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '$114,083' : '($2,363,726)'}</td>
                          </tr>

                          {/* Equipment & Special Construction Section */}
                          <tr className="bg-orange-50">
                            <td className="px-3 py-2 font-semibold text-orange-800">Equipment & Special Construction</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$221,062' : '$656,351'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$9' : '$4'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$68,827' : '$99,544'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$139,859' : '$486,539'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$208,686' : '$586,082'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$8' : '$4'}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">{isSampleProject(project.name) ? '$12,376' : '($70,269)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">10 Specialties</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$55,363' : '$200,836'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2' : '$1'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '-' : '0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$47,078' : '$161,890'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$47,078' : '$161,890'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2' : '$1'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '$8,285' : '($38,946)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">11 Equipment</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$16,837' : '$29,531'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1' : '$0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$16,837' : '$29,531'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '-' : '0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$16,837' : '$29,531'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1' : '$0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$0' : '$0'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">12 Furnishing</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$99,730' : '$374,255'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$4' : '$2'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2,858' : '$18,284'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$92,781' : '$324,648'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$95,639' : '$342,932'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$4' : '$2'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '$4,091' : '($31,322)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">13 Special Construction</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$49,132' : '$51,729'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2' : '$0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$49,132' : '$51,729'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '-' : '0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$49,132' : '$51,729'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$2' : '$0'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$0' : '$0'}</td>
                          </tr>

                          {/* MEPs Section */}
                          <tr className="bg-purple-50">
                            <td className="px-3 py-2 font-semibold text-purple-800">MEPs</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$1,938,147' : '$9,852,336'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$74' : '$57'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,026,490' : '$4,466,118'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,323,688' : '$3,548,625'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$2,350,178' : '$8,014,743'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$90' : '$56'}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">{isSampleProject(project.name) ? '-$412,031' : '($1,837,593)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">21 Fire Suppression</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$234,567' : '$982,245'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$9' : '$6'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$156,789' : '$346,948'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$123,456' : '$351,524'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$280,245' : '$698,472'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$11' : '$5'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$45,678' : '($283,774)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">22 Plumbing</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$456,789' : '$2,403,740'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$18' : '$14'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$234,567' : '$1,124,362'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$345,678' : '$1,023,475'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$580,245' : '$2,147,838'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$22' : '$15'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$123,456' : '($255,902)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">23 HVAC</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$678,901' : '$2,505,408'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$26' : '$14'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$345,678' : '$183,153'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$456,789' : '$1,297,260'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$802,467' : '$1,480,413'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$31' : '$10'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$123,566' : '($1,024,994)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">26 Electrical</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$567,890' : '$3,960,944'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$22' : '$23'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$289,456' : '$2,811,655'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$398,765' : '$876,365'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$688,221' : '$3,688,021'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$26' : '$26'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '-$120,331' : '($272,923)'}</td>
                          </tr>

                          {/* Site Work Section */}
                          <tr className="bg-brown-50 border-gray-300 border-t-2">
                            <td className="px-3 py-2 font-semibold text-yellow-900">Site Work</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$1,247,892' : '$4,233,670'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$48' : '$24'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$1,247,892' : '$4,239,520'}</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$1,247,892' : '$4,239,520'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$48' : '$30'}</td>
                            <td className="px-3 py-2 text-right text-green-600 font-semibold">{isSampleProject(project.name) ? '$0' : '$5,851'}</td>
                          </tr>
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
                          <tr>
                            <td className="px-3 py-2 pl-6">31 Earthwork</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$456,123' : '$1,146,618'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$17' : '$7'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$456,123' : '$1,152,469'}</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$456,123' : '$1,152,469'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$17' : '$8'}</td>
                            <td className="px-3 py-2 text-right text-green-600">{isSampleProject(project.name) ? '$0' : '$5,851'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">32 Exterior Improvements</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$332,456' : '$1,521,663'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$13' : '$9'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$332,456' : '$1,521,663'}</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$332,456' : '$1,521,663'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$13' : '$11'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$0' : '$0'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">33 Utilities</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$334,524' : '$1,565,388'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$13' : '$9'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$334,524' : '$1,565,388'}</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$334,524' : '$1,565,388'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$13' : '$11'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$0' : '$0'}</td>
                          </tr>

                          {/* GC Charges Section */}
                          <tr className="bg-gray-100">
                            <td className="px-3 py-2 font-semibold text-gray-800">GC Charges</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$892,345' : '$7,232,941'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$34' : '$42'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$456,789' : '$2,824,374'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$234,567' : '$1,652,873'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{isSampleProject(project.name) ? '$691,356' : '$4,477,246'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$26' : '$31'}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">{isSampleProject(project.name) ? '$200,989' : '($2,755,695)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">01 General Requirements</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$692,345' : '$2,443,868'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$27' : '$14'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$356,789' : '$959,509'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$134,567' : '$1,012,388'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$491,356' : '$1,971,897'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$19' : '$14'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '$200,989' : '($471,972)'}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">00 Fees</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$200,000' : '$4,789,073'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$8' : '$28'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$100,000' : '$1,864,865'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$100,000' : '$640,485'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$200,000' : '$2,505,350'}</td>
                            <td className="px-3 py-2 text-right">{isSampleProject(project.name) ? '$8' : '$17'}</td>
                            <td className="px-3 py-2 text-right text-red-600">{isSampleProject(project.name) ? '$0' : '($2,283,723)'}</td>
                          </tr>

                          {/* Total Row */}
                          <tr className="bg-gray-700 text-white font-bold text-base">
                            <td className="px-3 py-3">PROJECT TOTAL</td>
                            <td className="px-3 py-3 text-right">{isSampleProject(project.name) ? '$10,060,303' : '$46,221,006'}</td>
                            <td className="px-3 py-3 text-right">{isSampleProject(project.name) ? '$387' : '$266'}</td>
                            <td className="px-3 py-3 text-right">{isSampleProject(project.name) ? '$4,777,945' : '$18,091,784'}</td>
                            <td className="px-3 py-3 text-right">{isSampleProject(project.name) ? '$6,462,156' : '$17,593,094'}</td>
                            <td className="px-3 py-3 text-right">{isSampleProject(project.name) ? '$11,240,101' : '$35,684,879'}</td>
                            <td className="px-3 py-3 text-right">{isSampleProject(project.name) ? '$432' : '$248'}</td>
                            <td className="px-3 py-3 text-right text-red-400">{isSampleProject(project.name) ? '-$179,798' : '($10,536,128)'}</td>
                          </tr>
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
                            <div className="font-semibold text-blue-600">{isSampleProject(project.name) ? '$10,821,565' : '$35,684,879'}</div>
                            <div className="text-sm text-gray-600">{isSampleProject(project.name) ? '$411/sf • 9 Months' : '$248/sf • 30.5 Months'}</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Traditional Site-Built</span>
                          <div className="text-right">
                            <div className="font-semibold">{isSampleProject(project.name) ? '$10,960,303' : '$46,221,006'}</div>
                            <div className="text-sm text-gray-600">{isSampleProject(project.name) ? '$422/sf • 13 Months' : '$319/sf • 41 Months'}</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span>Cost Savings</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{isSampleProject(project.name) ? '$138,738' : '$10,536,128'}</div>
                            <div className="text-sm text-gray-600">{isSampleProject(project.name) ? '1.2% savings' : '30% savings'}</div>
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
                            <span className="font-semibold">{isSampleProject(project.name) ? '24' : '103'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Unit Area</span>
                            <span className="font-semibold">792 sf</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between">
                            <span>Cost per Unit (RaaP)</span>
                            <span className="font-semibold text-blue-600">{isSampleProject(project.name) ? '$450,899' : '$346,455'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost per Sq Ft (RaaP)</span>
                            <span className="font-semibold text-blue-600">{isSampleProject(project.name) ? '$411' : '$248'}</span>
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
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Logistics</span>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                    Score: {scores.logistics}/5.0
                  </Badge>
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
                    <h4 className="font-semibold text-raap-dark mb-4">Delivery Route: Tracy to Olivehurst</h4>
                    <div className="w-full">
                      <img 
                        src={tracyRouteImage} 
                        alt="Route from Tracy CA to Olivehurst CA showing 1 hour 29 minute drive via Highway 99 and Highway 70"
                        className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white"
                        style={{ maxHeight: '60vh' }}
                      />
                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">103</div>
                          <div className="font-semibold text-blue-600">Distance</div>
                          <div className="text-gray-600">miles</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">1:29</div>
                          <div className="font-semibold text-green-600">Drive Time</div>
                          <div className="text-gray-600">hours</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="font-semibold text-purple-600">Permits</div>
                          <div className="text-gray-600">required</div>
                        </div>
                      </div>
                    </div>
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
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Build Time</span>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                    Score: {scores.buildTime}/5.0
                  </Badge>
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
                          <div className="text-2xl font-bold text-blue-600">30.5</div>
                          <div className="font-semibold text-blue-600">RaaP Modular</div>
                          <div className="text-xs text-gray-600">months total</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded border">
                          <div className="text-2xl font-bold text-gray-600">41</div>
                          <div className="font-semibold text-gray-600">Site-Built</div>
                          <div className="text-xs text-gray-600">months total</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded border border-green-200">
                          <div className="text-2xl font-bold text-green-600">25%</div>
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