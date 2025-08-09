import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Project } from "@shared/schema";

interface ZoningAnalysisProps {
  project: Project;
}

export default function ZoningAnalysis({ project }: ZoningAnalysisProps) {
  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-raap-dark">Zoning & Site Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">
              Zoning District: {project.zoningDistrict || "RM"} (Residential Medium Density)
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Allowed Use</div>
                  <div className="text-sm text-gray-600">Multi-unit Development Permitted</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Density</div>
                  <div className="text-sm text-gray-600">
                    {project.densityBonusEligible 
                      ? "34 DU/Acre Max (with AB 1287 density bonus)" 
                      : "17 DU/Acre Max (base density)"
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Height</div>
                  <div className="text-sm text-gray-600">35' max Building Height</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Setbacks</div>
                  <div className="text-sm text-gray-600">15' Front, 5' Side, 10' Rear</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">Analysis Results</h4>
            <div className="space-y-3">
              {project.densityBonusEligible && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Density Bonus Eligible
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Qualifies for AB 1287 affordability bonus
                  </div>
                </div>
              )}
              
              <div className="bg-raap-mustard/10 border border-raap-mustard rounded p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-raap-mustard" />
                  <div className="text-sm font-medium text-raap-mustard">Required Concessions</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Open space and parking requirement reductions may be needed
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm font-medium text-blue-700">Project Compatibility</div>
                <div className="text-xs text-gray-600 mt-1">
                  {totalUnits} units planned for {project.targetFloors}-story development
                </div>
              </div>
            </div>

            {project.requiredWaivers && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Required Waivers</h5>
                <div className="text-sm text-gray-600">
                  {project.requiredWaivers}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Site visualization placeholder */}
        <div className="mt-8">
          <h4 className="font-semibold text-raap-dark mb-4">Site Context</h4>
          <img 
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
            alt="Site plan and zoning context" 
            className="w-full h-64 rounded-lg object-cover border border-gray-200"
          />
        </div>
      </CardContent>
    </Card>
  );
}
