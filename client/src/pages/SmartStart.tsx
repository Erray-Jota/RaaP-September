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
  FileText,
  Building,
  CheckCircle,
  Circle,
  Calendar,
  Users,
  FileCheck,
  AlertCircle
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function SmartStart() {
  const [, params] = useRoute("/projects/:id/smart-start");
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
        smartStartComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "SmartStart Complete",
        description: "Your entitlement and permitting process is complete. You can now proceed to FabAssure.",
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

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  // Calculate progress based on completed tasks
  const completedTasks = [
    project.planningSdkSubmitted,
    project.preliminaryDesignComplete,
    project.permitApplicationSubmitted,
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
            <h1 className="text-3xl font-bold text-raap-dark mb-2">SmartStart Application</h1>
            <h2 className="text-xl text-gray-700 mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              Navigate entitlements, permitting, and preliminary design development
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{completedTasks}/{totalTasks}</div>
            <div className="text-sm text-gray-500 mb-2">Tasks Complete</div>
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
          <TabsList className="grid grid-cols-4 w-full mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="entitlements" className="flex items-center space-x-1">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Entitlements</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Design</span>
            </TabsTrigger>
            <TabsTrigger value="permits" className="flex items-center space-x-1">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Permits</span>
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
                    <h3 className="text-xl font-bold text-green-800 mb-2">Entitlement & Permitting Process</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      SmartStart guides you through the complex entitlement and permitting process, ensuring your modular project meets all regulatory requirements and gets approved efficiently.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-blue-700 mb-2">Entitlement Strategy</h4>
                        <p className="text-sm text-gray-700">Develop comprehensive approach to zoning approvals and density bonuses</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-green-700 mb-2">Design Development</h4>
                        <p className="text-sm text-gray-700">Create preliminary designs that align with modular construction requirements</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-semibold text-purple-700 mb-2">Permit Applications</h4>
                        <p className="text-sm text-gray-700">Submit and track building permits through approval process</p>
                      </div>
                    </div>
                  </div>

                  {/* Task Progress */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-raap-dark text-lg">Process Checklist</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.planningSdkSubmitted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Planning SDK Submission</h5>
                            <p className="text-sm text-gray-600">Submit initial planning documents and feasibility analysis</p>
                          </div>
                        </div>
                        <Badge variant={project.planningSdkSubmitted ? "default" : "secondary"}>
                          {project.planningSdkSubmitted ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.preliminaryDesignComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Preliminary Design</h5>
                            <p className="text-sm text-gray-600">Develop detailed architectural plans for modular units</p>
                          </div>
                        </div>
                        <Badge variant={project.preliminaryDesignComplete ? "default" : "secondary"}>
                          {project.preliminaryDesignComplete ? "Complete" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {project.permitApplicationSubmitted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h5 className="font-medium">Permit Application</h5>
                            <p className="text-sm text-gray-600">Submit building permits and coordinate approvals</p>
                          </div>
                        </div>
                        <Badge variant={project.permitApplicationSubmitted ? "default" : "secondary"}>
                          {project.permitApplicationSubmitted ? "Complete" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs with placeholder content */}
          <TabsContent value="entitlements">
            <Card>
              <CardHeader>
                <CardTitle>Entitlement Process</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed entitlement workflow and documentation will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design">
            <Card>
              <CardHeader>
                <CardTitle>Preliminary Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Design development tools and collaboration features will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permits">
            <Card>
              <CardHeader>
                <CardTitle>Permit Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Permit tracking and submission tools will be implemented here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Application Button */}
        {!project.smartStartComplete && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Complete SmartStart Application</h3>
                  <p className="text-gray-600">
                    Once you've completed the entitlement process, preliminary design, and permit submissions, 
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
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {project.smartStartComplete && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">SmartStart Complete</h3>
                    <p className="text-green-700">
                      Your entitlement and permitting process is complete. You can now proceed to FabAssure.
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