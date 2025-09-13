import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Building, Users, Wrench, Clock, CheckCircle, AlertCircle, Upload, Download, ArrowLeft } from "lucide-react";
import type {
  Project,
  DesignDocument,
  MaterialSpecification,
  DoorScheduleItem,
  DesignWorkflow,
  EngineeringDetail
} from "@shared/schema";

function EasyDesign() {
  const [match, params] = useRoute("/projects/:id/easy-design");
  const [activeTab, setActiveTab] = useState("prototype");
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", params?.id],
    enabled: !!params?.id,
  });

  // Fetch design data
  const { data: designDocuments = [] } = useQuery<DesignDocument[]>({
    queryKey: ["/api/projects", params?.id, "design-documents"],
    enabled: !!params?.id,
  });

  const { data: materialSpecs = [] } = useQuery<MaterialSpecification[]>({
    queryKey: ["/api/projects", params?.id, "material-specifications"],
    enabled: !!params?.id,
  });

  const { data: doorSchedule = [] } = useQuery<DoorScheduleItem[]>({
    queryKey: ["/api/projects", params?.id, "door-schedule"],
    enabled: !!params?.id,
  });

  const { data: workflows = [] } = useQuery<DesignWorkflow[]>({
    queryKey: ["/api/projects", params?.id, "design-workflows"],
    enabled: !!params?.id,
  });

  const { data: engineeringDetails = [] } = useQuery<EngineeringDetail[]>({
    queryKey: ["/api/projects", params?.id, "engineering-details"],
    enabled: !!params?.id,
  });

  // Complete workflow mutation
  const markAsComplete = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/projects/${params?.id}`, {
        easyDesignComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", params?.id] });
      toast({
        title: "EasyDesign Complete",
        description: "Your design workflow is complete. All design components have been finalized.",
      });
      navigate(`/projects/${params?.id}/workflow`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete the workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (projectLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading EasyDesign...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-gray-600">The project you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        {/* Back to Workflow Link */}
        <div className="mb-4">
          <Link 
            href={`/projects/${params?.id}/workflow`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            data-testid="link-back-workflow"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflow
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          EasyDesign - {project.name}
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Detailed design prototypes and comprehensive workflow coordination
        </p>
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="outline" className="px-3 py-1">
            <Building className="h-4 w-4 mr-2" />
            {project.projectType} housing
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Users className="h-4 w-4 mr-2" />
            {(project.studioUnits || 0) + (project.oneBedUnits || 0) + (project.twoBedUnits || 0) + (project.threeBedUnits || 0)} units
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Design Phase
          </Badge>
        </div>
        
        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Design Progress Overview</CardTitle>
            <CardDescription>
              Track progress across all design components and stakeholder workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">80%</div>
                <div className="text-sm text-gray-600">Factory Permit Ready</div>
                <Progress value={80} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 mb-1">60%</div>
                <div className="text-sm text-gray-600">AHJ Permit Ready</div>
                <Progress value={60} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{workflows.length}</div>
                <div className="text-sm text-gray-600">Active Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{designDocuments.length}</div>
                <div className="text-sm text-gray-600">Design Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="prototype" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Design Prototype
          </TabsTrigger>
          <TabsTrigger value="aor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            AOR Workflows
          </TabsTrigger>
          <TabsTrigger value="fabricator" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Fabricator Workflows
          </TabsTrigger>
          <TabsTrigger value="gc-trades" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            GC/Trades Workflows
          </TabsTrigger>
        </TabsList>

        {/* Design Prototype Tab */}
        <TabsContent value="prototype" className="space-y-6">
          <DesignPrototypeSection 
            project={project}
            designDocuments={designDocuments}
            materialSpecs={materialSpecs}
            doorSchedule={doorSchedule}
            engineeringDetails={engineeringDetails}
          />
        </TabsContent>

        {/* AOR Workflows Tab */}
        <TabsContent value="aor" className="space-y-6">
          <AORWorkflowsSection 
            project={project}
            workflows={workflows.filter(w => w.workflowType === 'aor')}
          />
        </TabsContent>

        {/* Fabricator Workflows Tab */}
        <TabsContent value="fabricator" className="space-y-6">
          <FabricatorWorkflowsSection 
            project={project}
            workflows={workflows.filter(w => w.workflowType === 'fabricator')}
          />
        </TabsContent>

        {/* GC/Trades Workflows Tab */}
        <TabsContent value="gc-trades" className="space-y-6">
          <GCTradesWorkflowsSection 
            project={project}
            workflows={workflows.filter(w => w.workflowType === 'gc')}
          />
        </TabsContent>
      </Tabs>

      {/* Complete Workflow Button */}
      {!project.easyDesignComplete && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Complete EasyDesign Workflow</h3>
                <p className="text-gray-600">
                  Finalize all design components and mark this workflow as complete to proceed with your project.
                </p>
              </div>
              <Button
                onClick={() => markAsComplete.mutate()}
                disabled={markAsComplete.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-complete-workflow"
              >
                {markAsComplete.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Workflow
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Design Prototype Section Component
function DesignPrototypeSection({ 
  project, 
  designDocuments, 
  materialSpecs, 
  doorSchedule, 
  engineeringDetails 
}: {
  project: Project;
  designDocuments: DesignDocument[];
  materialSpecs: MaterialSpecification[];
  doorSchedule: DoorScheduleItem[];
  engineeringDetails: EngineeringDetail[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Room Designs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Room Designs & Layouts
          </CardTitle>
          <CardDescription>
            Detailed room configurations with optimized layouts for factory production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Studio Units</h4>
                <p className="text-2xl font-bold text-blue-600">{project.studioUnits || 0}</p>
                <p className="text-sm text-blue-600">450-500 sq ft layouts</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">1-Bedroom</h4>
                <p className="text-2xl font-bold text-green-600">{project.oneBedUnits || 0}</p>
                <p className="text-sm text-green-600">650-750 sq ft layouts</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800">2-Bedroom</h4>
                <p className="text-2xl font-bold text-amber-600">{project.twoBedUnits || 0}</p>
                <p className="text-sm text-amber-600">900-1100 sq ft layouts</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">3-Bedroom</h4>
                <p className="text-2xl font-bold text-purple-600">{project.threeBedUnits || 0}</p>
                <p className="text-sm text-purple-600">1200-1400 sq ft layouts</p>
              </div>
            </div>
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Room Design Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials & Finishes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Materials & Finishes
          </CardTitle>
          <CardDescription>
            Comprehensive material specifications for all room types and common areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {materialSpecs.length > 0 ? (
              <div className="space-y-3">
                {materialSpecs.slice(0, 3).map((spec, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{spec.roomType}</h4>
                        <p className="text-sm text-gray-600">{spec.materialCategory}</p>
                      </div>
                      <Badge variant="outline">Pending Review</Badge>
                    </div>
                    <p className="text-sm mt-1">{spec.specifications}</p>
                  </div>
                ))}
                {materialSpecs.length > 3 && (
                  <p className="text-sm text-gray-600 text-center">
                    +{materialSpecs.length - 3} more specifications
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No material specifications yet</p>
              </div>
            )}
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Manage Material Specifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Door & Hardware Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Door & Hardware Schedule
          </CardTitle>
          <CardDescription>
            Complete door schedule with hardware specifications and installation details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {doorSchedule.length > 0 ? (
              <div className="space-y-2">
                {doorSchedule.slice(0, 4).map((door, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">{door.doorNumber}</span>
                      <span className="text-sm text-gray-600 ml-2">{door.doorType}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {door.width}" x {door.height}"
                    </div>
                  </div>
                ))}
                {doorSchedule.length > 4 && (
                  <p className="text-sm text-gray-600 text-center">
                    +{doorSchedule.length - 4} more doors
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No door schedule items yet</p>
              </div>
            )}
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Edit Door Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MEP & Structural Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            MEP & Structural Details
          </CardTitle>
          <CardDescription>
            Engineering details for mechanical, electrical, plumbing, and structural systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engineeringDetails.length > 0 ? (
              <div className="space-y-3">
                {engineeringDetails.slice(0, 3).map((detail, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{detail.system}</h4>
                        <p className="text-sm text-gray-600">{detail.detailType}</p>
                      </div>
                      <Badge variant="secondary">
                        Review Required
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{detail.description}</p>
                  </div>
                ))}
                {engineeringDetails.length > 3 && (
                  <p className="text-sm text-gray-600 text-center">
                    +{engineeringDetails.length - 3} more details
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No engineering details yet</p>
              </div>
            )}
            <Button className="w-full" variant="outline">
              <Wrench className="h-4 w-4 mr-2" />
              Manage Engineering Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// AOR Workflows Section Component
function AORWorkflowsSection({ project, workflows }: { project: Project; workflows: DesignWorkflow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revit Libraries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Revit Libraries & BIM Models
          </CardTitle>
          <CardDescription>
            Standardized Revit families and BIM components for modular construction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-blue-800 mb-2">Wall Systems</h4>
                <p className="text-lg font-bold text-blue-600">12</p>
                <p className="text-xs text-blue-600">Revit families</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-green-800 mb-2">MEP Components</h4>
                <p className="text-lg font-bold text-green-600">28</p>
                <p className="text-xs text-green-600">Revit families</p>
              </div>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Revit Library Package
            </Button>
            <Button className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Custom Components
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Design Files & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Design Files & Documentation
          </CardTitle>
          <CardDescription>
            Architectural drawings, specifications, and project documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Architectural Plans.rvt</span>
                </div>
                <Badge variant="outline">Current</Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Design Specifications.pdf</span>
                </div>
                <Badge variant="secondary">v2.1</Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Module Connections.dwg</span>
                </div>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Design Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scope Clarification Workflows */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Scope Clarification & AOR Coordination
          </CardTitle>
          <CardDescription>
            Active workflows for scope clarification, design reviews, and AOR coordination tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.length > 0 ? (
              workflows.map((workflow, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{workflow.taskName}</h4>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.status === 'completed' ? 'default' : 
                                   workflow.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {workflow.status?.replace('_', ' ') || 'pending'}
                      </Badge>
                      <Badge variant={workflow.priority === 'high' ? 'destructive' : 
                                   workflow.priority === 'medium' ? 'default' : 'secondary'}>
                        {workflow.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Due: {workflow.dueDate ? new Date(workflow.dueDate).toLocaleDateString() : 'TBD'}
                    </span>
                    <span>Assigned to: {workflow.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No AOR Workflows Yet</h3>
                <p className="text-sm mb-4">Create workflows to coordinate with your Architect of Record</p>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Create AOR Workflow
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Fabricator Workflows Section Component
function FabricatorWorkflowsSection({ project, workflows }: { project: Project; workflows: DesignWorkflow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Shop Drawings Coordination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Shop Drawings Coordination
          </CardTitle>
          <CardDescription>
            Coordinate shop drawings development and approval with fabrication partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-amber-800 mb-2">In Progress</h4>
                <p className="text-2xl font-bold text-amber-600">3</p>
                <p className="text-xs text-amber-600">Shop drawing sets</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-green-800 mb-2">Approved</h4>
                <p className="text-2xl font-bold text-green-600">8</p>
                <p className="text-xs text-green-600">Shop drawing sets</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium">Bathroom Module - SD-001</span>
                <Badge variant="default">Approved</Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium">Kitchen Module - SD-002</span>
                <Badge variant="secondary">Under Review</Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium">MEP Connections - SD-003</span>
                <Badge variant="outline">Pending</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Schedules & Production */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Material Schedules & Production
          </CardTitle>
          <CardDescription>
            Material procurement schedules and production timeline coordination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Lumber & Framing</h4>
                  <Badge variant="default">Ordered</Badge>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery: Feb 15, 2024</span>
                  <span>Lead time: 2 weeks</span>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">MEP Components</h4>
                  <Badge variant="secondary">Sourcing</Badge>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Est. Delivery: Feb 28, 2024</span>
                  <span>Lead time: 4 weeks</span>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Finish Materials</h4>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Est. Delivery: Mar 10, 2024</span>
                  <span>Lead time: 6 weeks</span>
                </div>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Update Material Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Fabricator Workflows */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Active Fabricator Workflows
          </CardTitle>
          <CardDescription>
            Coordinate production schedules, quality control, and delivery logistics with fabricators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.length > 0 ? (
              workflows.map((workflow, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{workflow.taskName}</h4>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.status === 'completed' ? 'default' : 
                                   workflow.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {workflow.status?.replace('_', ' ') || 'pending'}
                      </Badge>
                      <Badge variant={workflow.priority === 'high' ? 'destructive' : 
                                   workflow.priority === 'medium' ? 'default' : 'secondary'}>
                        {workflow.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Due: {workflow.dueDate ? new Date(workflow.dueDate).toLocaleDateString() : 'TBD'}
                    </span>
                    <span>Assigned to: {workflow.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No Fabricator Workflows Yet</h3>
                <p className="text-sm mb-4">Create workflows to coordinate with your fabrication partners</p>
                <Button>
                  <Wrench className="h-4 w-4 mr-2" />
                  Create Fabricator Workflow
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// GC/Trades Workflows Section Component
function GCTradesWorkflowsSection({ project, workflows }: { project: Project; workflows: DesignWorkflow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trade-Specific File Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Trade-Specific File Packages
          </CardTitle>
          <CardDescription>
            Customized documentation packages for different trades and on-site requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Electrical Trade Package</h4>
                  <Badge variant="default">Ready</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">Module wiring diagrams, junction details, panel schedules</p>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Plumbing Trade Package</h4>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">Rough-in plans, fixture schedules, connection details</p>
                <Button size="sm" variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-1" />
                  Pending
                </Button>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">HVAC Trade Package</h4>
                  <Badge variant="default">Ready</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">Ductwork layouts, equipment specs, installation guides</p>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Sheets & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Product Sheets & Documentation
          </CardTitle>
          <CardDescription>
            Technical specifications, installation guides, and product documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Window Installation Guide.pdf</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">MEP Connection Specs.pdf</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Assembly Instructions.pdf</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Quality Control Checklist.pdf</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Additional Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GC/Trades Coordination Workflows */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            GC/Trades Coordination Workflows
          </CardTitle>
          <CardDescription>
            Coordinate on-site work requirements, sequencing, and quality control with general contractors and trades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.length > 0 ? (
              workflows.map((workflow, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{workflow.taskName}</h4>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.status === 'completed' ? 'default' : 
                                   workflow.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {workflow.status?.replace('_', ' ') || 'pending'}
                      </Badge>
                      <Badge variant={workflow.priority === 'high' ? 'destructive' : 
                                   workflow.priority === 'medium' ? 'default' : 'secondary'}>
                        {workflow.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Due: {workflow.dueDate ? new Date(workflow.dueDate).toLocaleDateString() : 'TBD'}
                    </span>
                    <span>Assigned to: {workflow.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No GC/Trades Workflows Yet</h3>
                <p className="text-sm mb-4">Create workflows to coordinate with general contractors and trades</p>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Create GC/Trades Workflow
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EasyDesign;