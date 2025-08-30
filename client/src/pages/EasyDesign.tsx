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
import { 
  ArrowLeft, 
  ArrowRight,
  MapPin, 
  Palette,
  Home,
  Layers,
  Cog,
  CheckCircle,
  Circle,
  AlertCircle,
  PaintBucket
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function EasyDesign() {
  const [, params] = useRoute("/projects/:id/easy-design");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;
  const [activeTab, setActiveTab] = useState("overview");

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

  const markAsComplete = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, {
        easyDesignComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "EasyDesign Complete",
        description: "Your design customization and finalization is complete. Your project workflow is now finished!",
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
  if (!project.fabAssureComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete FabAssure First</h2>
            <p className="text-gray-600 mb-4">
              You need to complete the FabAssure application before accessing EasyDesign.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/workflow`)} className="mr-2">
              Back to Workflow
            </Button>
            <Button 
              onClick={() => navigate(`/projects/${projectId}/fab-assure`)}
              className="bg-raap-green hover:bg-green-700"
            >
              Complete FabAssure
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  // Calculate progress based on completed tasks
  const completedTasks = [
    project.architecturalPlansFinalized,
    project.interiorDesignComplete,
    project.materialSelectionsFinalized,
    project.systemsDesignComplete,
    project.finalDesignApproval,
  ].filter(Boolean).length;
  const totalTasks = 5;
  const progressPercentage = (completedTasks / totalTasks) * 100;

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
            <h1 className="text-3xl font-bold text-raap-dark mb-2">EasyDesign Application</h1>
            <h2 className="text-xl text-gray-700 mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              Finalize architectural plans, interior design, and material selections
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-gray-500 mb-2">Tasks Complete</div>
            <div className="w-32 mb-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>
            {project.easyDesignComplete && (
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
              <PaintBucket className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Architecture</span>
            </TabsTrigger>
            <TabsTrigger value="interior" className="flex items-center space-x-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Interior</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-1">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="systems" className="flex items-center space-x-1">
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">Systems</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PaintBucket className="h-5 w-5" />
                  <span>EasyDesign Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                    <h3 className="text-xl font-bold text-purple-800 mb-2">Design Customization & Finalization</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      EasyDesign streamlines the final design phase, allowing you to customize and finalize all aspects of your modular units while maintaining manufacturability and cost efficiency.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-purple-700 mb-2">Architectural Plans</h4>
                        <p className="text-sm text-gray-700">Finalize detailed architectural drawings and unit layouts</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-pink-700 mb-2">Interior Design</h4>
                        <p className="text-sm text-gray-700">Select interior finishes, layouts, and design elements</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-blue-700 mb-2">Systems Integration</h4>
                        <p className="text-sm text-gray-700">Coordinate MEP systems and smart building features</p>
                      </div>
                    </div>
                  </div>

                  {/* Task Progress */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-raap-dark text-lg">Design Checklist</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.architecturalPlansFinalized ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Architectural Plans</h5>
                            <p className="text-sm text-gray-600">Finalize detailed architectural drawings and floor plans</p>
                          </div>
                        </div>
                        <Badge variant={project.architecturalPlansFinalized ? "default" : "secondary"}>
                          {project.architecturalPlansFinalized ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.interiorDesignComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Interior Design</h5>
                            <p className="text-sm text-gray-600">Complete interior layouts and design specifications</p>
                          </div>
                        </div>
                        <Badge variant={project.interiorDesignComplete ? "default" : "secondary"}>
                          {project.interiorDesignComplete ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.materialSelectionsFinalized ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Material Selections</h5>
                            <p className="text-sm text-gray-600">Choose final materials, finishes, and fixtures</p>
                          </div>
                        </div>
                        <Badge variant={project.materialSelectionsFinalized ? "default" : "secondary"}>
                          {project.materialSelectionsFinalized ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.systemsDesignComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Systems Design</h5>
                            <p className="text-sm text-gray-600">Finalize MEP systems and technology integration</p>
                          </div>
                        </div>
                        <Badge variant={project.systemsDesignComplete ? "default" : "secondary"}>
                          {project.systemsDesignComplete ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.finalDesignApproval ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Final Design Approval</h5>
                            <p className="text-sm text-gray-600">Obtain final approval for all design elements</p>
                          </div>
                        </div>
                        <Badge variant={project.finalDesignApproval ? "default" : "secondary"}>
                          {project.finalDesignApproval ? "Complete" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Design Level Information */}
                  {project.designCustomizationLevel && (
                    <div className="bg-white rounded-lg p-6 border">
                      <h4 className="font-semibold text-raap-dark mb-3">Design Customization Level</h4>
                      <p className="text-gray-700 capitalize">{project.designCustomizationLevel}</p>
                      {project.designNotes && (
                        <p className="text-sm text-gray-600 mt-2">{project.designNotes}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs with placeholder content */}
          <TabsContent value="architecture">
            <Card>
              <CardHeader>
                <CardTitle>Architectural Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Architectural plan review and finalization tools will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interior">
            <Card>
              <CardHeader>
                <CardTitle>Interior Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Interior design customization and selection tools will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Material Selections</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Material and finish selection catalogs will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systems">
            <Card>
              <CardHeader>
                <CardTitle>Systems Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p>MEP systems and technology integration tools will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Application Button */}
        {!project.easyDesignComplete && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Complete EasyDesign Application</h3>
                  <p className="text-gray-600">
                    Once you've finalized all architectural plans, interior design, material selections, and systems design, 
                    mark this application as complete to finish your project workflow.
                  </p>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => markAsComplete.mutate()}
                  disabled={markAsComplete.isPending}
                  data-testid="button-complete-easydesign"
                >
                  {markAsComplete.isPending ? "Completing..." : "Complete EasyDesign"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {project.easyDesignComplete && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">EasyDesign Complete</h3>
                    <p className="text-green-700">
                      Congratulations! Your design customization and finalization is complete. Your entire project workflow is now finished!
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => navigate(`/projects/${projectId}/workflow`)}
                  data-testid="button-continue-workflow"
                >
                  View Final Workflow
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