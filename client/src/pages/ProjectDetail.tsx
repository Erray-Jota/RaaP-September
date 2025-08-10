import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  MapPin, 
  Building, 
  FileText, 
  Leaf, 
  DollarSign, 
  Truck, 
  Clock,
  Star,
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

function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
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
              onClick={() => navigate("/")}
              className="text-raap-green hover:text-green-700 mb-4 p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h2 className="text-3xl font-bold text-raap-dark mb-2">{(project as Project).name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {(project as Project).address}
            </div>
            <p className="text-gray-600">
              {(project as Project).projectType.charAt(0).toUpperCase() + (project as Project).projectType.slice(1)} Housing • {totalUnits} Units • {(project as Project).targetFloors} Stories
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor((project as Project).overallScore || "0")}`}>
              {(project as Project).overallScore || "0.0"}
            </div>
            <div className="text-sm text-gray-500 mb-4">Overall Score</div>
            <Button 
              onClick={handleDownloadReport}
              className="bg-raap-green hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
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
              <Building className="h-4 w-4" />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <img 
                      src={olivehurstMapImage} 
                      alt="Serinity Village project location in Olivehurst, California showing regional context and site accessibility" 
                      className="w-full h-48 rounded-lg object-contain bg-white border mb-4"
                    />
                    
                    <div className="bg-raap-green/10 border border-raap-green rounded-lg p-4">
                      <h4 className="font-semibold text-raap-green mb-2">Project Specifications</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Total Units: {totalUnits}</li>
                        {((project as Project).studioUnits || 0) > 0 && <li>• Studio: {(project as Project).studioUnits} units</li>}
                        {((project as Project).oneBedUnits || 0) > 0 && <li>• 1 Bedroom: {(project as Project).oneBedUnits} units</li>}
                        {((project as Project).twoBedUnits || 0) > 0 && <li>• 2 Bedroom: {(project as Project).twoBedUnits} units</li>}
                        {((project as Project).threeBedUnits || 0) > 0 && <li>• 3 Bedroom: {(project as Project).threeBedUnits} units</li>}
                        <li>• Floors: {(project as Project).targetFloors}</li>
                        {(project as Project).buildingDimensions && <li>• Dimensions: {(project as Project).buildingDimensions}</li>}
                        {(project as Project).constructionType && <li>• Construction Type: {(project as Project).constructionType}</li>}
                        <li>• Parking Spaces: {(project as Project).targetParkingSpaces}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>{parseFloat((project as Project).overallScore || "0") >= 3.5 ? "Good fit" : "Moderate fit"} for modular construction</strong> with a {parseFloat((project as Project).overallScore || "0") >= 4 ? "high" : "moderate"} Modular Feasibility score of {(project as Project).overallScore || "0.0"}/5.0 based on the six criteria assessment.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${(project as Project).modularTotalCost ? (parseFloat((project as Project).modularTotalCost!) / 1000000).toFixed(1) : "0.0"}M
                        </div>
                        <div className="text-xs text-gray-500">Modular Cost</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(project as Project).modularTimelineMonths || 0} mo
                        </div>
                        <div className="text-xs text-gray-500">Build Time</div>
                      </div>
                    </div>

                    {((project as Project).costSavingsPercent && parseFloat((project as Project).costSavingsPercent!) > 0) && (
                      <div className="mt-4 text-center p-3 bg-green-100 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {(project as Project).costSavingsPercent}% Cost Savings
                        </div>
                        <div className="text-xs text-gray-600">vs. Site-Built Construction</div>
                      </div>
                    )}

                    {/* Overall Scores Grid */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-xl font-bold ${getScoreColor((project as Project).zoningScore || "0")}`}>
                          {(project as Project).zoningScore || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500">Zoning</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-xl font-bold ${getScoreColor((project as Project).massingScore || "0")}`}>
                          {(project as Project).massingScore || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500">Massing</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-xl font-bold ${getScoreColor((project as Project).sustainabilityScore || "0")}`}>
                          {(project as Project).sustainabilityScore || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500">Sustainability</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-xl font-bold ${getScoreColor((project as Project).costScore || "0")}`}>
                          {(project as Project).costScore || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500">Pricing</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-xl font-bold ${getScoreColor((project as Project).logisticsScore || "0")}`}>
                          {(project as Project).logisticsScore || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500">Logistics</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className={`text-xl font-bold ${getScoreColor((project as Project).buildTimeScore || "0")}`}>
                          {(project as Project).buildTimeScore || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500">Build Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zoning Tab */}
          <TabsContent value="zoning">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Site & Zoning</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).zoningScore || "0")}`}>
                    Score: {(project as Project).zoningScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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
                          <p><strong>Current Density:</strong> ~30.0 DU/Acre</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Site Information</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2">
                          <p><strong>Total Site Area:</strong> ±4.12 acres</p>
                          <p><strong>Target Units:</strong> 24 units</p>
                          <p><strong>Parking:</strong> 24 spaces (1.0 ratio)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-raap-dark mb-4">Site Zoning Context</h4>
                    <div className="w-full">
                      <img 
                        src={zoningMapImage} 
                        alt="Serinity Village zoning map showing IL (Industrial Light) zoning designation with surrounding residential and mixed-use zones"
                        className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white"
                        style={{ maxHeight: '70vh' }}
                      />
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-green-600">Site Zoning</div>
                          <div className="text-gray-700">IL - Industrial Light</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-blue-600">North Zone</div>
                          <div className="text-gray-700">NMX - Neighborhood Mixed</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-purple-600">South Zone</div>
                          <div className="text-gray-700">RM - Residential Multiple</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-orange-600">East Zone</div>
                          <div className="text-gray-700">PF - Public Facilities</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Zoning Compliance Analysis</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gradient-to-r from-raap-dark to-gray-700 text-white">
                            <th className="px-4 py-4 text-left font-bold">Zoning Criteria</th>
                            <th className="px-4 py-4 text-left font-bold">Requirements & Allowances</th>
                            <th className="px-4 py-4 text-left font-bold">Waivers & Concessions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 font-bold text-blue-800 bg-blue-50 border-r border-blue-200">Allowed Use</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                                <span>Multi-unit Development Permitted</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Compliant
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                            <td className="px-4 py-4 font-bold text-purple-800 bg-purple-50 border-r border-purple-200">Density</td>
                            <td className="px-4 py-4">
                              <div className="space-y-2">
                                <div className="flex items-start">
                                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <div>
                                    <p className="font-medium">Base: 17 DU/Acre Maximum</p>
                                    <p className="text-sm text-gray-600">With AB 1287 bonus: 34 DU/Acre</p>
                                    <p className="text-sm font-semibold text-raap-green">Current: ~30.0 DU/Acre</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Compliant
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                            <td className="px-4 py-4 font-bold text-orange-800 bg-orange-50 border-r border-orange-200">Setbacks</td>
                            <td className="px-4 py-4">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  <span><strong>Front:</strong> 15'</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  <span><strong>Side:</strong> 5'</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  <span><strong>Rear Primary:</strong> 10'</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  <span><strong>Rear Accessory:</strong> 5'</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Compliant
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                            <td className="px-4 py-4 font-bold text-emerald-800 bg-emerald-50 border-r border-emerald-200">Height</td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                                  <span><strong>Primary Building:</strong> 35' maximum</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                                  <span><strong>Accessory Structure:</strong> 15' maximum</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Compliant
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                            <td className="px-4 py-4 font-bold text-red-800 bg-red-50 border-r border-red-200">Open Space</td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                                  <span><strong>Required:</strong> 200 SF per unit</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                                  <span><strong>Common:</strong> 25' min dimension</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                                  <span><strong>Private:</strong> 8' min dimension</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ⚠ Concession Required
                              </span>
                              <p className="text-xs text-gray-600 mt-1">Open Space Reduction</p>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                            <td className="px-4 py-4 font-bold text-indigo-800 bg-indigo-50 border-r border-indigo-200">Floor Area Ratio</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
                                <span className="font-medium">No FAR Requirement</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Compliant
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                            <td className="px-4 py-4 font-bold text-yellow-800 bg-yellow-50 border-r border-yellow-200">Parking</td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <p className="font-semibold text-yellow-800">State Density Bonus Requirements:</p>
                                <div className="flex items-center mt-2">
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                                  <span><strong>1 Bedroom:</strong> 1 Stall</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                                  <span><strong>2-3 Bedrooms:</strong> 1.5 Stalls</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⚠ Concession Available
                              </span>
                              <p className="text-xs text-gray-600 mt-1">Can reduce requirement</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Zoning Assessment</h4>
                    <p className="text-sm text-gray-700">
                      <strong>Score of 4/5:</strong> Concessions are required to reduce open space and parking requirements. 
                      Modular construction does not introduce any additional waivers or restrictions for this site. 
                      The project qualifies for density bonus provisions under AB 1287 due to affordable unit mix.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Massing Tab */}
          <TabsContent value="massing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Massing</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).massingScore || "0")}`}>
                    Score: {(project as Project).massingScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Score of 5/5:</strong> No additional constraints caused by modular structure. 
                      We can achieve the goal of 24 units and unit mix as the traditional original design.
                    </p>
                  </div>

                  {/* Sub-tabs for Massing */}
                  <Tabs defaultValue="specifications" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="specifications">
                        Specifications
                      </TabsTrigger>
                      <TabsTrigger value="units">
                        Unit Plans
                      </TabsTrigger>
                      <TabsTrigger value="floorplan">
                        Floor Plan
                      </TabsTrigger>
                      <TabsTrigger value="3dview">
                        3D View
                      </TabsTrigger>
                      <TabsTrigger value="siteplan">
                        Site Plan
                      </TabsTrigger>
                    </TabsList>

                    {/* Specifications Tab */}
                    <TabsContent value="specifications" className="mt-6">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-raap-dark mb-3">Building Specifications</h4>
                            <div className="bg-white border rounded-lg p-4">
                              <div className="space-y-2">
                                <p><strong>Overall Dimensions:</strong> 146' × 66'</p>
                                <p><strong>Stories:</strong> 3 Story</p>
                                <p><strong>Construction Type:</strong> Type VA Construction</p>
                                <p><strong>Total Units:</strong> 24 Units</p>
                                <p><strong>Total Gross Site Area:</strong> ±4.12 acres</p>
                                <p><strong>Gross Density:</strong> ±30.0 DU/acre</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-raap-dark mb-3">Unit Mix Breakdown</h4>
                            <div className="bg-white border rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span>1-Bedroom Units</span>
                                  <span className="font-semibold text-raap-green">6 units (25%)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>2-Bedroom Units</span>
                                  <span className="font-semibold text-raap-green">12 units (50%)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>3-Bedroom Units</span>
                                  <span className="font-semibold text-raap-green">6 units (25%)</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between items-center font-semibold">
                                  <span>Total Units</span>
                                  <span className="text-raap-dark">24 units</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-raap-dark mb-3">Building Comparison</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Parameter</th>
                                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Site Built</th>
                                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Modular</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-gray-300 px-4 py-2 font-medium">Gross Sq. Ft.</td>
                                  <td className="border border-gray-300 px-4 py-2">25,986 sf</td>
                                  <td className="border border-gray-300 px-4 py-2">26,352 sf</td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-2 font-medium">Building (L × W × H)</td>
                                  <td className="border border-gray-300 px-4 py-2">142' × 61' × 36'</td>
                                  <td className="border border-gray-300 px-4 py-2">144' × 61' × 40'</td>
                                </tr>
                                <tr>
                                  <td className="border border-gray-300 px-4 py-2 font-medium">Construction</td>
                                  <td className="border border-gray-300 px-4 py-2">Site-Built</td>
                                  <td className="border border-gray-300 px-4 py-2">Factory Built + Site Assembly</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Units Tab */}
                    <TabsContent value="units" className="mt-6">
                      <div className="space-y-8">
                        {/* Unit Mix Summary - First */}
                        <div className="bg-raap-green/5 border border-raap-green rounded-lg p-6">
                          <h4 className="font-bold text-raap-dark text-lg mb-3">Unit Mix Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-raap-green">6</div>
                              <div className="text-sm text-gray-600">1-Bedroom Units</div>
                              <div className="text-xs text-gray-500">563 SF Average</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-blue-600">12</div>
                              <div className="text-sm text-gray-600">2-Bedroom Units</div>
                              <div className="text-xs text-gray-500">813 SF Average</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-2xl font-bold text-orange-600">6</div>
                              <div className="text-sm text-gray-600">3-Bedroom Units</div>
                              <div className="text-xs text-gray-500">980 SF Average</div>
                            </div>
                          </div>
                        </div>

                        {/* Massing Assessment Summary - Second */}
                        <div className="bg-gray-50 rounded-lg p-6 border">
                          <h4 className="font-bold text-raap-dark text-lg mb-3">Massing Assessment Summary</h4>
                          <div className="text-sm text-gray-700">
                            <p><strong>Modular Advantage:</strong> Factory construction allows for precise quality control and faster assembly while maintaining identical unit mix and layout to traditional construction. The modular approach achieves 109% efficiency compared to site-built methods.</p>
                          </div>
                        </div>

                        {/* 1-Bedroom Unit Panel */}
                        <div className="bg-white border-2 border-raap-green rounded-lg p-6 shadow-lg">
                          <h4 className="text-xl font-bold text-raap-dark mb-6">1-Bedroom Units (Type B+C)</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            <div>
                              <img 
                                src={oneBedImage} 
                                alt="1-Bedroom Unit Floor Plan - Isometric view showing layout"
                                className="w-full h-auto border rounded-lg shadow-md bg-white p-4"
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="bg-raap-green/10 rounded-lg p-4">
                                <h5 className="font-bold text-raap-green text-lg mb-3">Unit Specifications</h5>
                                <div className="space-y-2">
                                  <p><strong>Total Area:</strong> 563 square feet</p>
                                  <p><strong>Unit Count:</strong> 6 units (25% of total)</p>
                                  <p><strong>Target Market:</strong> Young professionals, singles</p>
                                  <p><strong>Rent Range:</strong> Affordable housing tier</p>
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-bold text-raap-dark text-lg mb-3">Layout Features</h5>
                                <div className="space-y-2">
                                  <p>• Open concept living room and kitchen</p>
                                  <p>• Spacious bedroom with large window</p>
                                  <p>• Full bathroom with modern fixtures</p>
                                  <p>• Built-in closet storage throughout</p>
                                  <p>• Private balcony/patio access</p>
                                  <p>• Energy-efficient appliances included</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2-Bedroom Unit Panel */}
                        <div className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-lg">
                          <h4 className="text-xl font-bold text-raap-dark mb-6">2-Bedroom Units (Type D+B+C)</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            <div>
                              <img 
                                src={twoBedImage} 
                                alt="2-Bedroom Unit Floor Plan - Isometric view showing layout"
                                className="w-full h-auto border rounded-lg shadow-md bg-white p-4"
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h5 className="font-bold text-blue-700 text-lg mb-3">Unit Specifications</h5>
                                <div className="space-y-2">
                                  <p><strong>Total Area:</strong> 813 square feet</p>
                                  <p><strong>Unit Count:</strong> 12 units (50% of total)</p>
                                  <p><strong>Target Market:</strong> Small families, roommates</p>
                                  <p><strong>Rent Range:</strong> Moderate income housing</p>
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-bold text-raap-dark text-lg mb-3">Layout Features</h5>
                                <div className="space-y-2">
                                  <p>• Separate living and dining areas</p>
                                  <p>• Full-size kitchen with pantry</p>
                                  <p>• Two bedrooms with ample closets</p>
                                  <p>• Full bathroom plus powder room</p>
                                  <p>• In-unit laundry connections</p>
                                  <p>• Private outdoor space</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3-Bedroom Unit Panel */}
                        <div className="bg-white border-2 border-orange-500 rounded-lg p-6 shadow-lg">
                          <h4 className="text-xl font-bold text-raap-dark mb-6">3-Bedroom Units (Type F+B2+C)</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            <div>
                              <img 
                                src={threeBedImage} 
                                alt="3-Bedroom Unit Floor Plan - Isometric view showing layout"
                                className="w-full h-auto border rounded-lg shadow-md bg-white p-4"
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="bg-orange-50 rounded-lg p-4">
                                <h5 className="font-bold text-orange-700 text-lg mb-3">Unit Specifications</h5>
                                <div className="space-y-2">
                                  <p><strong>Total Area:</strong> 980 square feet</p>
                                  <p><strong>Unit Count:</strong> 6 units (25% of total)</p>
                                  <p><strong>Target Market:</strong> Families with children</p>
                                  <p><strong>Rent Range:</strong> Family housing tier</p>
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-bold text-raap-dark text-lg mb-3">Layout Features</h5>
                                <div className="space-y-2">
                                  <p>• Large living room with dining area</p>
                                  <p>• Full kitchen with island/breakfast bar</p>
                                  <p>• Three bedrooms including master suite</p>
                                  <p>• Two full bathrooms</p>
                                  <p>• Ample storage throughout unit</p>
                                  <p>• Large private patio/balcony</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Floor Plan Tab */}
                    <TabsContent value="floorplan" className="mt-6">
                      <div className="space-y-6">
                        <div className="text-center">
                          <img 
                            src={floorPlanImage} 
                            alt="Building Floor Plan - Complete layout showing all units, corridors, and stairs"
                            className="mx-auto max-w-full h-auto border rounded-lg shadow-lg"
                          />
                          <p className="mt-4 text-sm text-gray-600">
                            Complete building floor plan showing unit arrangements, circulation corridors, stair locations, and modular vs site-built areas.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-semibold text-blue-700 mb-2">Modular Components</h5>
                            <div className="space-y-2 text-sm">
                              <p>• Individual residential units (1BD, 2BD, 3BD)</p>
                              <p>• Interior corridors and circulation spaces</p>
                              <p>• Stairwell modules</p>
                              <p>• MEP risers and service areas</p>
                              <p>• Total: 137,225 SF modular construction</p>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h5 className="font-semibold text-orange-700 mb-2">Site-Built Components</h5>
                            <div className="space-y-2 text-sm">
                              <p>• Ground floor amenity spaces</p>
                              <p>• Building entrances and lobbies</p>
                              <p>• Utility connections and service areas</p>
                              <p>• Foundation and structural connections</p>
                              <p>• Total: 6,808 SF site-built construction</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* 3D View Tab */}
                    <TabsContent value="3dview" className="mt-6">
                      <div className="space-y-6">
                        <div className="text-center">
                          <img 
                            src={buildingRenderingImage} 
                            alt="3D Building Rendering - Exterior view of the completed multifamily development"
                            className="mx-auto max-w-full h-auto border rounded-lg shadow-lg"
                          />
                          <p className="mt-4 text-sm text-gray-600">
                            Three-dimensional exterior rendering showing the completed building design with architectural details, materials, and landscaping.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white border rounded-lg p-4">
                            <h5 className="font-semibold text-raap-green mb-2">Design Features</h5>
                            <div className="space-y-2 text-sm">
                              <p><strong>Architecture:</strong> Contemporary residential design</p>
                              <p><strong>Materials:</strong> Mixed exterior materials for visual interest</p>
                              <p><strong>Windows:</strong> Large openings for natural light</p>
                              <p><strong>Balconies:</strong> Private outdoor spaces for units</p>
                              <p><strong>Roof:</strong> Solar-ready flat roof system</p>
                            </div>
                          </div>
                          
                          <div className="bg-white border rounded-lg p-4">
                            <h5 className="font-semibold text-raap-green mb-2">Modular Advantages</h5>
                            <div className="space-y-2 text-sm">
                              <p><strong>Quality Control:</strong> Factory-built precision</p>
                              <p><strong>Speed:</strong> Parallel construction and installation</p>
                              <p><strong>Consistency:</strong> Uniform finishes and details</p>
                              <p><strong>Weather Protection:</strong> Indoor manufacturing</p>
                              <p><strong>Efficiency:</strong> 109% modular efficiency vs site-built</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Site Plan Tab */}
                    <TabsContent value="siteplan" className="mt-6">
                      <div className="space-y-6">
                        <div className="w-full">
                          <img 
                            src={sitePlanImage} 
                            alt="Site Plan - Property layout showing building placement, parking, and landscaping"
                            className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white"
                            style={{ maxHeight: '70vh' }}
                          />
                          <p className="mt-4 text-sm text-gray-600 text-center">
                            Site plan drawing showing building placement on the 4.12-acre property with parking areas, landscaping, and site improvements.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white border rounded-lg p-4">
                            <h5 className="font-semibold text-raap-green mb-2">Site Information</h5>
                            <div className="space-y-2 text-sm">
                              <p><strong>Total Area:</strong> 4.12 acres (171,600 SF)</p>
                              <p><strong>Building Footprint:</strong> 146' × 66'</p>
                              <p><strong>Parking Spaces:</strong> 24 spaces (1.0 ratio)</p>
                              <p><strong>Density:</strong> 30.0 DU/acre</p>
                              <p><strong>Setbacks:</strong> Compliant with RM zoning</p>
                            </div>
                          </div>
                          
                          <div className="bg-white border rounded-lg p-4">
                            <h5 className="font-semibold text-raap-green mb-2">Site Features</h5>
                            <div className="space-y-2 text-sm">
                              <p><strong>Access:</strong> From Chestnut Road</p>
                              <p><strong>Utilities:</strong> All services available</p>
                              <p><strong>Landscaping:</strong> Native plantings and trees</p>
                              <p><strong>Stormwater:</strong> On-site management system</p>
                              <p><strong>Staging:</strong> Large area for modular delivery</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sustainability Tab */}
          <TabsContent value="sustainability">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5" />
                  <span>Sustainability</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).sustainabilityScore || "0")}`}>
                    Score: {(project as Project).sustainabilityScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Score of 5/5:</strong> Strong alignment with PHIUS and Net Zero Energy goals through modular design. 
                      Project readily supports Net Zero Energy (NZE) and PHIUS with minimal site-built upgrades.
                    </p>
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
                            <span className="text-green-600 font-semibold">✓ Factory Built</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Energy Monitoring</span>
                            <span className="text-green-600 font-semibold">✓ Integrated</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">PHIUS Certification Path</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Air Barrier System</span>
                            <span className="text-green-600 font-semibold">✓ Enhanced</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Thermal Bridge Reduction</span>
                            <span className="text-green-600 font-semibold">✓ Optimized</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>High-Performance Windows</span>
                            <span className="text-green-600 font-semibold">✓ Specified</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Mechanical Ventilation</span>
                            <span className="text-green-600 font-semibold">✓ ERV System</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Required Enhancements for NZE/PHIUS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-700 mb-2">Modular-Compatible Systems</h5>
                        <div className="space-y-2 text-sm">
                          <p><strong>Envelope Components:</strong></p>
                          <p>• Enhanced wall insulation systems</p>
                          <p>• High-performance roof assemblies</p>
                          <p>• Triple-pane window packages</p>
                          <p>• Integrated air barrier systems</p>
                          <br />
                          <p><strong>MEP Systems:</strong></p>
                          <p>• High-efficiency HVAC equipment</p>
                          <p>• LED lighting throughout</p>
                          <p>• Energy recovery ventilation</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h5 className="font-semibold text-orange-700 mb-2">Site-Built Requirements</h5>
                        <div className="space-y-2 text-sm">
                          <p><strong>Foundation Upgrades:</strong></p>
                          <p>• Under-slab insulation</p>
                          <p>• Perimeter thermal breaks</p>
                          <p>• Foundation air sealing</p>
                          <br />
                          <p><strong>Energy Generation:</strong></p>
                          <p>• Solar photovoltaic arrays</p>
                          <p>• Battery storage systems</p>
                          <p>• Grid-tie inverter systems</p>
                          <p>• Energy monitoring equipment</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Modular Construction Advantages</h4>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold text-raap-green mb-2">Quality Benefits</h5>
                          <div className="space-y-2 text-sm">
                            <p>• Controlled factory environment ensures precise installation</p>
                            <p>• Reduced air leakage through factory quality control</p>
                            <p>• Consistent insulation installation</p>
                            <p>• Better integration of building systems</p>
                            <p>• Reduced waste generation</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-raap-green mb-2">Performance Benefits</h5>
                          <div className="space-y-2 text-sm">
                            <p>• Enhanced thermal performance through factory precision</p>
                            <p>• Improved air barrier continuity</p>
                            <p>• Optimized HVAC system integration</p>
                            <p>• Consistent energy modeling inputs</p>
                            <p>• Predictable performance outcomes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">RaaP/HED Sustainability Experience</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>Proven Track Record:</strong> RaaP/HED's commitment to sustainable, people-centric design and extensive experience in delivering PHIUS-certified multifamily housing provides high confidence in achieving NZE targets.</p>
                        <p><strong>Integrated Approach:</strong> The modular design can support energy efficiency goals by integrating passive design principles, efficient HVAC systems, and photovoltaic-ready roof structures.</p>
                        <p><strong>Cost-Effective Path:</strong> While sustainability enhancements require investment, the factory-controlled environment can reduce installation quality issues and provide more predictable performance outcomes.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Sustainability Assessment Summary</h4>
                    <p className="text-sm text-gray-700">
                      The project presents a strong foundation for achieving both Net Zero Energy and PHIUS certification through modular construction. 
                      While some PHIUS-specific components require site-built execution (primarily foundation-related), the majority of the envelope and 
                      systems are compatible with factory-built methods. Modular construction can reduce waste generation and increase installation quality 
                      compared to site-built alternatives, supporting both environmental and performance objectives.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Cost Analysis</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).costScore || "0")}`}>
                    Score: {(project as Project).costScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Score of 4/5:</strong> $10.8M ($404/sf; $450K/unit) with Prevailing Wage. 
                      1.2% savings over site-built ($138K total savings). Modular is cheaper than site-built.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Project Cost Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <span>RaaP Modular Cost</span>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">$10,821,565</div>
                            <div className="text-sm text-gray-600">$411/sf • 9 Months</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Traditional Site-Built</span>
                          <div className="text-right">
                            <div className="font-semibold">$10,960,303</div>
                            <div className="text-sm text-gray-600">$422/sf • 13 Months</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span>Cost Savings</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">$138,738</div>
                            <div className="text-sm text-gray-600">1.2% savings</div>
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
                            <span className="font-semibold">24</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Unit Area</span>
                            <span className="font-semibold">792 sf</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between">
                            <span>Cost per Unit (RaaP)</span>
                            <span className="font-semibold text-blue-600">$450,899</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost per Sq Ft (RaaP)</span>
                            <span className="font-semibold text-blue-600">$411</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Detailed MasterFormat Cost Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-raap-dark to-gray-700 text-white">
                            <th className="px-4 py-3 text-left font-bold">MasterFormat Division</th>
                            <th className="px-4 py-3 text-right font-bold">Site Built Total</th>
                            <th className="px-4 py-3 text-right font-bold">Site Built $/sf</th>
                            <th className="px-4 py-3 text-right font-bold">RaaP GC</th>
                            <th className="px-4 py-3 text-right font-bold">RaaP Fab</th>
                            <th className="px-4 py-3 text-right font-bold">RaaP Total</th>
                            <th className="px-4 py-3 text-right font-bold">RaaP $/sf</th>
                            <th className="px-4 py-3 text-right font-bold">Savings</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {/* Concrete, Masonry & Metals */}
                          <tr className="bg-blue-50 border-b border-blue-200">
                            <td className="px-4 py-3 font-bold text-blue-800">Concrete, Masonry & Metals</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$1,311,770</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$50</td>
                            <td className="px-4 py-3 text-right">$1,147,404</td>
                            <td className="px-4 py-3 text-right">$281,220</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$1,428,623</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$54</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">-$116,853</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">03 Concrete</td>
                            <td className="px-4 py-2 text-right">$407,021</td>
                            <td className="px-4 py-2 text-right text-gray-600">$16</td>
                            <td className="px-4 py-2 text-right">$285,136</td>
                            <td className="px-4 py-2 text-right">$164,393</td>
                            <td className="px-4 py-2 text-right">$449,528</td>
                            <td className="px-4 py-2 text-right text-gray-600">$17</td>
                            <td className="px-4 py-2 text-right text-red-600">-$42,507</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">04 Masonry</td>
                            <td className="px-4 py-2 text-right">$233,482</td>
                            <td className="px-4 py-2 text-right text-gray-600">$9</td>
                            <td className="px-4 py-2 text-right">$260,237</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$260,237</td>
                            <td className="px-4 py-2 text-right text-gray-600">$10</td>
                            <td className="px-4 py-2 text-right text-red-600">-$26,755</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">05 Metal</td>
                            <td className="px-4 py-2 text-right">$671,267</td>
                            <td className="px-4 py-2 text-right text-gray-600">$26</td>
                            <td className="px-4 py-2 text-right">$602,031</td>
                            <td className="px-4 py-2 text-right">$116,827</td>
                            <td className="px-4 py-2 text-right">$718,859</td>
                            <td className="px-4 py-2 text-right text-gray-600">$27</td>
                            <td className="px-4 py-2 text-right text-red-600">-$47,592</td>
                          </tr>

                          {/* Rooms */}
                          <tr className="bg-green-50 border-b border-green-200">
                            <td className="px-4 py-3 font-bold text-green-800">Rooms</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$4,452,553</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$171</td>
                            <td className="px-4 py-3 text-right">$465,938</td>
                            <td className="px-4 py-3 text-right">$4,121,807</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$4,587,745</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$174</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">-$135,192</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">06 Wood & Plastics</td>
                            <td className="px-4 py-2 text-right">$1,982,860</td>
                            <td className="px-4 py-2 text-right text-gray-600">$76</td>
                            <td className="px-4 py-2 text-right">$14,171</td>
                            <td className="px-4 py-2 text-right">$2,137,612</td>
                            <td className="px-4 py-2 text-right">$2,151,783</td>
                            <td className="px-4 py-2 text-right text-gray-600">$82</td>
                            <td className="px-4 py-2 text-right text-red-600">-$168,923</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">07 Thermal & Moisture Protection</td>
                            <td className="px-4 py-2 text-right">$490,766</td>
                            <td className="px-4 py-2 text-right text-gray-600">$19</td>
                            <td className="px-4 py-2 text-right">$289,407</td>
                            <td className="px-4 py-2 text-right">$293,030</td>
                            <td className="px-4 py-2 text-right">$582,437</td>
                            <td className="px-4 py-2 text-right text-gray-600">$22</td>
                            <td className="px-4 py-2 text-right text-red-600">-$91,671</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">08 Openings</td>
                            <td className="px-4 py-2 text-right">$486,606</td>
                            <td className="px-4 py-2 text-right text-gray-600">$19</td>
                            <td className="px-4 py-2 text-right">$138,123</td>
                            <td className="px-4 py-2 text-right">$337,164</td>
                            <td className="px-4 py-2 text-right">$475,287</td>
                            <td className="px-4 py-2 text-right text-gray-600">$18</td>
                            <td className="px-4 py-2 text-right text-green-600">$11,319</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">09 Finishes</td>
                            <td className="px-4 py-2 text-right">$1,492,321</td>
                            <td className="px-4 py-2 text-right text-gray-600">$57</td>
                            <td className="px-4 py-2 text-right">$24,237</td>
                            <td className="px-4 py-2 text-right">$1,354,001</td>
                            <td className="px-4 py-2 text-right">$1,378,238</td>
                            <td className="px-4 py-2 text-right text-gray-600">$52</td>
                            <td className="px-4 py-2 text-right text-green-600">$114,083</td>
                          </tr>

                          {/* Equipment & Special Construction */}
                          <tr className="bg-orange-50 border-b border-orange-200">
                            <td className="px-4 py-3 font-bold text-orange-800">Equipment & Special Construction</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$221,062</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$9</td>
                            <td className="px-4 py-3 text-right">$68,827</td>
                            <td className="px-4 py-3 text-right">$139,859</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$208,686</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$8</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$12,376</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">10 Specialties</td>
                            <td className="px-4 py-2 text-right">$55,363</td>
                            <td className="px-4 py-2 text-right text-gray-600">$2</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$47,078</td>
                            <td className="px-4 py-2 text-right">$47,078</td>
                            <td className="px-4 py-2 text-right text-gray-600">$2</td>
                            <td className="px-4 py-2 text-right text-green-600">$8,285</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">11 Equipment</td>
                            <td className="px-4 py-2 text-right">$16,837</td>
                            <td className="px-4 py-2 text-right text-gray-600">$1</td>
                            <td className="px-4 py-2 text-right">$16,837</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$16,837</td>
                            <td className="px-4 py-2 text-right text-gray-600">$1</td>
                            <td className="px-4 py-2 text-right text-gray-600">$0</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">12 Furnishing</td>
                            <td className="px-4 py-2 text-right">$99,730</td>
                            <td className="px-4 py-2 text-right text-gray-600">$4</td>
                            <td className="px-4 py-2 text-right">$2,858</td>
                            <td className="px-4 py-2 text-right">$92,781</td>
                            <td className="px-4 py-2 text-right">$95,639</td>
                            <td className="px-4 py-2 text-right text-gray-600">$4</td>
                            <td className="px-4 py-2 text-right text-green-600">$4,091</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">13 Special Construction</td>
                            <td className="px-4 py-2 text-right">$49,132</td>
                            <td className="px-4 py-2 text-right text-gray-600">$2</td>
                            <td className="px-4 py-2 text-right">$49,132</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$49,132</td>
                            <td className="px-4 py-2 text-right text-gray-600">$2</td>
                            <td className="px-4 py-2 text-right text-gray-600">$0</td>
                          </tr>

                          {/* MEPs */}
                          <tr className="bg-purple-50 border-b border-purple-200">
                            <td className="px-4 py-3 font-bold text-purple-800">MEPs</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$2,262,827</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$87</td>
                            <td className="px-4 py-3 text-right">$1,304,248</td>
                            <td className="px-4 py-3 text-right">$854,052</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$2,158,300</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$82</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$104,527</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">21 Fire</td>
                            <td className="px-4 py-2 text-right">$189,853</td>
                            <td className="px-4 py-2 text-right text-gray-600">$7</td>
                            <td className="px-4 py-2 text-right">$96,660</td>
                            <td className="px-4 py-2 text-right">$85,189</td>
                            <td className="px-4 py-2 text-right">$181,849</td>
                            <td className="px-4 py-2 text-right text-gray-600">$7</td>
                            <td className="px-4 py-2 text-right text-green-600">$8,004</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">22 Plumbing</td>
                            <td className="px-4 py-2 text-right">$767,391</td>
                            <td className="px-4 py-2 text-right text-gray-600">$30</td>
                            <td className="px-4 py-2 text-right">$431,516</td>
                            <td className="px-4 py-2 text-right">$306,882</td>
                            <td className="px-4 py-2 text-right">$738,398</td>
                            <td className="px-4 py-2 text-right text-gray-600">$28</td>
                            <td className="px-4 py-2 text-right text-green-600">$28,993</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">23 HVAC</td>
                            <td className="px-4 py-2 text-right">$326,599</td>
                            <td className="px-4 py-2 text-right text-gray-600">$13</td>
                            <td className="px-4 py-2 text-right">$64</td>
                            <td className="px-4 py-2 text-right">$290,983</td>
                            <td className="px-4 py-2 text-right">$291,047</td>
                            <td className="px-4 py-2 text-right text-gray-600">$11</td>
                            <td className="px-4 py-2 text-right text-green-600">$35,552</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">26 Electrical</td>
                            <td className="px-4 py-2 text-right">$978,984</td>
                            <td className="px-4 py-2 text-right text-gray-600">$38</td>
                            <td className="px-4 py-2 text-right">$776,008</td>
                            <td className="px-4 py-2 text-right">$170,998</td>
                            <td className="px-4 py-2 text-right">$947,005</td>
                            <td className="px-4 py-2 text-right text-gray-600">$36</td>
                            <td className="px-4 py-2 text-right text-green-600">$31,979</td>
                          </tr>

                          {/* Site Work */}
                          <tr className="bg-yellow-50 border-b border-yellow-200">
                            <td className="px-4 py-3 font-bold text-yellow-800">Site Work (Estimate)</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$1,002,646</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$39</td>
                            <td className="px-4 py-3 text-right">$1,003,239</td>
                            <td className="px-4 py-3 text-right">-</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$1,003,239</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$38</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">-$593</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">31 Earthwork</td>
                            <td className="px-4 py-2 text-right">$267,163</td>
                            <td className="px-4 py-2 text-right text-gray-600">$10</td>
                            <td className="px-4 py-2 text-right">$267,756</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$267,756</td>
                            <td className="px-4 py-2 text-right text-gray-600">$10</td>
                            <td className="px-4 py-2 text-right text-red-600">-$593</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">32 Exterior Improvements</td>
                            <td className="px-4 py-2 text-right">$362,465</td>
                            <td className="px-4 py-2 text-right text-gray-600">$14</td>
                            <td className="px-4 py-2 text-right">$362,465</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$362,465</td>
                            <td className="px-4 py-2 text-right text-gray-600">$14</td>
                            <td className="px-4 py-2 text-right text-gray-600">$0</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">33 Utilities</td>
                            <td className="px-4 py-2 text-right">$373,018</td>
                            <td className="px-4 py-2 text-right text-gray-600">$14</td>
                            <td className="px-4 py-2 text-right">$373,018</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$373,018</td>
                            <td className="px-4 py-2 text-right text-gray-600">$14</td>
                            <td className="px-4 py-2 text-right text-gray-600">$0</td>
                          </tr>

                          {/* GC Charges */}
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <td className="px-4 py-3 font-bold text-gray-800">GC Charges (Estimate)</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$1,709,446</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$66</td>
                            <td className="px-4 py-3 text-right">$735,670</td>
                            <td className="px-4 py-3 text-right">$699,302</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$1,434,972</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$55</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$274,474</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">01 General Requirements</td>
                            <td className="px-4 py-2 text-right">$579,732</td>
                            <td className="px-4 py-2 text-right text-gray-600">$22</td>
                            <td className="px-4 py-2 text-right">$251,063</td>
                            <td className="px-4 py-2 text-right">$465,712</td>
                            <td className="px-4 py-2 text-right">$716,775</td>
                            <td className="px-4 py-2 text-right text-gray-600">$27</td>
                            <td className="px-4 py-2 text-right text-red-600">-$137,043</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Charges & Fees</td>
                            <td className="px-4 py-2 text-right">$1,129,714</td>
                            <td className="px-4 py-2 text-right text-gray-600">$43</td>
                            <td className="px-4 py-2 text-right">$484,607</td>
                            <td className="px-4 py-2 text-right">$233,591</td>
                            <td className="px-4 py-2 text-right">$718,197</td>
                            <td className="px-4 py-2 text-right text-gray-600">$27</td>
                            <td className="px-4 py-2 text-right text-green-600">$411,517</td>
                          </tr>

                          {/* Total */}
                          <tr className="bg-raap-dark border-b-2 border-raap-dark">
                            <td className="px-4 py-4 font-bold text-white text-lg">Total Hard Construction Cost</td>
                            <td className="px-4 py-4 text-right font-bold text-white text-lg">$10,960,303</td>
                            <td className="px-4 py-4 text-right font-bold text-white text-lg">$422</td>
                            <td className="px-4 py-4 text-right font-bold text-white">$4,725,325</td>
                            <td className="px-4 py-4 text-right font-bold text-white">$6,096,240</td>
                            <td className="px-4 py-4 text-right font-bold text-white text-lg">$10,821,565</td>
                            <td className="px-4 py-4 text-right font-bold text-white text-lg">$411</td>
                            <td className="px-4 py-4 text-right font-bold text-white text-lg">$138,738</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logistics Tab */}
          <TabsContent value="logistics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Logistics</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).logisticsScore || "0")}`}>
                    Score: {(project as Project).logisticsScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Score of 5/5:</strong> Excellent logistics conditions with direct highway access, ample staging space, 
                      and clear delivery route. Ideal conditions for modular construction delivery and installation.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Delivery Route: Tracy to Olivehurst</h4>
                    <div className="w-full">
                      <img 
                        src={tracyRouteImage} 
                        alt="Google Maps route from Tracy CA to Olivehurst CA showing 1 hour 29 minute drive via Highway 99 and Highway 70"
                        className="w-full h-auto border rounded-lg shadow-lg object-contain bg-white"
                        style={{ maxHeight: '60vh' }}
                      />
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-blue-600">Distance</div>
                          <div className="text-gray-700">103 miles</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-green-600">Drive Time</div>
                          <div className="text-gray-700">1 hour 29 minutes</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <div className="font-semibold text-orange-600">Primary Route</div>
                          <div className="text-gray-700">Highway 99 → Highway 70</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h5 className="font-semibold text-green-600 mb-2">Excellent Access</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Highway 70:</strong> Major route proximity</p>
                        <p>• 0.5 miles to Interstate 680</p>
                        <p>• Direct route from Tracy factory (25 miles)</p>
                        <p>• No weight restrictions or bridge clearances</p>
                        <p>• Clear path for 16' wide loads</p>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <h5 className="font-semibold text-green-600 mb-2">Staging & Site Access</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Large Staging Area:</strong> 4.12-acre site</p>
                        <p>• Ample space for module storage</p>
                        <p>• Multiple crane positions available</p>
                        <p>• Easy truck maneuvering room</p>
                        <p>• Level site preparation minimal</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h5 className="font-semibold text-blue-600 mb-2">Delivery Schedule</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Module Delivery:</strong> 2-3 modules per day</p>
                        <p>• Early morning arrival (6-8 AM)</p>
                        <p>• Crane setting within 2-4 hours</p>
                        <p>• Minimal neighborhood disruption</p>
                        <p>• Weather-independent factory production</p>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-4">
                      <h5 className="font-semibold text-orange-600 mb-2">Minor Considerations</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Overhead Powerlines:</strong> Present on Chestnut Rd</p>
                        <p>• May cause some crane logistics concerns</p>
                        <p>• Manageable with proper crane positioning</p>
                        <p>• Does not prevent modular delivery</p>
                        <p>• Standard utility coordination required</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Logistics Summary</h4>
                    <p className="text-sm text-gray-700">
                      The site presents ideal logistics conditions for modular construction with excellent highway access, 
                      ample staging space, and minimal delivery constraints. The proximity to Highway 70 and straightforward 
                      route from the Tracy fabrication facility ensures efficient module transportation and installation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Build Time Tab */}
          <TabsContent value="buildtime">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Build Time</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).buildTimeScore || "0")}`}>
                    Score: {(project as Project).buildTimeScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Score of 4/5:</strong> 9 months design + construction using modular approach vs 13 months for site built. 
                      Savings of 4 months (30% timeline reduction).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Timeline Comparison</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <span>RaaP Modular</span>
                          <div className="text-right">
                            <div className="font-semibold text-blue-600">9 months</div>
                            <div className="text-sm text-gray-600">Design + Construction</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Traditional Site-Built</span>
                          <div className="text-right">
                            <div className="font-semibold text-gray-600">13 months</div>
                            <div className="text-sm text-gray-600">Design + Construction</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span className="font-semibold">Time Savings</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">4 months</div>
                            <div className="text-sm text-gray-600">30% faster</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Key Advantages</h4>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <span><strong>Parallel Construction:</strong> Site prep occurs while modules are built in factory</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <span><strong>Weather Independence:</strong> Factory production not affected by weather delays</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <span><strong>Quality Control:</strong> Factory environment ensures consistent quality</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <span><strong>Predictable Schedule:</strong> More reliable timeline with fewer delays</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gantt Chart */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-raap-dark mb-6 text-lg">Project Timeline - RaaP Modular Construction (9 months)</h4>
                    
                    {/* Timeline Header */}
                    <div className="grid grid-cols-11 gap-1 mb-4 text-xs text-center">
                      <div className="col-span-2"></div>
                      {Array.from({ length: 9 }, (_, i) => (
                        <div key={i} className="font-medium text-gray-600 border-l border-gray-200 px-1">Month {i + 1}</div>
                      ))}
                    </div>

                    {/* Project Timeline */}
                    <div className="space-y-2">
                      {/* Design Development */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">Design Development</div>
                        <div className="bg-purple-500 text-white text-xs px-2 py-2 rounded text-center font-medium">8 weeks</div>
                        <div className="bg-purple-300 px-2 py-2 rounded"></div>
                        <div className="col-span-7"></div>
                      </div>

                      {/* Factory Permit Set */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">Factory Permit Set</div>
                        <div className="col-span-2"></div>
                        <div className="bg-purple-500 text-white text-xs px-2 py-2 rounded text-center">1 month</div>
                        <div className="col-span-6"></div>
                      </div>

                      {/* AHJ Permit Set */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">AHJ Permit Set</div>
                        <div className="col-span-2"></div>
                        <div className="bg-purple-500 text-white text-xs px-2 py-2 rounded text-center">4 months</div>
                        <div className="bg-purple-300 px-2 py-2 rounded"></div>
                        <div className="bg-purple-300 px-2 py-2 rounded"></div>
                        <div className="bg-purple-300 px-2 py-2 rounded"></div>
                        <div className="col-span-2"></div>
                      </div>

                      {/* Site Preparation */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">Site Preparation</div>
                        <div className="col-span-5"></div>
                        <div className="bg-green-500 text-white text-xs px-2 py-2 rounded text-center">2 months</div>
                        <div className="bg-green-300 px-2 py-2 rounded"></div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Factory Production */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">Factory Production</div>
                        <div className="col-span-3"></div>
                        <div className="bg-blue-500 text-white text-xs px-2 py-2 rounded text-center">6 months</div>
                        <div className="bg-blue-300 px-2 py-2 rounded"></div>
                        <div className="bg-blue-300 px-2 py-2 rounded"></div>
                        <div className="bg-blue-300 px-2 py-2 rounded"></div>
                        <div className="bg-blue-300 px-2 py-2 rounded"></div>
                        <div className="bg-blue-300 px-2 py-2 rounded"></div>
                      </div>

                      {/* Module Installation */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">Module Installation</div>
                        <div className="col-span-8"></div>
                        <div className="bg-green-500 text-white text-xs px-2 py-2 rounded text-center">3 weeks</div>
                      </div>

                      {/* Site Connections */}
                      <div className="grid grid-cols-11 gap-1 items-center">
                        <div className="col-span-2 text-sm pr-2 font-medium">Site Connections</div>
                        <div className="col-span-8"></div>
                        <div className="bg-green-500 text-white text-xs px-2 py-2 rounded text-center">2 weeks</div>
                      </div>
                    </div>

                    {/* Milestone Markers */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-700 mb-3 text-sm">Key Milestones</h5>
                      <div className="grid grid-cols-11 gap-1 mb-4 text-xs">
                        <div className="col-span-2"></div>
                        {Array.from({ length: 9 }, (_, i) => (
                          <div key={i} className="text-center text-gray-400 border-l border-gray-200">Month {i + 1}</div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-11 gap-1 items-center relative">
                        <div className="col-span-2"></div>
                        
                        {/* Start Construction & Fabrication - Month 6 */}
                        <div className="col-span-5"></div>
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-lg"></div>
                          <div className="text-xs text-orange-600 font-medium mt-1 text-center leading-tight">Start<br/>Construction</div>
                        </div>
                        
                        {/* Module Delivery - Month 8 */}
                        <div className="col-span-1"></div>
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-lg"></div>
                          <div className="text-xs text-orange-600 font-medium mt-1 text-center leading-tight">Module<br/>Delivery</div>
                        </div>
                        
                        {/* Final Inspections & Project Completion - Month 9 */}
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-raap-dark rounded-full border-2 border-white shadow-lg"></div>
                          <div className="text-xs text-raap-dark font-bold mt-1 text-center leading-tight">Final<br/>Completion</div>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded"></div>
                          <span>Design & Permitting</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Factory Production</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Site Work</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span>Key Milestones</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-raap-dark rounded-full"></div>
                          <span>Project Completion</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Benefits */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-700 mb-3 text-sm">Key Timeline Benefits</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span><strong>Parallel Production:</strong> Site prep occurs while modules are fabricated</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span><strong>Permit Overlap:</strong> AHJ permits processed during factory production</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span><strong>Fast Installation:</strong> Modules installed in just 3 weeks</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span><strong>Weather Independent:</strong> Factory work unaffected by weather</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span><strong>Quality Control:</strong> Controlled factory environment</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span><strong>30% Time Savings:</strong> 9 months vs 13 months traditional</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 mb-2">Schedule Benefits</h4>
                    <p className="text-sm text-gray-700">
                      The modular approach provides significant schedule advantages through parallel construction processes. 
                      While site work progresses, modules are simultaneously fabricated in a controlled factory environment. 
                      This results in a 30% reduction in overall project timeline compared to traditional site-built construction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default ProjectDetail;