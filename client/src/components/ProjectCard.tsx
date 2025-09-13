import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { MapPin, ChevronRight, Trash2 } from "lucide-react";
import type { Project } from "@shared/schema";
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

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 4) return "text-raap-green";
    if (numScore >= 3) return "text-raap-mustard";
    return "text-red-600";
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
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
              </Badge>
              <span className="text-xs text-gray-500">
                {totalUnits} Units • {project.targetFloors} Stories
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:space-x-4">
          <div className="text-center">
            <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(project.overallScore || "0")}`}>
              {project.overallScore || "0.0"}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
          
          {project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0 && (
            <div className="text-center">
              <div className="text-sm sm:text-lg font-semibold text-green-600">
                {project.costSavingsPercent}%
              </div>
              <div className="text-xs text-gray-500">Savings</div>
            </div>
          )}
          
          {project.timeSavingsMonths && (
            <div className="text-center">
              <div className="text-sm sm:text-lg font-semibold text-blue-600">
                {project.timeSavingsMonths} mo
              </div>
              <div className="text-xs text-gray-500">Time</div>
            </div>
          )}
          
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
