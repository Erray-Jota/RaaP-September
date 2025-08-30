import { useState } from "react";
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

// Import generated images for Massing tab
import floorPlanImage from "@assets/Vallejo Site_1754837697661.png";
import buildingRenderingImage from "@assets/Vallejo 3D_1754837697661.png";
import sitePlanImage from "@assets/Serinity Site_1754837697659.png";
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
            <div className={`text-4xl font-bold ${getScoreColor(project.overallScore || "0")}`}>
              {project.overallScore || "0.0"}
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
              <span className="hidden sm:inline">Pricing</span>
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
                      <div className="text-4xl font-bold text-green-600">4.4/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      <strong>Good fit for modular construction</strong> with a high Modular Feasibility score of 4.4/5 based on the six criteria below, with no additional restrictions introduced by modular construction.
                    </p>
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-800 mb-2">Assessment Summary</h4>
                      <p className="text-sm text-gray-700">
                        24 units of Affordable Housing (6 x 1BR, 12 x 2BR, and 6 x 3BR units). 
                        Dimensions: 146' X 66'. 3 Floors. Construction Type: V-A. 
                        Total 24 units with 24 parking spaces.
                      </p>
                    </div>
                  </div>

                  {/* 6 Assessment Criteria Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(project.zoningScore || "0")}`}>
                        {project.zoningScore || "0.0"}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Zoning</div>
                      <div className="text-xs text-gray-400">20% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(project.massingScore || "0")}`}>
                        {project.massingScore || "0.0"}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Massing</div>
                      <div className="text-xs text-gray-400">15% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(project.sustainabilityScore || "0")}`}>
                        {project.sustainabilityScore || "0.0"}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Sustainability</div>
                      <div className="text-xs text-gray-400">20% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(project.costScore || "0")}`}>
                        {project.costScore || "0.0"}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Cost</div>
                      <div className="text-xs text-gray-400">20% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(project.logisticsScore || "0")}`}>
                        {project.logisticsScore || "0.0"}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Logistics</div>
                      <div className="text-xs text-gray-400">15% weight</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold ${getScoreColor(project.buildTimeScore || "0")}`}>
                        {project.buildTimeScore || "0.0"}
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
                <CardTitle>Zoning Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed zoning analysis will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="massing">
            <Card>
              <CardHeader>
                <CardTitle>Massing Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed massing analysis will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sustainability">
            <Card>
              <CardHeader>
                <CardTitle>Sustainability Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed sustainability analysis will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Cost Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed cost analysis will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics">
            <Card>
              <CardHeader>
                <CardTitle>Logistics Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed logistics analysis will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buildtime">
            <Card>
              <CardHeader>
                <CardTitle>Build Time Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed timeline analysis will be implemented here...</p>
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