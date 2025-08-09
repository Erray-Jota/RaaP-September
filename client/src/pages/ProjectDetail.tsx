import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import ScoreCard from "@/components/ScoreCard";
import CostAnalysis from "@/components/CostAnalysis";
import ZoningAnalysis from "@/components/ZoningAnalysis";
import LogisticsAnalysis from "@/components/LogisticsAnalysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, MapPin } from "lucide-react";
import { generateProjectPDF } from "@/lib/pdfGenerator";
import type { Project, CostBreakdown } from "@shared/schema";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
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

  const { data: costBreakdowns } = useQuery<CostBreakdown[]>({
    queryKey: ["/api/projects", projectId, "cost-breakdowns"],
    enabled: !!projectId,
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

  const handleDownloadReport = () => {
    if (project) {
      generateProjectPDF(project, costBreakdowns || []);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 4) return "text-raap-green";
    if (numScore >= 3) return "text-raap-mustard";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-raap-green hover:text-green-700 mb-4 p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h2 className="text-3xl font-bold text-raap-dark mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)} Housing • {totalUnits} Units • {project.targetFloors} Stories
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(project.overallScore || "0")}`}>
              {project.overallScore || "0.0"}
            </div>
            <div className="text-sm text-gray-500 mb-4">Overall Score</div>
            <Button 
              onClick={handleDownloadReport}
              className="bg-raap-green hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Project Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-raap-dark">Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                  alt={`${project.name} development site`} 
                  className="w-full h-48 rounded-lg object-cover mb-4"
                />
                
                <div className="bg-raap-green/10 border border-raap-green rounded-lg p-4">
                  <h4 className="font-semibold text-raap-green mb-2">Project Specifications</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Total Units: {totalUnits}</li>
                    {project.studioUnits > 0 && <li>• Studio: {project.studioUnits} units</li>}
                    {project.oneBedUnits > 0 && <li>• 1 Bedroom: {project.oneBedUnits} units</li>}
                    {project.twoBedUnits > 0 && <li>• 2 Bedroom: {project.twoBedUnits} units</li>}
                    {project.threeBedUnits > 0 && <li>• 3 Bedroom: {project.threeBedUnits} units</li>}
                    <li>• Floors: {project.targetFloors}</li>
                    {project.buildingDimensions && <li>• Dimensions: {project.buildingDimensions}</li>}
                    {project.constructionType && <li>• Construction Type: {project.constructionType}</li>}
                    <li>• Parking Spaces: {project.targetParkingSpaces}</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>{parseFloat(project.overallScore || "0") >= 3.5 ? "Good fit" : "Moderate fit"} for modular construction</strong> with a {parseFloat(project.overallScore || "0") >= 4 ? "high" : "moderate"} Modular Feasibility score of {project.overallScore || "0.0"}/5.0 based on the six criteria assessment.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${project.modularTotalCost ? (parseFloat(project.modularTotalCost) / 1000000).toFixed(1) : "0.0"}M
                    </div>
                    <div className="text-xs text-gray-500">Modular Cost</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {project.modularTimelineMonths || 0} mo
                    </div>
                    <div className="text-xs text-gray-500">Build Time</div>
                  </div>
                </div>

                {(project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0) && (
                  <div className="mt-4 text-center p-3 bg-green-100 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {project.costSavingsPercent}% Cost Savings
                    </div>
                    <div className="text-xs text-gray-600">vs. Site-Built Construction</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <ScoreCard
            title="Zoning"
            score={project.zoningScore || "0"}
            weight="20%"
            justification={project.zoningJustification || ""}
            details={[
              `• ${project.zoningDistrict || "Unknown"} District`,
              project.densityBonusEligible ? "• Density Bonus Eligible" : "• Standard Density",
              "• Zoning Compliance Review"
            ]}
          />

          <ScoreCard
            title="Massing"
            score={project.massingScore || "0"}
            weight="15%"
            justification={project.massingJustification || ""}
            details={[
              project.buildingDimensions ? `• ${project.buildingDimensions} Building` : `• ${totalUnits} Total Units`,
              project.constructionType ? `• ${project.constructionType} Construction` : `• ${project.targetFloors} Stories`,
              "• Mixed Unit Types"
            ]}
          />

          <ScoreCard
            title="Cost"
            score={project.costScore || "0"}
            weight="20%"
            justification={project.costJustification || ""}
            details={[
              project.costSavingsPercent ? `• ${project.costSavingsPercent}% Cost Savings` : "• Cost Analysis Complete",
              "• Prevailing Wage Rates",
              "• Soft Cost Reductions"
            ]}
          />

          <ScoreCard
            title="Sustainability"
            score={project.sustainabilityScore || "0"}
            weight="20%"
            justification={project.sustainabilityJustification || ""}
            details={[
              "• Net Zero Energy Ready",
              "• PHIUS Certification",
              "• Reduced Waste"
            ]}
          />

          <ScoreCard
            title="Logistics"
            score={project.logisticsScore || "0"}
            weight="15%"
            justification={project.logisticsJustification || ""}
            details={[
              "• Highway Access",
              `• ${project.factoryLocation || "Factory"} Location`,
              "• Staging Space Available"
            ]}
          />

          <ScoreCard
            title="Build Time"
            score={project.buildTimeScore || "0"}
            weight="10%"
            justification={project.buildTimeJustification || ""}
            details={[
              project.timeSavingsMonths ? `• ${project.timeSavingsMonths} Month Time Savings` : "• Time Savings Analysis",
              "• Parallel Construction",
              "• Weather Independent"
            ]}
          />
        </div>

        {/* Detailed Analysis Sections */}
        <div className="space-y-8">
          <CostAnalysis project={project} costBreakdowns={costBreakdowns || []} />
          <ZoningAnalysis project={project} />
          <LogisticsAnalysis project={project} />
        </div>
      </main>
    </div>
  );
}
