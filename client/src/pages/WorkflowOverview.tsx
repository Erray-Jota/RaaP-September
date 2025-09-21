import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Circle,
  MapPin,
  Building,
  Truck,
  Palette,
  FileText,
  Clock
} from "lucide-react";
import type { Project } from "@shared/schema";
// Removed isSampleProject import - using database field directly

interface ApplicationStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
  completedField: keyof Project;
  isAvailable: (project: Project) => boolean;
}

const applicationSteps: ApplicationStep[] = [
  {
    id: "modular-feasibility",
    name: "ModularFeasibility",
    description: "Assess project suitability for modular construction across 6 key criteria",
    icon: <Building className="h-6 w-6" />,
    color: "blue",
    route: "/projects/:id/modular-feasibility",
    completedField: "modularFeasibilityComplete",
    isAvailable: () => true, // Always available after project creation
  },
  {
    id: "smart-start",
    name: "SmartStart",
    description: "Navigate entitlements, permitting, and preliminary design development",
    icon: <FileText className="h-6 w-6" />,
    color: "green",
    route: "/projects/:id/smart-start",
    completedField: "smartStartComplete",
    isAvailable: (project) => Boolean(project.modularFeasibilityComplete),
  },
  {
    id: "fab-assure",
    name: "FabAssure",
    description: "Coordinate factory production, quality assurance, and logistics planning",
    icon: <Truck className="h-6 w-6" />,
    color: "orange",
    route: "/projects/:id/fab-assure",
    completedField: "fabAssureComplete",
    isAvailable: (project) => Boolean(project.smartStartComplete),
  },
  {
    id: "easy-design",
    name: "EasyDesign",
    description: "Finalize architectural plans, interior design, and material selections",
    icon: <Palette className="h-6 w-6" />,
    color: "purple",
    route: "/projects/:id/easy-design",
    completedField: "easyDesignComplete",
    isAvailable: (project) => Boolean(project.fabAssureComplete),
  },
];

export default function WorkflowOverview() {
  const [, params] = useRoute("/projects/:id/workflow");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
  const totalRooms = (project.queenUnits || 0) + (project.kingUnits || 0) + (project.oneBedUnits || 0);

  const getStepStatus = (step: ApplicationStep) => {
    // For sample projects, override FabAssure and EasyDesign status
    if (project.isSample) {
      if (step.id === "fab-assure" || step.id === "easy-design") {
        return "in_progress";
      }
    }
    
    if (project[step.completedField]) return "completed";
    if (step.isAvailable(project)) return "available";
    return "locked";
  };

  // Calculate overall progress with overridden status for sample projects
  const getActualCompletedSteps = () => {
    return applicationSteps.filter(step => {
      const status = getStepStatus(step);
      return status === "completed";
    }).length;
  };
  
  const completedSteps = getActualCompletedSteps();
  const progressPercentage = (completedSteps / applicationSteps.length) * 100;

  const getStepColorClasses = (step: ApplicationStep, status: string) => {
    if (status === "completed") {
      return {
        card: "border-green-200 bg-green-50 hover:bg-green-100",
        title: "text-green-800",
        icon: "text-green-600",
        button: "bg-green-600 hover:bg-green-700 text-white",
      };
    }
    if (status === "in_progress") {
      return {
        card: `border-yellow-200 bg-yellow-50 hover:bg-yellow-100`,
        title: `text-yellow-800`,
        icon: `text-yellow-600`,
        button: `bg-yellow-600 hover:bg-yellow-700 text-white`,
      };
    }
    if (status === "available") {
      return {
        card: `border-${step.color}-200 bg-${step.color}-50 hover:bg-${step.color}-100`,
        title: `text-${step.color}-800`,
        icon: `text-${step.color}-600`,
        button: `bg-${step.color}-600 hover:bg-${step.color}-700 text-white`,
      };
    }
    return {
      card: "border-gray-200 bg-gray-50",
      title: "text-gray-500",
      icon: "text-gray-400",
      button: "bg-gray-300 text-gray-500 cursor-not-allowed",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-raap-green hover:text-green-700 mb-4 p-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-raap-dark mb-2">{project.name}</h1>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {project.address}
              </div>
              <p className="text-gray-600">
                {project.projectType === 'hotel' || project.projectType === 'hostel' ? 
                  `${project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)} (Commercial Hospitality) • ${totalRooms} Rooms • ${project.targetFloors} Stories` :
                  `${project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)} Housing • ${totalUnits} Units • ${project.targetFloors} Stories`
                }
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-raap-green">{completedSteps}/{applicationSteps.length}</div>
              <div className="text-sm text-gray-500 mb-2">Applications Complete</div>
              <div className="w-32">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Development Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Complete each application in sequence to progress through your modular construction project development. 
              Each application builds on the previous one, ensuring a systematic approach to bringing your project to completion.
            </p>
            
            {/* Progress Timeline */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
              {applicationSteps.map((step, index) => {
                const status = getStepStatus(step);
                const isCompleted = status === "completed";
                const nextStepCompleted = index < applicationSteps.length - 1 ? 
                  getStepStatus(applicationSteps[index + 1]) === "completed" : false;
                
                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                      isCompleted 
                        ? "bg-green-500 border-green-500 text-white" 
                        : status === "in_progress"
                        ? "bg-yellow-500 border-yellow-500 text-white"
                        : status === "available"
                        ? `bg-${step.color}-500 border-${step.color}-500 text-white`
                        : "bg-gray-200 border-gray-300 text-gray-400"
                    }`}>
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : step.icon}
                    </div>
                    <div className="text-xs font-medium mt-2 text-center max-w-16">
                      {step.name}
                    </div>
                    {index < applicationSteps.length - 1 && (
                      <div className={`absolute top-6 left-12 w-20 h-0.5 ${
                        isCompleted || nextStepCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Application Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {applicationSteps.map((step, index) => {
            const status = getStepStatus(step);
            const colors = getStepColorClasses(step, status);
            
            return (
              <Card key={step.id} className={`${colors.card} transition-colors duration-200`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`${colors.icon}`}>
                      {step.icon}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}
                      </span>
                      {status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {status === "locked" && (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <CardTitle className={`${colors.title} text-lg`}>
                    {step.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 min-h-[3rem]">
                    {step.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {status === "completed" && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Completed
                      </Badge>
                    )}
                    {status === "in_progress" && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        In Progress
                      </Badge>
                    )}
                    {status === "available" && (
                      <Badge variant="outline" className={`text-${step.color}-600 border-${step.color}-600`}>
                        Ready to Start
                      </Badge>
                    )}
                    {status === "locked" && (
                      <Badge variant="outline" className="text-gray-500 border-gray-400">
                        Locked
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    className={`w-full ${colors.button}`}
                    disabled={status === "locked"}
                    onClick={() => {
                      if (status !== "locked") {
                        const route = step.route.replace(":id", project.id);
                        navigate(route);
                      }
                    }}
                    data-testid={`button-${step.id}`}
                  >
                    {status === "completed" ? "Review" : status === "in_progress" ? "Continue" : status === "available" ? "Start" : "Locked"}
                    {status !== "locked" && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Next Steps */}
        {completedSteps < applicationSteps.length && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Next Step</h3>
                  <p className="text-gray-600">
                    {completedSteps === 0 
                      ? "Start with ModularFeasibility to assess your project's suitability for modular construction."
                      : `Complete ${applicationSteps.find(step => step.isAvailable(project) && !project[step.completedField])?.name} to continue your project development.`
                    }
                  </p>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => {
                    const nextStep = applicationSteps.find(step => step.isAvailable(project) && !project[step.completedField]);
                    if (nextStep) {
                      const route = nextStep.route.replace(":id", project.id);
                      navigate(route);
                    }
                  }}
                  data-testid="button-next-step"
                >
                  Continue Workflow
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