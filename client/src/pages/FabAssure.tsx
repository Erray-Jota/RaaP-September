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
  Truck,
  Factory,
  Shield,
  CheckCircle,
  Circle,
  Calendar,
  AlertCircle,
  ClipboardCheck
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function FabAssure() {
  const [, params] = useRoute("/projects/:id/fab-assure");
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
        fabAssureComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "FabAssure Complete",
        description: "Your factory coordination and quality assurance process is complete. You can now proceed to EasyDesign.",
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
  if (!project.smartStartComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete SmartStart First</h2>
            <p className="text-gray-600 mb-4">
              You need to complete the SmartStart application before accessing FabAssure.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/workflow`)} className="mr-2">
              Back to Workflow
            </Button>
            <Button 
              onClick={() => navigate(`/projects/${projectId}/smart-start`)}
              className="bg-raap-green hover:bg-green-700"
            >
              Complete SmartStart
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
    project.factorySchedulingComplete,
    project.factoryInspectionScheduled,
    !!project.qualityAssurancePlan,
  ].filter(Boolean).length;
  const totalTasks = 3;
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
            <h1 className="text-3xl font-bold text-raap-dark mb-2">FabAssure Application</h1>
            <h2 className="text-xl text-gray-700 mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              Coordinate factory production, quality assurance, and logistics planning
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-gray-500 mb-2">Tasks Complete</div>
            <div className="w-32 mb-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>
            {project.fabAssureComplete && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="factory" className="flex items-center space-x-1">
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Factory</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex items-center space-x-1">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Logistics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardCheck className="h-5 w-5" />
                  <span>FabAssure Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                    <h3 className="text-xl font-bold text-orange-800 mb-2">Factory Coordination & Quality Assurance</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      FabAssure ensures seamless coordination between your project and factory production, maintaining the highest quality standards throughout the manufacturing process.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-orange-700 mb-2">Factory Partnership</h4>
                        <p className="text-sm text-gray-700">Select and coordinate with certified modular factory partners</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-red-700 mb-2">Quality Control</h4>
                        <p className="text-sm text-gray-700">Implement comprehensive quality assurance protocols and inspections</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-blue-700 mb-2">Logistics Planning</h4>
                        <p className="text-sm text-gray-700">Coordinate transportation and delivery schedules to site</p>
                      </div>
                    </div>
                  </div>

                  {/* Task Progress */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-raap-dark text-lg">Production Checklist</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.factorySchedulingComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Factory Scheduling</h5>
                            <p className="text-sm text-gray-600">Coordinate production timeline with factory capacity</p>
                          </div>
                        </div>
                        <Badge variant={project.factorySchedulingComplete ? "default" : "secondary"}>
                          {project.factorySchedulingComplete ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.qualityAssurancePlan ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Quality Assurance Plan</h5>
                            <p className="text-sm text-gray-600">Develop comprehensive QA protocols and checkpoints</p>
                          </div>
                        </div>
                        <Badge variant={project.qualityAssurancePlan ? "default" : "secondary"}>
                          {project.qualityAssurancePlan ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.factoryInspectionScheduled ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Factory Inspections</h5>
                            <p className="text-sm text-gray-600">Schedule regular quality inspections during production</p>
                          </div>
                        </div>
                        <Badge variant={project.factoryInspectionScheduled ? "default" : "secondary"}>
                          {project.factoryInspectionScheduled ? "Complete" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Factory Information */}
                  {project.factoryPartner && (
                    <div className="bg-white rounded-lg p-6 border">
                      <h4 className="font-semibold text-raap-dark mb-3">Factory Partner</h4>
                      <p className="text-gray-700">{project.factoryPartner}</p>
                      {project.fabricationStart && (
                        <p className="text-sm text-gray-600 mt-2">
                          Fabrication Start: {new Date(project.fabricationStart).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs with placeholder content */}
          <TabsContent value="factory">
            <Card>
              <CardHeader>
                <CardTitle>Factory Coordination</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Factory partner selection and production scheduling tools will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle>Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Quality control protocols and inspection management will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics">
            <Card>
              <CardHeader>
                <CardTitle>Logistics Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Transportation coordination and delivery scheduling will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Application Button */}
        {!project.fabAssureComplete && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Complete FabAssure Application</h3>
                  <p className="text-gray-600">
                    Once you've coordinated with the factory, established quality assurance protocols, and planned logistics, 
                    mark this application as complete to proceed to EasyDesign.
                  </p>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => markAsComplete.mutate()}
                  disabled={markAsComplete.isPending}
                  data-testid="button-complete-fabassure"
                >
                  {markAsComplete.isPending ? "Completing..." : "Complete FabAssure"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {project.fabAssureComplete && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">FabAssure Complete</h3>
                    <p className="text-green-700">
                      Your factory coordination and quality assurance process is complete. You can now proceed to EasyDesign.
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