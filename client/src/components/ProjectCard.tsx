import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, ChevronRight, Trash2, Building, FileText, Truck, Palette } from "lucide-react";
import type { Project } from "@shared/schema";
// Removed calculateProjectScores import - using database values directly
import serenityBuildingImage from "@assets/generated_images/Modern_multifamily_building_rendering_3456504f.png";
import workforceBuildingImage from "@assets/Building 2_1754894840186.jpg";
import universityBuildingImage from "@assets/Building 4_1754895114379.jpg";
import mountainViewBuildingImage from "@assets/Building 3_1754895186512.jpg";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Format large numbers as $xM for mobile display
  const formatCostForMobile = (cost: string | null): string => {
    if (!cost) return "N/A";
    const numericValue = parseFloat(cost);
    if (numericValue >= 1000000) {
      return `$${(numericValue / 1000000).toFixed(1)}M`;
    }
    if (numericValue >= 1000) {
      return `$${(numericValue / 1000).toFixed(0)}K`;
    }
    return `$${numericValue.toFixed(0)}`;
  };

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  // Use database score directly - single source of truth
  const displayScore = project.overallScore || "0.0";

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 4) return "text-raap-green";
    if (numScore >= 3) return "text-raap-mustard";
    return "text-red-600";
  };

  // Application steps with icons (matching WorkflowOverview)
  const applicationSteps = [
    {
      id: "modular-feasibility",
      name: "ModularFeasibility",
      icon: Building,
      completedField: "modularFeasibilityComplete" as keyof Project,
      color: "blue",
    },
    {
      id: "smart-start", 
      name: "SmartStart",
      icon: FileText,
      completedField: "smartStartComplete" as keyof Project,
      color: "green",
    },
    {
      id: "fab-assure",
      name: "FabAssure", 
      icon: Truck,
      completedField: "fabAssureComplete" as keyof Project,
      color: "orange",
    },
    {
      id: "easy-design",
      name: "EasyDesign",
      icon: Palette,
      completedField: "easyDesignComplete" as keyof Project,
      color: "purple",
    },
  ];

  // Get application status (simplified tri-state: completed, in_progress, not_started)
  const getApplicationStatus = (step: typeof applicationSteps[0]) => {
    // For sample projects, override FabAssure and EasyDesign status
    if (project.isSample) {
      if (step.id === "fab-assure" || step.id === "easy-design") {
        return "in_progress";
      }
    }
    
    // Check if completed
    if (project[step.completedField]) return "completed";
    
    // Everything else is not started (red)
    return "not_started";
  };

  // Get icon color based on status (tri-state as requested)
  const getIconColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";    // Green for complete
      case "in_progress": return "text-yellow-600";  // Yellow for in progress
      default: return "text-red-600";                // Red for not started
    }
  };

  const getProjectTypeImage = (projectType: string) => {
    // Use specific images for certain projects
    if (project.name === "Serenity Village") {
      return serenityBuildingImage;
    }
    if (project.name === "Workforce Commons") {
      return workforceBuildingImage;
    }
    if (project.name === "University Housing Complex") {
      return universityBuildingImage;
    }
    if (project.name === "Mountain View Apartments") {
      return mountainViewBuildingImage;
    }
    
    const images = {
      affordable: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=120",
      senior: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=120",
      student: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=120",
      workforce: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=120",
      hostel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=120",
      hotel: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=120",
    };
    return images[projectType as keyof typeof images] || images.affordable;
  };

  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${project.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Deleted",
        description: `${project.name} has been successfully deleted.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <CardContent className="p-6">
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div 
          className="flex items-center space-x-3 sm:space-x-4 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors flex-1"
          onClick={() => navigate(`/projects/${project.id}/workflow`)}
        >
          <img 
            src={getProjectTypeImage(project.projectType)} 
            alt={`${project.name} project`} 
            className="w-16 h-10 sm:w-20 sm:h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-base sm:text-lg font-semibold text-raap-dark truncate">{project.name}</h4>
            <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{project.address}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
              </Badge>
              <span className="text-xs text-gray-500">
                {totalUnits} Units • {project.targetFloors} Stories
              </span>
            </div>
            
            {/* Application Status Icons */}
            <div className="flex items-center space-x-3" data-testid={`app-status-${project.id}`}>
              {applicationSteps.map((step) => {
                const status = getApplicationStatus(step);
                const IconComponent = step.icon;
                return (
                  <div 
                    key={step.id} 
                    className="flex items-center" 
                    title={`${step.name}: ${status.replace('_', ' ')}`}
                  >
                    <IconComponent 
                      className={`h-4 w-4 ${getIconColor(status)}`} 
                      data-testid={`icon-${step.id}-${project.id}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
          <div className="text-center">
            <div className={`text-lg sm:text-2xl font-bold ${getScoreColor(displayScore)}`} data-testid={`score-${project.id}`}>
              <span className="sm:hidden">{Math.round(parseFloat(displayScore))}</span>
              <span className="hidden sm:inline">{displayScore}</span>
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
          
          <div className="text-center">
            {project.modularTotalCost ? (
              <>
                <div className="text-sm sm:text-lg font-semibold text-raap-green">
                  <span className="sm:hidden">{formatCostForMobile(project.modularTotalCost)}</span>
                  <span className="hidden sm:inline">${parseFloat(project.modularTotalCost).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500">RaaP Cost</div>
                {project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0 && (
                  <div className="text-xs text-green-600">
                    ({Math.round(parseFloat(project.costSavingsPercent))}% savings)
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-sm sm:text-lg font-semibold text-gray-400">
                  N/A
                </div>
                <div className="text-xs text-gray-500">RaaP Cost</div>
              </>
            )}
          </div>
          
          <div className="text-center">
            {project.modularTimelineMonths ? (
              <>
                <div className="text-sm sm:text-lg font-semibold text-blue-600">
                  {Math.round(parseFloat(project.modularTimelineMonths))} mo
                </div>
                <div className="text-xs text-gray-500">Build Time</div>
                {project.siteBuiltTimelineMonths && (
                  <div className="text-xs text-blue-600">
                    ({Math.round(parseFloat(project.siteBuiltTimelineMonths) - parseFloat(project.modularTimelineMonths))} mo savings)
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-sm sm:text-lg font-semibold text-gray-400">
                  N/A
                </div>
                <div className="text-xs text-gray-500">Build Time</div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  data-testid={`button-delete-${project.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{project.name}"? This action cannot be undone and will permanently remove all project data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteProject.mutate()}
                    disabled={deleteProject.isPending}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid={`button-confirm-delete-${project.id}`}
                  >
                    {deleteProject.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/workflow`)}
              data-testid={`button-view-${project.id}`}
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  );
}
