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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Building Layout */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          Building Layout
                          {project.buildingLayoutComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-100 rounded-lg p-6 text-center">
                          <Building className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 mb-4">Upload building layout files</p>
                          <Button size="sm" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Layout
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProject.mutate({ buildingLayoutComplete: !project.buildingLayoutComplete })}
                          >
                            {project.buildingLayoutComplete ? "Mark Incomplete" : "Mark Complete"}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Unit Designs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          Unit Designs
                          {project.unitDesignsComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Unit Mix</div>
                          <div className="text-sm text-gray-600">
                            {project.studioUnits} Studio, {project.oneBedUnits} 1BR, {project.twoBedUnits} 2BR, {project.threeBedUnits} 3BR
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-6 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 mb-4">Upload unit design files</p>
                          <Button size="sm" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Designs
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProject.mutate({ unitDesignsComplete: !project.unitDesignsComplete })}
                          >
                            {project.unitDesignsComplete ? "Mark Incomplete" : "Mark Complete"}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Building Renderings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          Building Renderings
                          {project.buildingRenderingsComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-100 rounded-lg p-6 text-center">
                          <Eye className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 mb-4">Upload 3D renderings</p>
                          <Button size="sm" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Renderings
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProject.mutate({ buildingRenderingsComplete: !project.buildingRenderingsComplete })}
                          >
                            {project.buildingRenderingsComplete ? "Mark Incomplete" : "Mark Complete"}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Design Package Actions */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Design Package Status</h4>
                        <p className="text-sm text-gray-600">Current status: {project.designPackageStatus || "Not started"}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export Package
                        </Button>
                        <Select
                          value={project.designPackageStatus || ""}
                          onValueChange={(value) => updateProject.mutate({ designPackageStatus: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">In Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
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
