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

export default function ProjectDetail() {
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
                      src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                      alt={`${(project as Project).name} development site`} 
                      className="w-full h-48 rounded-lg object-cover mb-4"
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
                        <div className="text-center">
                          <img 
                            src={sitePlanImage} 
                            alt="Site Plan - Property layout showing building placement, parking, and landscaping"
                            className="mx-auto max-w-full h-auto border rounded-lg shadow-lg"
                          />
                          <p className="mt-4 text-sm text-gray-600">
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
                          {/* Division 03 - Concrete */}
                          <tr className="bg-blue-50 border-b border-blue-200">
                            <td className="px-4 py-3 font-bold text-blue-800">Division 03 - Concrete</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$678,820</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$26</td>
                            <td className="px-4 py-3 text-right">$593,905</td>
                            <td className="px-4 py-3 text-right">$0</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$593,905</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-800">$23</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$84,915</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Cast-in-Place Concrete</td>
                            <td className="px-4 py-2 text-right">$426,170</td>
                            <td className="px-4 py-2 text-right text-gray-600">$16</td>
                            <td className="px-4 py-2 text-right">$372,730</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$372,730</td>
                            <td className="px-4 py-2 text-right text-gray-600">$14</td>
                            <td className="px-4 py-2 text-right text-green-600">$53,440</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Precast Concrete</td>
                            <td className="px-4 py-2 text-right">$252,650</td>
                            <td className="px-4 py-2 text-right text-gray-600">$10</td>
                            <td className="px-4 py-2 text-right">$221,175</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$221,175</td>
                            <td className="px-4 py-2 text-right text-gray-600">$8</td>
                            <td className="px-4 py-2 text-right text-green-600">$31,475</td>
                          </tr>

                          {/* Division 04 - Masonry */}
                          <tr className="bg-orange-50 border-b border-orange-200">
                            <td className="px-4 py-3 font-bold text-orange-800">Division 04 - Masonry</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$423,490</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$16</td>
                            <td className="px-4 py-3 text-right">$370,424</td>
                            <td className="px-4 py-3 text-right">$0</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$370,424</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-800">$14</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$53,066</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Unit Masonry</td>
                            <td className="px-4 py-2 text-right">$423,490</td>
                            <td className="px-4 py-2 text-right text-gray-600">$16</td>
                            <td className="px-4 py-2 text-right">$370,424</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">$370,424</td>
                            <td className="px-4 py-2 text-right text-gray-600">$14</td>
                            <td className="px-4 py-2 text-right text-green-600">$53,066</td>
                          </tr>

                          {/* Division 05 - Metals */}
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <td className="px-4 py-3 font-bold text-gray-800">Division 05 - Metals</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$209,460</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$8</td>
                            <td className="px-4 py-3 text-right">$183,075</td>
                            <td className="px-4 py-3 text-right">$281,220</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$464,295</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">$18</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">($254,835)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Structural Metal Framing</td>
                            <td className="px-4 py-2 text-right">$128,590</td>
                            <td className="px-4 py-2 text-right text-gray-600">$5</td>
                            <td className="px-4 py-2 text-right">$112,350</td>
                            <td className="px-4 py-2 text-right">$172,550</td>
                            <td className="px-4 py-2 text-right">$284,900</td>
                            <td className="px-4 py-2 text-right text-gray-600">$11</td>
                            <td className="px-4 py-2 text-right text-red-600">($156,310)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Metal Fabrications</td>
                            <td className="px-4 py-2 text-right">$80,870</td>
                            <td className="px-4 py-2 text-right text-gray-600">$3</td>
                            <td className="px-4 py-2 text-right">$70,725</td>
                            <td className="px-4 py-2 text-right">$108,670</td>
                            <td className="px-4 py-2 text-right">$179,395</td>
                            <td className="px-4 py-2 text-right text-gray-600">$7</td>
                            <td className="px-4 py-2 text-right text-red-600">($98,525)</td>
                          </tr>

                          {/* Division 06 - Wood, Plastics & Composites */}
                          <tr className="bg-green-50 border-b border-green-200">
                            <td className="px-4 py-3 font-bold text-green-800">Division 06 - Wood, Plastics & Composites</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$1,423,777</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$55</td>
                            <td className="px-4 py-3 text-right">$148,878</td>
                            <td className="px-4 py-3 text-right">$1,318,727</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$1,467,605</td>
                            <td className="px-4 py-3 text-right font-bold text-green-800">$56</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">($43,828)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Rough Carpentry</td>
                            <td className="px-4 py-2 text-right">$854,266</td>
                            <td className="px-4 py-2 text-right text-gray-600">$32</td>
                            <td className="px-4 py-2 text-right">$89,327</td>
                            <td className="px-4 py-2 text-right">$791,236</td>
                            <td className="px-4 py-2 text-right">$880,563</td>
                            <td className="px-4 py-2 text-right text-gray-600">$33</td>
                            <td className="px-4 py-2 text-right text-green-600">$26,297</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Finish Carpentry</td>
                            <td className="px-4 py-2 text-right">$398,344</td>
                            <td className="px-4 py-2 text-right text-gray-600">$15</td>
                            <td className="px-4 py-2 text-right">$41,659</td>
                            <td className="px-4 py-2 text-right">$368,518</td>
                            <td className="px-4 py-2 text-right">$410,177</td>
                            <td className="px-4 py-2 text-right text-gray-600">$16</td>
                            <td className="px-4 py-2 text-right text-green-600">$11,833</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Architectural Woodwork</td>
                            <td className="px-4 py-2 text-right">$171,167</td>
                            <td className="px-4 py-2 text-right text-gray-600">$7</td>
                            <td className="px-4 py-2 text-right">$17,892</td>
                            <td className="px-4 py-2 text-right">$158,973</td>
                            <td className="px-4 py-2 text-right">$176,865</td>
                            <td className="px-4 py-2 text-right text-gray-600">$7</td>
                            <td className="px-4 py-2 text-right text-red-600">($5,698)</td>
                          </tr>

                          {/* Division 07 - Thermal & Moisture Protection */}
                          <tr className="bg-purple-50 border-b border-purple-200">
                            <td className="px-4 py-3 font-bold text-purple-800">Division 07 - Thermal & Moisture Protection</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$1,198,663</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$46</td>
                            <td className="px-4 py-3 text-right">$125,347</td>
                            <td className="px-4 py-3 text-right">$1,111,797</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$1,237,144</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-800">$47</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">($38,481)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Insulation</td>
                            <td className="px-4 py-2 text-right">$431,519</td>
                            <td className="px-4 py-2 text-right text-gray-600">$16</td>
                            <td className="px-4 py-2 text-right">$45,125</td>
                            <td className="px-4 py-2 text-right">$400,208</td>
                            <td className="px-4 py-2 text-right">$445,333</td>
                            <td className="px-4 py-2 text-right text-gray-600">$17</td>
                            <td className="px-4 py-2 text-right text-green-600">$13,814</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Roofing</td>
                            <td className="px-4 py-2 text-right">$479,330</td>
                            <td className="px-4 py-2 text-right text-gray-600">$18</td>
                            <td className="px-4 py-2 text-right">$50,139</td>
                            <td className="px-4 py-2 text-right">$444,664</td>
                            <td className="px-4 py-2 text-right">$494,803</td>
                            <td className="px-4 py-2 text-right text-gray-600">$19</td>
                            <td className="px-4 py-2 text-right text-red-600">($15,473)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Siding & Exterior Systems</td>
                            <td className="px-4 py-2 text-right">$287,814</td>
                            <td className="px-4 py-2 text-right text-gray-600">$11</td>
                            <td className="px-4 py-2 text-right">$30,083</td>
                            <td className="px-4 py-2 text-right">$266,925</td>
                            <td className="px-4 py-2 text-right">$297,008</td>
                            <td className="px-4 py-2 text-right text-gray-600">$11</td>
                            <td className="px-4 py-2 text-right text-red-600">($9,194)</td>
                          </tr>

                          {/* Division 08 - Openings */}
                          <tr className="bg-yellow-50 border-b border-yellow-200">
                            <td className="px-4 py-3 font-bold text-yellow-800">Division 08 - Openings</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$842,456</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$32</td>
                            <td className="px-4 py-3 text-right">$88,077</td>
                            <td className="px-4 py-3 text-right">$781,210</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$869,287</td>
                            <td className="px-4 py-3 text-right font-bold text-yellow-800">$33</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">($26,831)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Doors & Frames</td>
                            <td className="px-4 py-2 text-right">$253,337</td>
                            <td className="px-4 py-2 text-right text-gray-600">$10</td>
                            <td className="px-4 py-2 text-right">$26,489</td>
                            <td className="px-4 py-2 text-right">$234,963</td>
                            <td className="px-4 py-2 text-right">$261,452</td>
                            <td className="px-4 py-2 text-right text-gray-600">$10</td>
                            <td className="px-4 py-2 text-right text-green-600">$8,115</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Windows</td>
                            <td className="px-4 py-2 text-right">$589,119</td>
                            <td className="px-4 py-2 text-right text-gray-600">$22</td>
                            <td className="px-4 py-2 text-right">$61,588</td>
                            <td className="px-4 py-2 text-right">$546,247</td>
                            <td className="px-4 py-2 text-right">$607,835</td>
                            <td className="px-4 py-2 text-right text-gray-600">$23</td>
                            <td className="px-4 py-2 text-right text-red-600">($18,716)</td>
                          </tr>

                          {/* Division 09 - Finishes */}
                          <tr className="bg-indigo-50 border-b border-indigo-200">
                            <td className="px-4 py-3 font-bold text-indigo-800">Division 09 - Finishes</td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-800">$987,657</td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-800">$38</td>
                            <td className="px-4 py-3 text-right">$103,337</td>
                            <td className="px-4 py-3 text-right">$916,073</td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-800">$1,019,410</td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-800">$39</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">($31,753)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Gypsum Board</td>
                            <td className="px-4 py-2 text-right">$296,297</td>
                            <td className="px-4 py-2 text-right text-gray-600">$11</td>
                            <td className="px-4 py-2 text-right">$31,009</td>
                            <td className="px-4 py-2 text-right">$274,822</td>
                            <td className="px-4 py-2 text-right">$305,831</td>
                            <td className="px-4 py-2 text-right text-gray-600">$12</td>
                            <td className="px-4 py-2 text-right text-red-600">($9,534)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Flooring</td>
                            <td className="px-4 py-2 text-right">$394,663</td>
                            <td className="px-4 py-2 text-right text-gray-600">$15</td>
                            <td className="px-4 py-2 text-right">$41,273</td>
                            <td className="px-4 py-2 text-right">$366,429</td>
                            <td className="px-4 py-2 text-right">$407,702</td>
                            <td className="px-4 py-2 text-right text-gray-600">$15</td>
                            <td className="px-4 py-2 text-right text-red-600">($13,039)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Wall Finishes</td>
                            <td className="px-4 py-2 text-right">$197,331</td>
                            <td className="px-4 py-2 text-right text-gray-600">$8</td>
                            <td className="px-4 py-2 text-right">$20,637</td>
                            <td className="px-4 py-2 text-right">$183,215</td>
                            <td className="px-4 py-2 text-right">$203,852</td>
                            <td className="px-4 py-2 text-right text-gray-600">$8</td>
                            <td className="px-4 py-2 text-right text-red-600">($6,521)</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Ceiling Finishes</td>
                            <td className="px-4 py-2 text-right">$99,366</td>
                            <td className="px-4 py-2 text-right text-gray-600">$4</td>
                            <td className="px-4 py-2 text-right">$10,388</td>
                            <td className="px-4 py-2 text-right">$92,207</td>
                            <td className="px-4 py-2 text-right">$102,595</td>
                            <td className="px-4 py-2 text-right text-gray-600">$4</td>
                            <td className="px-4 py-2 text-right text-red-600">($3,229)</td>
                          </tr>

                          {/* Equipment & Special Construction */}
                          <tr className="bg-pink-50 border-b border-pink-200">
                            <td className="px-4 py-3 font-bold text-pink-800">Divisions 10-14 - Specialties & Equipment</td>
                            <td className="px-4 py-3 text-right font-bold text-pink-800">$221,062</td>
                            <td className="px-4 py-3 text-right font-bold text-pink-800">$8</td>
                            <td className="px-4 py-3 text-right">$68,827</td>
                            <td className="px-4 py-3 text-right">$139,859</td>
                            <td className="px-4 py-3 text-right font-bold text-pink-800">$208,686</td>
                            <td className="px-4 py-3 text-right font-bold text-pink-800">$8</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$12,376</td>
                          </tr>

                          {/* MEP Systems */}
                          <tr className="bg-cyan-50 border-b border-cyan-200">
                            <td className="px-4 py-3 font-bold text-cyan-800">Divisions 21-26 - MEP Systems</td>
                            <td className="px-4 py-3 text-right font-bold text-cyan-800">$2,262,827</td>
                            <td className="px-4 py-3 text-right font-bold text-cyan-800">$87</td>
                            <td className="px-4 py-3 text-right">$1,304,248</td>
                            <td className="px-4 py-3 text-right">$854,052</td>
                            <td className="px-4 py-3 text-right font-bold text-cyan-800">$2,158,300</td>
                            <td className="px-4 py-3 text-right font-bold text-cyan-800">$82</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$104,527</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Plumbing</td>
                            <td className="px-4 py-2 text-right">$904,331</td>
                            <td className="px-4 py-2 text-right text-gray-600">$35</td>
                            <td className="px-4 py-2 text-right">$521,699</td>
                            <td className="px-4 py-2 text-right">$341,621</td>
                            <td className="px-4 py-2 text-right">$863,320</td>
                            <td className="px-4 py-2 text-right text-gray-600">$33</td>
                            <td className="px-4 py-2 text-right text-green-600">$41,011</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">HVAC</td>
                            <td className="px-4 py-2 text-right">$904,331</td>
                            <td className="px-4 py-2 text-right text-gray-600">$35</td>
                            <td className="px-4 py-2 text-right">$521,699</td>
                            <td className="px-4 py-2 text-right">$341,621</td>
                            <td className="px-4 py-2 text-right">$863,320</td>
                            <td className="px-4 py-2 text-right text-gray-600">$33</td>
                            <td className="px-4 py-2 text-right text-green-600">$41,011</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-700">Electrical</td>
                            <td className="px-4 py-2 text-right">$454,165</td>
                            <td className="px-4 py-2 text-right text-gray-600">$17</td>
                            <td className="px-4 py-2 text-right">$260,850</td>
                            <td className="px-4 py-2 text-right">$170,810</td>
                            <td className="px-4 py-2 text-right">$431,660</td>
                            <td className="px-4 py-2 text-right text-gray-600">$16</td>
                            <td className="px-4 py-2 text-right text-green-600">$22,505</td>
                          </tr>

                          {/* Site Work */}
                          <tr className="bg-emerald-50 border-b border-emerald-200">
                            <td className="px-4 py-3 font-bold text-emerald-800">Divisions 31-33 - Site Work</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-800">$1,002,646</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-800">$38</td>
                            <td className="px-4 py-3 text-right">$1,003,239</td>
                            <td className="px-4 py-3 text-right">$0</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-800">$1,003,239</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-800">$38</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">($593)</td>
                          </tr>

                          {/* GC Charges & Fees */}
                          <tr className="bg-slate-100 border-b border-slate-300">
                            <td className="px-4 py-3 font-bold text-slate-800">General Conditions & Fees</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">$1,709,446</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">$66</td>
                            <td className="px-4 py-3 text-right">$735,670</td>
                            <td className="px-4 py-3 text-right">$699,302</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">$1,434,972</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">$55</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">$274,474</td>
                          </tr>

                          {/* Totals */}
                          <tr className="bg-gradient-to-r from-raap-green to-green-600 text-white border-t-2 border-raap-dark">
                            <td className="px-4 py-4 font-bold text-lg">TOTAL PROJECT COST</td>
                            <td className="px-4 py-4 text-right font-bold text-lg">$10,960,303</td>
                            <td className="px-4 py-4 text-right font-bold text-lg">$422</td>
                            <td className="px-4 py-4 text-right font-bold">$4,725,325</td>
                            <td className="px-4 py-4 text-right font-bold">$6,096,240</td>
                            <td className="px-4 py-4 text-right font-bold text-lg">$10,821,565</td>
                            <td className="px-4 py-4 text-right font-bold text-lg">$411</td>
                            <td className="px-4 py-4 text-right font-bold text-lg">$138,738</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Cost Advantages</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <p><strong>Factory Efficiency:</strong> Controlled environment reduces waste and increases precision</p>
                          <p><strong>Bulk Purchasing:</strong> Material savings through volume purchasing</p>
                          <p><strong>Reduced Site Labor:</strong> Less field work required</p>
                          <p><strong>Timeline Acceleration:</strong> Parallel construction saves carrying costs</p>
                          <p><strong>Quality Control:</strong> Factory QC reduces rework costs</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Project Parameters</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <p><strong>Location:</strong> Olivehurst, CA 95961</p>
                          <p><strong>Fabricator:</strong> Tracy, CA 95304</p>
                          <p><strong>Prevailing Wage:</strong> Yes</p>
                          <p><strong>Base Design:</strong> RaaP Standard</p>
                          <p><strong>1st Floor:</strong> Units on Slab</p>
                          <p><strong>Modular Efficiency:</strong> 109%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Cost Assessment Summary</h4>
                    <p className="text-sm text-gray-700">
                      The modular approach delivers meaningful cost savings of 1.2% ($138K) while providing a 4-month timeline advantage. 
                      Cost for sustainability enhancements have not been considered at this stage but would apply equally to both construction methods. 
                      Soft cost savings due to lower design costs provide additional project value.
                    </p>
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
                      <strong>Score of 5/5:</strong> No transportation or setting constraints. 
                      Easy access from the highway and available open space for staging site.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Transportation Analysis</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2">
                          <p><strong>Factory Location:</strong> Tracy, CA</p>
                          <p><strong>Site Location:</strong> 5224 Chestnut Rd, Olivehurst, CA</p>
                          <p><strong>Highway Access:</strong> Within 1/2 mile of Highway 70</p>
                          <p><strong>Exit Route:</strong> Exit 18A to Olivehurst Ave and Chestnut Rd</p>
                          <p><strong>Bridge/Access Issues:</strong> None observed</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Site Conditions</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Highway Access</span>
                            <span className="text-green-600 font-semibold">✓ Excellent</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Staging Space</span>
                            <span className="text-green-600 font-semibold">✓ Large Open Area</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Crane Access</span>
                            <span className="text-green-600 font-semibold">✓ Available</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Site Restrictions</span>
                            <span className="text-green-600 font-semibold">✓ None Visible</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Delivery Route Map</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-blue-700">Factory to Site Route</p>
                        <div className="text-sm text-gray-700">
                          <p><strong>Origin:</strong> Tracy, CA 95304 (Fabrication Facility)</p>
                          <p><strong>Destination:</strong> Olivehurst, CA 95961 (Project Site)</p>
                          <p><strong>Primary Route:</strong> I-580 E → I-205 E → CA-99 N → CA-70 N → Exit 18A</p>
                          <p><strong>Distance:</strong> Approximately 85 miles</p>
                          <p><strong>Transit Time:</strong> ~2 hours per delivery</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-3">Installation Considerations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <h5 className="font-semibold text-raap-green mb-2">Setting Advantages</h5>
                        <div className="space-y-2 text-sm">
                          <p>• Direct highway access minimizes transport time</p>
                          <p>• Large staging area allows flexible scheduling</p>
                          <p>• Open site provides multiple crane positions</p>
                          <p>• No neighborhood access restrictions</p>
                          <p>• Utility connections ready for modular hookup</p>
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
                            <div className="font-semibold">13 months</div>
                            <div className="text-sm text-gray-600">Design + Construction</div>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                          <span>Time Savings</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">4 months</div>
                            <div className="text-sm text-gray-600">30% faster</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Schedule Benefits</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <p><strong>Parallel Construction:</strong> Factory and site work overlap</p>
                          <p><strong>Weather Independence:</strong> Factory production unaffected by weather</p>
                          <p><strong>Quality Control:</strong> Reduced field rework and delays</p>
                          <p><strong>Predictable Delivery:</strong> Factory schedule more reliable</p>
                          <p><strong>Faster Assembly:</strong> Modules installed quickly on-site</p>
                          <p><strong>Earlier Occupancy:</strong> Revenue generation starts sooner</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Detailed Construction Schedule</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Milestone</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 font-medium">Project Kick Off</td>
                            <td className="border border-gray-300 px-4 py-2">Day 0</td>
                            <td className="border border-gray-300 px-4 py-2">Project start</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">RaaP SmartStart (SS)</td>
                            <td className="border border-gray-300 px-4 py-2">6 weeks</td>
                            <td className="border border-gray-300 px-4 py-2">Initial design phase</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 font-medium">Entitlement</td>
                            <td className="border border-gray-300 px-4 py-2">4 weeks</td>
                            <td className="border border-gray-300 px-4 py-2">Permit approval process</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">Design Development (DD)</td>
                            <td className="border border-gray-300 px-4 py-2">8 weeks</td>
                            <td className="border border-gray-300 px-4 py-2">Detailed design work</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 font-medium">Factory Permit Set</td>
                            <td className="border border-gray-300 px-4 py-2">1 month after DD</td>
                            <td className="border border-gray-300 px-4 py-2">Manufacturing drawings</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">AHJ Permit Set</td>
                            <td className="border border-gray-300 px-4 py-2">4 months after DD</td>
                            <td className="border border-gray-300 px-4 py-2">Authority Having Jurisdiction permits</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 font-medium">Start Construction & Fabrication</td>
                            <td className="border border-gray-300 px-4 py-2">8 months after start</td>
                            <td className="border border-gray-300 px-4 py-2">Parallel site and factory work</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">Fabrication Period</td>
                            <td className="border border-gray-300 px-4 py-2">1 month</td>
                            <td className="border border-gray-300 px-4 py-2">Factory module production</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 font-medium">Modules Delivered & Installed</td>
                            <td className="border border-gray-300 px-4 py-2">1 month before completion</td>
                            <td className="border border-gray-300 px-4 py-2">Module setting and hookup</td>
                          </tr>
                          <tr className="bg-blue-50">
                            <td className="border border-gray-300 px-4 py-2 font-bold">Project Completion</td>
                            <td className="border border-gray-300 px-4 py-2 font-bold">9 months total</td>
                            <td className="border border-gray-300 px-4 py-2">Ready for occupancy</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Timeline Analysis</h4>
                    <p className="text-sm text-gray-700">
                      The modular approach delivers significant time savings through parallel construction processes. 
                      While site preparation proceeds, modules are being fabricated in the factory under controlled conditions. 
                      This parallel workflow, combined with weather-independent production and predictable installation schedules, 
                      results in a 4-month acceleration compared to traditional site-built construction.
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
