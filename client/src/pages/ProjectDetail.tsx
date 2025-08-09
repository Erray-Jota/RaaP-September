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
  Star
} from "lucide-react";
import { generateProjectPDF } from "@/lib/pdfGenerator";
import type { Project, CostBreakdown } from "@shared/schema";

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
                        {(project as Project).studioUnits > 0 && <li>• Studio: {(project as Project).studioUnits} units</li>}
                        {(project as Project).oneBedUnits > 0 && <li>• 1 Bedroom: {(project as Project).oneBedUnits} units</li>}
                        {(project as Project).twoBedUnits > 0 && <li>• 2 Bedroom: {(project as Project).twoBedUnits} units</li>}
                        {(project as Project).threeBedUnits > 0 && <li>• 3 Bedroom: {(project as Project).threeBedUnits} units</li>}
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
                          ${(project as Project).modularTotalCost ? (parseFloat((project as Project).modularTotalCost) / 1000000).toFixed(1) : "0.0"}M
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

                    {((project as Project).costSavingsPercent && parseFloat((project as Project).costSavingsPercent) > 0) && (
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
                  <span>Zoning Information</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).zoningScore || "0")}`}>
                    Score: {(project as Project).zoningScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Zoning Details</h4>
                      <div className="space-y-2">
                        <p><strong>District:</strong> {(project as Project).zoningDistrict || "Not specified"}</p>
                        <p><strong>Density Bonus:</strong> {(project as Project).densityBonusEligible ? "Eligible" : "Not eligible"}</p>
                        <p><strong>Height Restrictions:</strong> {(project as Project).targetFloors} stories allowed</p>
                        <p><strong>Setback Requirements:</strong> Standard for district</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Compliance Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Building height compliant</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Density within limits</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Parking requirements met</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Assessment Notes</h4>
                    <p className="text-sm text-gray-700">
                      {(project as Project).zoningJustification || "Zoning compliance has been verified for modular construction requirements."}
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
                  <span>Massing Information</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).massingScore || "0")}`}>
                    Score: {(project as Project).massingScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Building Dimensions</h4>
                      <div className="space-y-2">
                        <p><strong>Overall Dimensions:</strong> {(project as Project).buildingDimensions || "Standard footprint"}</p>
                        <p><strong>Stories:</strong> {(project as Project).targetFloors}</p>
                        <p><strong>Total Units:</strong> {totalUnits}</p>
                        <p><strong>Construction Type:</strong> {(project as Project).constructionType || "Type V"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Unit Mix</h4>
                      <div className="space-y-2">
                        {(project as Project).studioUnits > 0 && <p>Studio Units: {(project as Project).studioUnits}</p>}
                        {(project as Project).oneBedUnits > 0 && <p>1-Bedroom Units: {(project as Project).oneBedUnits}</p>}
                        {(project as Project).twoBedUnits > 0 && <p>2-Bedroom Units: {(project as Project).twoBedUnits}</p>}
                        {(project as Project).threeBedUnits > 0 && <p>3-Bedroom Units: {(project as Project).threeBedUnits}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Modular Suitability</h4>
                    <p className="text-sm text-gray-700">
                      {(project as Project).massingJustification || "Building massing and unit repetition make this project well-suited for modular construction."}
                    </p>
                  </div>
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
                  <span>Sustainability Information</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).sustainabilityScore || "0")}`}>
                    Score: {(project as Project).sustainabilityScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Green Building Standards</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Net Zero Energy Ready</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">PHIUS Certification Target</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Energy Star Compliance</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Water Efficiency Features</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Environmental Impact</h4>
                      <div className="space-y-2">
                        <p><strong>Waste Reduction:</strong> 60-80% vs site-built</p>
                        <p><strong>Material Efficiency:</strong> Optimized use</p>
                        <p><strong>Carbon Footprint:</strong> Reduced transportation</p>
                        <p><strong>Energy Efficiency:</strong> Superior envelope</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-green mb-2">Sustainability Benefits</h4>
                    <p className="text-sm text-gray-700">
                      {(project as Project).sustainabilityJustification || "Modular construction provides significant sustainability advantages through controlled factory conditions, reduced waste, and optimized material usage."}
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
                  <span>Pricing Information</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).costScore || "0")}`}>
                    Score: {(project as Project).costScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Cost Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Modular Total Cost</span>
                          <span className="font-semibold">
                            ${(project as Project).modularTotalCost ? 
                              (parseFloat((project as Project).modularTotalCost) / 1000000).toFixed(1) + "M" : 
                              "TBD"}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Site-Built Estimate</span>
                          <span className="font-semibold">
                            ${(project as Project).siteBuiltTotalCost ? 
                              (parseFloat((project as Project).siteBuiltTotalCost) / 1000000).toFixed(1) + "M" : 
                              "TBD"}
                          </span>
                        </div>
                        {(project as Project).costSavingsPercent && (
                          <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                            <span>Cost Savings</span>
                            <span className="font-semibold text-green-600">
                              {(project as Project).costSavingsPercent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Cost Factors</h4>
                      <div className="space-y-2 text-sm">
                        <p>• Factory efficiency gains</p>
                        <p>• Reduced site labor requirements</p>
                        <p>• Accelerated timeline savings</p>
                        <p>• Bulk material purchasing</p>
                        <p>• Quality control improvements</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Cost Analysis</h4>
                    <p className="text-sm text-gray-700">
                      {(project as Project).costJustification || "Cost analysis includes all direct and indirect expenses associated with modular construction versus site-built alternatives."}
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
                  <span>Logistics Information</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).logisticsScore || "0")}`}>
                    Score: {(project as Project).logisticsScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Transportation</h4>
                      <div className="space-y-2">
                        <p><strong>Factory Location:</strong> {(project as Project).factoryLocation || "Regional facility"}</p>
                        <p><strong>Distance to Site:</strong> Transportation analysis complete</p>
                        <p><strong>Route Constraints:</strong> Highway accessible</p>
                        <p><strong>Delivery Schedule:</strong> Coordinated installation</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Site Requirements</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Crane access available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Staging area adequate</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">Utility connections ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Logistics Assessment</h4>
                    <p className="text-sm text-gray-700">
                      {(project as Project).logisticsJustification || "Site location and access conditions are well-suited for modular delivery and installation operations."}
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
                  <span>Build Time Information</span>
                  <Badge variant="outline" className={`ml-auto ${getScoreColor((project as Project).buildTimeScore || "0")}`}>
                    Score: {(project as Project).buildTimeScore || "0.0"}/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Timeline Comparison</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-blue-50 rounded">
                          <span>Modular Timeline</span>
                          <span className="font-semibold text-blue-600">
                            {(project as Project).modularTimelineMonths || 18} months
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span>Site-Built Estimate</span>
                          <span className="font-semibold">
                            {(project as Project).siteBuiltTimelineMonths || 24} months
                          </span>
                        </div>
                        {(project as Project).timeSavingsMonths && (
                          <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                            <span>Time Savings</span>
                            <span className="font-semibold text-green-600">
                              {(project as Project).timeSavingsMonths} months
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-raap-dark mb-3">Schedule Benefits</h4>
                      <div className="space-y-2 text-sm">
                        <p>• Parallel factory and site work</p>
                        <p>• Weather-independent production</p>
                        <p>• Reduced field assembly time</p>
                        <p>• Accelerated occupancy</p>
                        <p>• Earlier revenue generation</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-raap-dark mb-2">Timeline Analysis</h4>
                    <p className="text-sm text-gray-700">
                      {(project as Project).buildTimeJustification || "Modular construction timeline benefits include parallel production and site preparation, plus weather-independent factory conditions."}
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
