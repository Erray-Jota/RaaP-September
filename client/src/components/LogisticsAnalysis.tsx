import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, AlertTriangle, CheckCircle, Route, Factory } from "lucide-react";
import type { Project } from "@shared/schema";

interface LogisticsAnalysisProps {
  project: Project;
}

export default function LogisticsAnalysis({ project }: LogisticsAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-raap-dark">Logistics Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">Transportation & Access</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Factory className="h-5 w-5 text-raap-green mt-1" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Factory Location</div>
                  <div className="text-sm text-gray-600">{project.factoryLocation || "Tracy, CA"}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Route className="h-5 w-5 text-raap-green mt-1" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Highway Access</div>
                  <div className="text-sm text-gray-600">
                    {project.address.includes("Olivehurst") 
                      ? "Within 1/2 mile of Highway 70, Exit 18A" 
                      : "Highway access analysis required"
                    }
                  </div>
                </div>
              </div>
              
              {project.transportationNotes && (
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-raap-mustard mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Transportation Notes</div>
                    <div className="text-sm text-gray-600">{project.transportationNotes}</div>
                  </div>
                </div>
              )}
              
              {project.address.includes("Olivehurst") && (
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-raap-mustard mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Site Considerations</div>
                    <div className="text-sm text-gray-600">
                      Overhead powerline on Chestnut Rd may require crane logistics coordination
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">Delivery Route</h4>
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
              alt={`Highway route from ${project.factoryLocation || "Tracy CA"} to project site`} 
              className="w-full h-48 rounded-lg object-cover mb-4"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-700">Staging</div>
                <div className="text-xs text-gray-600">
                  {project.stagingNotes || "Large open site available"}
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-700">Delivery</div>
                <div className="text-xs text-gray-600">No major access restrictions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline comparison */}
        <div className="mt-8">
          <h4 className="font-semibold text-raap-dark mb-4">Build Timeline Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-700 mb-2">Modular Construction</h5>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {project.modularTimelineMonths || 9} months
              </div>
              <div className="text-sm text-gray-600">
                Parallel design + fabrication + site construction
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">Site-Built Construction</h5>
              <div className="text-2xl font-bold text-gray-600 mb-1">
                {project.siteBuiltTimelineMonths || 13} months
              </div>
              <div className="text-sm text-gray-600">
                Sequential design + construction process
              </div>
            </div>
          </div>
          
          {project.timeSavingsMonths && project.timeSavingsMonths > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-600">
                {project.timeSavingsMonths} Month Time Savings
              </div>
              <div className="text-sm text-gray-600">
                Faster project delivery with modular construction
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
