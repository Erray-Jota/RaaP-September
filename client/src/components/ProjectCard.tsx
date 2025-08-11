import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronRight } from "lucide-react";
import type { Project } from "@shared/schema";
import serenityBuildingImage from "@assets/generated_images/3-story_modern_residential_building_6e9e1cd1.png";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [, navigate] = useLocation();

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 4) return "text-raap-green";
    if (numScore >= 3) return "text-raap-mustard";
    return "text-red-600";
  };

  const getProjectTypeImage = (projectType: string) => {
    // Use specific image for Serenity Village project
    if (project.name === "Serenity Village") {
      return serenityBuildingImage;
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

  return (
    <CardContent className="p-6">
      <div 
        className="cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
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
            
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </div>
    </CardContent>
  );
}
