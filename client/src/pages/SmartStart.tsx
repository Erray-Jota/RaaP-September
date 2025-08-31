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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight,
  MapPin, 
  FileText,
  Building,
  CheckCircle,
  Circle,
  Users,
  DollarSign,
  AlertCircle,
  Upload,
  Download,
  Mail,
  Phone,
  Eye,
  Edit3,
  Save,
  MessageSquare,
  Calculator,
  Handshake
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function SmartStart() {
  const [, params] = useRoute("/projects/:id/smart-start");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState<string | null>(null);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
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

  const updateProject = useMutation({
    mutationFn: async (updates: Partial<Project>) => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setEditMode(null);
      toast({
        title: "Updates Saved",
        description: "Project information has been updated successfully.",
      });
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

  const markAsComplete = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, {
        smartStartComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "SmartStart Complete",
        description: "Your conceptual design and refined cost package is complete. You can now proceed to FabAssure.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
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

  // Check if user can access this application
  if (!project.modularFeasibilityComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete ModularFeasibility First</h2>
            <p className="text-gray-600 mb-4">
              You need to complete the ModularFeasibility assessment before accessing SmartStart.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/workflow`)} className="mr-2">
              Back to Workflow
            </Button>
            <Button 
              onClick={() => navigate(`/projects/${projectId}/modular-feasibility`)}
              className="bg-raap-green hover:bg-green-700"
            >
              Complete ModularFeasibility
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate progress based on completed tasks
  const completedTasks = [
    project.buildingLayoutComplete,
    project.unitDesignsComplete,
    project.buildingRenderingsComplete,
    project.designHandoffComplete,
    project.pricingValidationComplete,
    project.costFinalizationComplete,
  ].filter(Boolean).length;
  const totalTasks = 6;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Not Started</Badge>;
    switch (status) {
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "review": return <Badge variant="outline">In Review</Badge>;
      case "approved": return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "negotiating": return <Badge variant="outline">Negotiating</Badge>;
      case "finalized": return <Badge className="bg-green-500 text-white">Finalized</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
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
            <h1 className="text-3xl font-bold text-raap-dark mb-2">SmartStart Application</h1>
            <h2 className="text-xl text-gray-700 mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              Conceptual design, AOR collaboration, and refined costs with fabricators and GCs
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-gray-500 mb-2">Components Complete</div>
            <div className="w-32 mb-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>
            {project.smartStartComplete && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center space-x-1">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Design</span>
            </TabsTrigger>
            <TabsTrigger value="aor" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">AOR</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-1">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Cost</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center space-x-1">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">Bids</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>SmartStart Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-green-800 mb-2">Conceptual Design & Refined Costs</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      SmartStart develops comprehensive conceptual designs for your building, coordinates with architect of record for entitlement packages, and validates refined costs with multiple fabricators and general contractors.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-blue-700 mb-2">Design Package</h4>
                        <p className="text-sm text-gray-700">Building layouts, unit designs, and 3D renderings</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-green-700 mb-2">AOR Collaboration</h4>
                        <p className="text-sm text-gray-700">Design handoff and entitlement package development</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-orange-700 mb-2">Cost Package</h4>
                        <p className="text-sm text-gray-700">Validated costs from multiple fabricators and GCs</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-purple-700 mb-2">Cost Collaboration</h4>
                        <p className="text-sm text-gray-700">Finalize costs with selected partners</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Design & Collaboration Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.buildingLayoutComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Building Layout</span>
                          </div>
                          <Badge variant={project.buildingLayoutComplete ? "default" : "secondary"}>
                            {project.buildingLayoutComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.unitDesignsComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Unit Designs</span>
                          </div>
                          <Badge variant={project.unitDesignsComplete ? "default" : "secondary"}>
                            {project.unitDesignsComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.buildingRenderingsComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Building Renderings</span>
                          </div>
                          <Badge variant={project.buildingRenderingsComplete ? "default" : "secondary"}>
                            {project.buildingRenderingsComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.designHandoffComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">AOR Design Handoff</span>
                          </div>
                          <Badge variant={project.designHandoffComplete ? "default" : "secondary"}>
                            {project.designHandoffComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cost Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.pricingValidationComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Cost Validation</span>
                          </div>
                          <Badge variant={project.pricingValidationComplete ? "default" : "secondary"}>
                            {project.pricingValidationComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.refinedCostingComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Refined Costing</span>
                          </div>
                          <Badge variant={project.refinedCostingComplete ? "default" : "secondary"}>
                            {project.refinedCostingComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {project.costFinalizationComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">Cost Finalization</span>
                          </div>
                          <Badge variant={project.costFinalizationComplete ? "default" : "secondary"}>
                            {project.costFinalizationComplete ? "Complete" : "Pending"}
                          </Badge>
                        </div>
                        <div className="text-center pt-4 border-t">
                          <div className="text-sm text-gray-600">Selected Partners</div>
                          {project.finalSelectedFabricator && (
                            <div className="text-sm font-medium">Fab: {project.finalSelectedFabricator}</div>
                          )}
                          {project.finalSelectedGc && (
                            <div className="text-sm font-medium">GC: {project.finalSelectedGc}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Package Tab */}
          <TabsContent value="design">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Design Package</span>
                    </div>
                    {getStatusBadge(project.designPackageStatus)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Design Package Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-blue-800">Design Package Status</h3>
                        <div className="text-3xl font-bold text-blue-600">5/5</div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Complete Design Package:</strong> 24-unit modular building with contemporary architecture, 
                        optimized for efficient construction and premium finishes. All design components approved.
                      </p>
                      <div className="text-xs text-blue-600 font-medium">
                        Ready for AOR collaboration and entitlement package development
                      </div>
                    </div>

                    {/* Design Sub-Tabs */}
                    <Tabs defaultValue="specifications" className="w-full">
                      <TabsList className="grid grid-cols-5 w-full mb-6">
                        <TabsTrigger value="specifications">Specifications</TabsTrigger>
                        <TabsTrigger value="unit-plans">Unit Plans</TabsTrigger>
                        <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
                        <TabsTrigger value="3d-view">3D View</TabsTrigger>
                        <TabsTrigger value="site-plan">Site Plan</TabsTrigger>
                      </TabsList>

                      {/* Specifications Sub-Tab */}
                      <TabsContent value="specifications">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Unit Mix Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-blue-600">6</div>
                                  <div className="text-sm font-medium text-blue-700">1-Bedroom</div>
                                  <div className="text-xs text-gray-600">650 sq ft avg</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-green-600">12</div>
                                  <div className="text-sm font-medium text-green-700">2-Bedroom</div>
                                  <div className="text-xs text-gray-600">850 sq ft avg</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-purple-600">6</div>
                                  <div className="text-sm font-medium text-purple-700">3-Bedroom</div>
                                  <div className="text-xs text-gray-600">1,100 sq ft avg</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Building Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Total Units</span>
                                <span className="text-sm">24 Units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Building Type</span>
                                <span className="text-sm">4-Story Podium</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Construction Type</span>
                                <span className="text-sm">Type V-A</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Total Area</span>
                                <span className="text-sm">19,008 sq ft</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Parking Spaces</span>
                                <span className="text-sm">32 Spaces</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Amenity Space</span>
                                <span className="text-sm">1,200 sq ft</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="mt-6">
                          <CardHeader>
                            <CardTitle className="text-lg">Modular Specifications</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-blue-700">Module Dimensions</div>
                                <div className="text-sm text-gray-600">14' x 60' Standard<br />12' x 48' Compact</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-green-700">Structural System</div>
                                <div className="text-sm text-gray-600">Light Gauge Steel Frame<br />Welded Connections</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-orange-700">Exterior Cladding</div>
                                <div className="text-sm text-gray-600">Fiber Cement Panels<br />Metal Accent Elements</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-purple-700">Interior Finishes</div>
                                <div className="text-sm text-gray-600">Luxury Vinyl Plank<br />Quartz Countertops</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Unit Plans Sub-Tab */}
                      <TabsContent value="unit-plans">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">1-Bedroom Unit (650 sf)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-gray-100 rounded-lg p-8 text-center mb-4">
                                <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <div className="text-sm text-gray-600">1BR Unit Floor Plan</div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div><strong>Layout:</strong> Open concept living/kitchen</div>
                                <div><strong>Bedroom:</strong> 12' x 11' with walk-in closet</div>
                                <div><strong>Kitchen:</strong> Galley style with island</div>
                                <div><strong>Bathroom:</strong> Full bath with tub/shower</div>
                                <div><strong>Features:</strong> In-unit laundry, private balcony</div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">2-Bedroom Unit (850 sf)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-gray-100 rounded-lg p-8 text-center mb-4">
                                <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <div className="text-sm text-gray-600">2BR Unit Floor Plan</div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div><strong>Layout:</strong> Split bedroom design</div>
                                <div><strong>Master:</strong> 13' x 12' with en-suite bath</div>
                                <div><strong>Second BR:</strong> 11' x 10' with closet</div>
                                <div><strong>Kitchen:</strong> L-shaped with peninsula</div>
                                <div><strong>Features:</strong> 2 full baths, large balcony</div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">3-Bedroom Unit (1,100 sf)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-gray-100 rounded-lg p-8 text-center mb-4">
                                <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <div className="text-sm text-gray-600">3BR Unit Floor Plan</div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div><strong>Layout:</strong> Family-oriented design</div>
                                <div><strong>Master:</strong> 14' x 13' with walk-in closet</div>
                                <div><strong>Bedrooms:</strong> 11' x 10' and 10' x 10'</div>
                                <div><strong>Kitchen:</strong> U-shaped with breakfast bar</div>
                                <div><strong>Features:</strong> 2.5 baths, utility room</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Floor Plan Sub-Tab */}
                      <TabsContent value="floor-plan">
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Building Floor Plans</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Ground Floor (Parking + Amenities)</h4>
                                  <div className="bg-gray-100 rounded-lg p-12 text-center mb-4">
                                    <Building className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                                    <div className="text-sm text-gray-600">Ground Floor Plan</div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Parking:</strong> 32 spaces (1.33 per unit)</div>
                                    <div><strong>Amenities:</strong> Community room, fitness center</div>
                                    <div><strong>Services:</strong> Mail room, bike storage</div>
                                    <div><strong>Access:</strong> Secure entry, elevator core</div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Typical Floor (6 Units)</h4>
                                  <div className="bg-gray-100 rounded-lg p-12 text-center mb-4">
                                    <Building className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                                    <div className="text-sm text-gray-600">Typical Floor Plan</div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Layout:</strong> Double-loaded corridor</div>
                                    <div><strong>Circulation:</strong> 6' wide hallways</div>
                                    <div><strong>Utilities:</strong> Central mechanical rooms</div>
                                    <div><strong>Emergency:</strong> Two means of egress</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* 3D View Sub-Tab */}
                      <TabsContent value="3d-view">
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Building Renderings</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Street View Rendering</h4>
                                  <div className="bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg p-16 text-center mb-4">
                                    <Building className="h-24 w-24 mx-auto mb-4 text-blue-400" />
                                    <div className="text-sm text-blue-600">Front Elevation Rendering</div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Architecture:</strong> Contemporary design with clean lines</div>
                                    <div><strong>Materials:</strong> Fiber cement, metal accents</div>
                                    <div><strong>Colors:</strong> Warm gray with dark trim</div>
                                    <div><strong>Features:</strong> Private balconies, large windows</div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Courtyard View</h4>
                                  <div className="bg-gradient-to-b from-green-100 to-green-200 rounded-lg p-16 text-center mb-4">
                                    <Building className="h-24 w-24 mx-auto mb-4 text-green-400" />
                                    <div className="text-sm text-green-600">Rear Elevation Rendering</div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Modular Advantages:</strong> Precise factory construction</div>
                                    <div><strong>Quality Control:</strong> Indoor assembly environment</div>
                                    <div><strong>Speed:</strong> 50% faster than stick-built</div>
                                    <div><strong>Sustainability:</strong> Reduced material waste</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Site Plan Sub-Tab */}
                      <TabsContent value="site-plan">
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Site Layout & Planning</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Site Plan</h4>
                                  <div className="bg-gradient-to-br from-yellow-100 to-orange-200 rounded-lg p-16 text-center mb-4">
                                    <Building className="h-24 w-24 mx-auto mb-4 text-orange-400" />
                                    <div className="text-sm text-orange-600">Site Layout Plan</div>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Building Footprint:</strong> 8,500 sq ft</div>
                                    <div><strong>Setbacks:</strong> Front 15', Side 10', Rear 20'</div>
                                    <div><strong>Parking Layout:</strong> Surface lot with 32 spaces</div>
                                    <div><strong>Landscaping:</strong> 25% open space requirement</div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Site Statistics</h4>
                                  <div className="bg-white border rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Lot Size</span>
                                      <span className="text-sm">0.75 acres</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Building Coverage</span>
                                      <span className="text-sm">26%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Floor Area Ratio</span>
                                      <span className="text-sm">1.45</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Density</span>
                                      <span className="text-sm">32 units/acre</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Open Space</span>
                                      <span className="text-sm">28%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Parking Ratio</span>
                                      <span className="text-sm">1.33 spaces/unit</span>
                                    </div>
                                  </div>

                                  <h4 className="font-semibold mb-3 mt-6">Site Features</h4>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Access:</strong> Two-way driveway from main street</div>
                                    <div><strong>Utilities:</strong> All services available at street</div>
                                    <div><strong>Stormwater:</strong> On-site retention system</div>
                                    <div><strong>Zoning:</strong> R-3 Multi-family Residential</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => updateProject.mutate({ buildingLayoutComplete: !project.buildingLayoutComplete })}
                      >
                        {project.buildingLayoutComplete ? "Mark Incomplete" : "Mark Complete"}
                      </Button>
                      <div className="space-x-2">
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download Package
                        </Button>
                        <Button>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AOR Collaboration Tab */}
          <TabsContent value="aor">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Architect of Record (AOR) Collaboration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* AOR Partner Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          AOR Partner
                          {editMode === "aor" ? (
                            <Button size="sm" onClick={() => setEditMode(null)}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setEditMode("aor")}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {editMode === "aor" ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="aorPartner">Firm Name</Label>
                              <Input
                                id="aorPartner"
                                defaultValue={project.aorPartner || ""}
                                onBlur={(e) => updateProject.mutate({ aorPartner: e.target.value })}
                                placeholder="Enter AOR firm name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="aorContact">Contact Information</Label>
                              <Textarea
                                id="aorContact"
                                defaultValue={project.aorContactInfo || ""}
                                onBlur={(e) => updateProject.mutate({ aorContactInfo: e.target.value })}
                                placeholder="Contact details (JSON format)"
                                rows={3}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium">Firm Name</div>
                              <div className="text-sm text-gray-600">{project.aorPartner || "Not specified"}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium">Contact Information</div>
                              <div className="text-sm text-gray-600">{project.aorContactInfo || "Not specified"}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-2" />
                            Email AOR
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            Call AOR
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Design Handoff Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Design Handoff & Entitlement Package</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {project.designHandoffComplete ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-sm">Design Handoff</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(project.aorReviewStatus)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProject.mutate({ designHandoffComplete: !project.designHandoffComplete })}
                              >
                                {project.designHandoffComplete ? "Mark Incomplete" : "Mark Complete"}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>AOR Review Status</Label>
                            <Select
                              value={project.aorReviewStatus || ""}
                              onValueChange={(value) => updateProject.mutate({ aorReviewStatus: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select review status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewing">Reviewing</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="revisions_requested">Revisions Requested</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Entitlement Package Status</Label>
                            <Select
                              value={project.entitlementPackageStatus || ""}
                              onValueChange={(value) => updateProject.mutate({ entitlementPackageStatus: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select package status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">Planning</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AOR Feedback Section */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>AOR Feedback & Communication</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="aorFeedback">AOR Feedback</Label>
                          <Textarea
                            id="aorFeedback"
                            defaultValue={project.aorFeedback || ""}
                            onBlur={(e) => updateProject.mutate({ aorFeedback: e.target.value })}
                            placeholder="Record feedback from AOR reviews and meetings"
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download Design Package
                          </Button>
                          <Button>
                            <Mail className="h-4 w-4 mr-2" />
                            Send to AOR
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cost Package Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Cost Analysis</span>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                    Score: 4.0/5.0
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score & Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-green-800">Cost Assessment</h3>
                      <div className="text-3xl font-bold text-green-600">4/5</div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Score of 4/5:</strong> $10.8M ($411/sf; $451K/unit) with Prevailing Wage. 
                      1.2% savings over site-built ($138K total savings). Modular is cheaper than site-built.
                    </p>
                    <div className="text-xs text-green-600 font-medium">
                      Weight: 20% of overall feasibility score
                    </div>
                  </div>

                  {/* Detailed MasterFormat Cost Breakdown */}
                  <div>
                    <h4 className="font-semibold text-raap-dark mb-4">Detailed MasterFormat Cost Breakdown</h4>
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
                            <td className="px-3 py-2 text-right font-semibold">$1,311,770</td>
                            <td className="px-3 py-2 text-right">$50</td>
                            <td className="px-3 py-2 text-right">$1,147,404</td>
                            <td className="px-3 py-2 text-right">$281,220</td>
                            <td className="px-3 py-2 text-right font-semibold">$1,428,623</td>
                            <td className="px-3 py-2 text-right">$54</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">-$116,853</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">03 Concrete</td>
                            <td className="px-3 py-2 text-right">$407,021</td>
                            <td className="px-3 py-2 text-right">$16</td>
                            <td className="px-3 py-2 text-right">$285,136</td>
                            <td className="px-3 py-2 text-right">$164,393</td>
                            <td className="px-3 py-2 text-right">$449,528</td>
                            <td className="px-3 py-2 text-right">$17</td>
                            <td className="px-3 py-2 text-right text-red-600">-$42,507</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">04 Masonry</td>
                            <td className="px-3 py-2 text-right">$233,482</td>
                            <td className="px-3 py-2 text-right">$9</td>
                            <td className="px-3 py-2 text-right">$260,237</td>
                            <td className="px-3 py-2 text-right">-</td>
                            <td className="px-3 py-2 text-right">$260,237</td>
                            <td className="px-3 py-2 text-right">$10</td>
                            <td className="px-3 py-2 text-right text-red-600">-$26,755</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">05 Metal</td>
                            <td className="px-3 py-2 text-right">$671,267</td>
                            <td className="px-3 py-2 text-right">$26</td>
                            <td className="px-3 py-2 text-right">$602,031</td>
                            <td className="px-3 py-2 text-right">$116,827</td>
                            <td className="px-3 py-2 text-right">$718,859</td>
                            <td className="px-3 py-2 text-right">$27</td>
                            <td className="px-3 py-2 text-right text-red-600">-$47,592</td>
                          </tr>

                          {/* Rooms Section */}
                          <tr className="bg-green-50">
                            <td className="px-3 py-2 font-semibold text-green-800">Rooms</td>
                            <td className="px-3 py-2 text-right font-semibold">$4,452,553</td>
                            <td className="px-3 py-2 text-right">$171</td>
                            <td className="px-3 py-2 text-right">$465,938</td>
                            <td className="px-3 py-2 text-right">$4,121,807</td>
                            <td className="px-3 py-2 text-right font-semibold">$4,587,745</td>
                            <td className="px-3 py-2 text-right">$174</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">-$135,192</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">06 Wood & Plastics</td>
                            <td className="px-3 py-2 text-right">$1,982,860</td>
                            <td className="px-3 py-2 text-right">$76</td>
                            <td className="px-3 py-2 text-right">$14,171</td>
                            <td className="px-3 py-2 text-right">$2,137,612</td>
                            <td className="px-3 py-2 text-right">$2,151,783</td>
                            <td className="px-3 py-2 text-right">$82</td>
                            <td className="px-3 py-2 text-right text-red-600">-$168,923</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">07 Thermal & Moisture Protection</td>
                            <td className="px-3 py-2 text-right">$490,766</td>
                            <td className="px-3 py-2 text-right">$19</td>
                            <td className="px-3 py-2 text-right">$289,407</td>
                            <td className="px-3 py-2 text-right">$293,030</td>
                            <td className="px-3 py-2 text-right">$582,437</td>
                            <td className="px-3 py-2 text-right">$22</td>
                            <td className="px-3 py-2 text-right text-red-600">-$91,671</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">08 Openings</td>
                            <td className="px-3 py-2 text-right">$486,606</td>
                            <td className="px-3 py-2 text-right">$19</td>
                            <td className="px-3 py-2 text-right">$138,123</td>
                            <td className="px-3 py-2 text-right">$337,164</td>
                            <td className="px-3 py-2 text-right">$475,287</td>
                            <td className="px-3 py-2 text-right">$18</td>
                            <td className="px-3 py-2 text-right text-green-600">$11,319</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">09 Finishes</td>
                            <td className="px-3 py-2 text-right">$1,492,321</td>
                            <td className="px-3 py-2 text-right">$57</td>
                            <td className="px-3 py-2 text-right">$24,237</td>
                            <td className="px-3 py-2 text-right">$1,354,001</td>
                            <td className="px-3 py-2 text-right">$1,378,238</td>
                            <td className="px-3 py-2 text-right">$52</td>
                            <td className="px-3 py-2 text-right text-green-600">$114,083</td>
                          </tr>

                          {/* Equipment & Special Construction Section */}
                          <tr className="bg-orange-50">
                            <td className="px-3 py-2 font-semibold text-orange-800">Equipment & Special Construction</td>
                            <td className="px-3 py-2 text-right font-semibold">$221,062</td>
                            <td className="px-3 py-2 text-right">$9</td>
                            <td className="px-3 py-2 text-right">$68,827</td>
                            <td className="px-3 py-2 text-right">$139,859</td>
                            <td className="px-3 py-2 text-right font-semibold">$208,686</td>
                            <td className="px-3 py-2 text-right">$8</td>
                            <td className="px-3 py-2 text-right text-green-600 font-semibold">$12,376</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">10 Specialties</td>
                            <td className="px-3 py-2 text-right">$55,363</td>
                            <td className="px-3 py-2 text-right">$2</td>
                            <td className="px-3 py-2 text-right">-</td>
                            <td className="px-3 py-2 text-right">$47,078</td>
                            <td className="px-3 py-2 text-right">$47,078</td>
                            <td className="px-3 py-2 text-right">$2</td>
                            <td className="px-3 py-2 text-right text-green-600">$8,285</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">11 Equipment</td>
                            <td className="px-3 py-2 text-right">$16,837</td>
                            <td className="px-3 py-2 text-right">$1</td>
                            <td className="px-3 py-2 text-right">$16,837</td>
                            <td className="px-3 py-2 text-right">-</td>
                            <td className="px-3 py-2 text-right">$16,837</td>
                            <td className="px-3 py-2 text-right">$1</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">12 Furnishing</td>
                            <td className="px-3 py-2 text-right">$99,730</td>
                            <td className="px-3 py-2 text-right">$4</td>
                            <td className="px-3 py-2 text-right">$2,858</td>
                            <td className="px-3 py-2 text-right">$92,781</td>
                            <td className="px-3 py-2 text-right">$95,639</td>
                            <td className="px-3 py-2 text-right">$4</td>
                            <td className="px-3 py-2 text-right text-green-600">$4,091</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">13 Special Construction</td>
                            <td className="px-3 py-2 text-right">$49,132</td>
                            <td className="px-3 py-2 text-right">$2</td>
                            <td className="px-3 py-2 text-right">$49,132</td>
                            <td className="px-3 py-2 text-right">-</td>
                            <td className="px-3 py-2 text-right">$49,132</td>
                            <td className="px-3 py-2 text-right">$2</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>

                          {/* MEPs Section */}
                          <tr className="bg-purple-50">
                            <td className="px-3 py-2 font-semibold text-purple-800">MEPs</td>
                            <td className="px-3 py-2 text-right font-semibold">$1,938,147</td>
                            <td className="px-3 py-2 text-right">$74</td>
                            <td className="px-3 py-2 text-right">$1,026,490</td>
                            <td className="px-3 py-2 text-right">$1,323,688</td>
                            <td className="px-3 py-2 text-right font-semibold">$2,350,178</td>
                            <td className="px-3 py-2 text-right">$90</td>
                            <td className="px-3 py-2 text-right text-red-600 font-semibold">-$412,031</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">21 Fire Suppression</td>
                            <td className="px-3 py-2 text-right">$234,567</td>
                            <td className="px-3 py-2 text-right">$9</td>
                            <td className="px-3 py-2 text-right">$156,789</td>
                            <td className="px-3 py-2 text-right">$123,456</td>
                            <td className="px-3 py-2 text-right">$280,245</td>
                            <td className="px-3 py-2 text-right">$11</td>
                            <td className="px-3 py-2 text-right text-red-600">-$45,678</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">22 Plumbing</td>
                            <td className="px-3 py-2 text-right">$456,789</td>
                            <td className="px-3 py-2 text-right">$18</td>
                            <td className="px-3 py-2 text-right">$234,567</td>
                            <td className="px-3 py-2 text-right">$345,678</td>
                            <td className="px-3 py-2 text-right">$580,245</td>
                            <td className="px-3 py-2 text-right">$22</td>
                            <td className="px-3 py-2 text-right text-red-600">-$123,456</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">23 HVAC</td>
                            <td className="px-3 py-2 text-right">$678,901</td>
                            <td className="px-3 py-2 text-right">$26</td>
                            <td className="px-3 py-2 text-right">$345,678</td>
                            <td className="px-3 py-2 text-right">$456,789</td>
                            <td className="px-3 py-2 text-right">$802,467</td>
                            <td className="px-3 py-2 text-right">$31</td>
                            <td className="px-3 py-2 text-right text-red-600">-$123,566</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">26 Electrical</td>
                            <td className="px-3 py-2 text-right">$567,890</td>
                            <td className="px-3 py-2 text-right">$22</td>
                            <td className="px-3 py-2 text-right">$289,456</td>
                            <td className="px-3 py-2 text-right">$398,765</td>
                            <td className="px-3 py-2 text-right">$688,221</td>
                            <td className="px-3 py-2 text-right">$26</td>
                            <td className="px-3 py-2 text-right text-red-600">-$120,331</td>
                          </tr>

                          {/* Site Work Section */}
                          <tr className="bg-brown-50 border-gray-300 border-t-2">
                            <td className="px-3 py-2 font-semibold text-yellow-900">Site Work</td>
                            <td className="px-3 py-2 text-right font-semibold">$1,247,892</td>
                            <td className="px-3 py-2 text-right">$48</td>
                            <td className="px-3 py-2 text-right">$1,247,892</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right font-semibold">$1,247,892</td>
                            <td className="px-3 py-2 text-right">$48</td>
                            <td className="px-3 py-2 text-right text-gray-600 font-semibold">$0</td>
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
                            <td className="px-3 py-2 text-right">$456,123</td>
                            <td className="px-3 py-2 text-right">$17</td>
                            <td className="px-3 py-2 text-right">$456,123</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">$456,123</td>
                            <td className="px-3 py-2 text-right">$17</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">32 Exterior Improvements</td>
                            <td className="px-3 py-2 text-right">$332,456</td>
                            <td className="px-3 py-2 text-right">$13</td>
                            <td className="px-3 py-2 text-right">$332,456</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">$332,456</td>
                            <td className="px-3 py-2 text-right">$13</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">33 Utilities</td>
                            <td className="px-3 py-2 text-right">$334,524</td>
                            <td className="px-3 py-2 text-right">$13</td>
                            <td className="px-3 py-2 text-right">$334,524</td>
                            <td className="px-3 py-2 text-right">$0</td>
                            <td className="px-3 py-2 text-right">$334,524</td>
                            <td className="px-3 py-2 text-right">$13</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>

                          {/* GC Charges Section */}
                          <tr className="bg-gray-100">
                            <td className="px-3 py-2 font-semibold text-gray-800">GC Charges</td>
                            <td className="px-3 py-2 text-right font-semibold">$892,345</td>
                            <td className="px-3 py-2 text-right">$34</td>
                            <td className="px-3 py-2 text-right">$456,789</td>
                            <td className="px-3 py-2 text-right">$234,567</td>
                            <td className="px-3 py-2 text-right font-semibold">$691,356</td>
                            <td className="px-3 py-2 text-right">$26</td>
                            <td className="px-3 py-2 text-right text-green-600 font-semibold">$200,989</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">01 General Requirements</td>
                            <td className="px-3 py-2 text-right">$692,345</td>
                            <td className="px-3 py-2 text-right">$27</td>
                            <td className="px-3 py-2 text-right">$356,789</td>
                            <td className="px-3 py-2 text-right">$134,567</td>
                            <td className="px-3 py-2 text-right">$491,356</td>
                            <td className="px-3 py-2 text-right">$19</td>
                            <td className="px-3 py-2 text-right text-green-600">$200,989</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 pl-6">00 Fees</td>
                            <td className="px-3 py-2 text-right">$200,000</td>
                            <td className="px-3 py-2 text-right">$8</td>
                            <td className="px-3 py-2 text-right">$100,000</td>
                            <td className="px-3 py-2 text-right">$100,000</td>
                            <td className="px-3 py-2 text-right">$200,000</td>
                            <td className="px-3 py-2 text-right">$8</td>
                            <td className="px-3 py-2 text-right">$0</td>
                          </tr>

                          {/* Total Row */}
                          <tr className="bg-gray-700 text-white font-bold text-base">
                            <td className="px-3 py-3">PROJECT TOTAL</td>
                            <td className="px-3 py-3 text-right">$10,060,303</td>
                            <td className="px-3 py-3 text-right">$387</td>
                            <td className="px-3 py-3 text-right">$4,777,945</td>
                            <td className="px-3 py-3 text-right">$6,462,156</td>
                            <td className="px-3 py-3 text-right">$11,240,101</td>
                            <td className="px-3 py-3 text-right">$432</td>
                            <td className="px-3 py-3 text-right text-red-400">-$179,798</td>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="costs">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Handshake className="h-5 w-5" />
                    <span>Project Bids</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Bids and final cost collaboration will be implemented here...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Complete Assessment Button */}
        {!project.smartStartComplete && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Complete SmartStart Application</h3>
                  <p className="text-gray-600">
                    Once you've completed all design work, reviewed AOR requirements, finalized cost analysis, and collected bids, 
                    mark this application as complete to proceed to FabAssure.
                  </p>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => markAsComplete.mutate()}
                  disabled={markAsComplete.isPending}
                  data-testid="button-complete-smartstart"
                >
                  {markAsComplete.isPending ? "Completing..." : "Complete SmartStart"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {project.smartStartComplete && (
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">SmartStart Complete!</span>
              </div>
              <p className="text-green-600 mt-2">
                Your SmartStart application has been completed. You can now proceed to FabAssure for partner marketplace and factory coordination.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
