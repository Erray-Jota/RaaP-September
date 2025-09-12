import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import ZoningChat from "@/components/ZoningChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info,
  MessageCircle
} from "lucide-react";
import type { ZoningAnalysis } from "@shared/schema";

export default function ZoningAnalysisPage() {
  const [activeTab, setActiveTab] = useState("zoning");
  const [currentAddress, setCurrentAddress] = useState("");
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const { data: analysis, isLoading } = useQuery<ZoningAnalysis>({
    queryKey: ["/api/zoning/analysis", analysisId],
    enabled: !!analysisId,
  });

  const handleAddressSubmit = (address: string) => {
    setCurrentAddress(address);
    // The analysis ID will be returned from the mutation in ZoningChat
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "zoning":
        return (
          <div className="fade-in">
            <ZoningChat 
              analysisId={analysisId}
              address={currentAddress}
              onAddressSubmit={handleAddressSubmit}
            />
            
            {analysis && (
              <div className="px-4 py-6">
                <div className="space-y-4">
                  {/* Zoning Score Card */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Zoning Assessment</h3>
                        <div className="text-2xl font-bold text-green-600">
                          {analysis.score ? `${analysis.score}/5` : "N/A"}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-800 mb-2">
                          <strong>Score of {analysis.score}/5:</strong> {
                            analysis.score && analysis.score >= 4 
                              ? "Excellent zoning compatibility for modular construction."
                              : analysis.score && analysis.score >= 3
                              ? "Good zoning compatibility with minor considerations."
                              : "Review required for zoning compatibility."
                          }
                        </p>
                        <p className="text-xs text-green-700">Weight: 20% of overall feasibility score</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zoning Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Zoning Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm font-medium mb-1">Zone Classification</div>
                          <div className="text-lg font-semibold text-primary">
                            {analysis.zoneClassification || "N/A"}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm font-medium mb-1">Max Height</div>
                          <div className="text-lg font-semibold">
                            {analysis.maxHeight || "N/A"}
                          </div>
                        </div>
                      </div>

                      {analysis.setbacks && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Setback Requirements</h4>
                          <div className="space-y-2">
                            {analysis.setbacks.front && (
                              <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                                <span className="text-sm">Front Setback</span>
                                <span className="text-sm font-medium">{analysis.setbacks.front}</span>
                              </div>
                            )}
                            {analysis.setbacks.side && (
                              <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                                <span className="text-sm">Side Setback</span>
                                <span className="text-sm font-medium">{analysis.setbacks.side}</span>
                              </div>
                            )}
                            {analysis.setbacks.rear && (
                              <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                                <span className="text-sm">Rear Yard</span>
                                <span className="text-sm font-medium">{analysis.setbacks.rear}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Regulatory Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Permit Approval Risk</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              LOW
                            </Badge>
                            <Progress value={25} className="w-16 h-2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Variance Required</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              MEDIUM
                            </Badge>
                            <Progress value={50} className="w-16 h-2" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Timeline Impact</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              LOW
                            </Badge>
                            <Progress value={30} className="w-16 h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Pre-application Meeting</p>
                            <p className="text-xs text-muted-foreground">
                              Schedule with planning department to discuss modular approach
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Setback Variance Application</p>
                            <p className="text-xs text-muted-foreground">
                              May be needed for side setback requirements
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Standard Permit Process</p>
                            <p className="text-xs text-muted-foreground">
                              Project qualifies for streamlined review
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        );

      case "summary":
        return (
          <div className="px-4 py-6 fade-in">
            <div className="text-center">
              <div className="text-4xl text-muted-foreground mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">Project Summary</h3>
              <p className="text-muted-foreground">Summary content will be displayed here</p>
            </div>
          </div>
        );

      case "massing":
        return (
          <div className="px-4 py-6 fade-in">
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Massing Assessment</h3>
                  <div className="text-2xl font-bold text-green-600">5/5</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Score of 5/5:</strong> No additional constraints caused by modular structure. 
                    We can achieve the goal of 24 units and unit mix as the traditional original design.
                  </p>
                  <p className="text-xs text-green-700">Weight: 15% of overall feasibility score</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unit Mix Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">6</div>
                    <div className="text-sm font-medium">1-Bedroom Units</div>
                    <div className="text-xs text-muted-foreground">563 SF Average</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm font-medium">2-Bedroom Units</div>
                    <div className="text-xs text-muted-foreground">813 SF Average</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">6</div>
                    <div className="text-sm font-medium">3-Bedroom Units</div>
                    <div className="text-xs text-muted-foreground">980 SF Average</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "pricing":
        return (
          <div className="px-4 py-6 fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Breakdown Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                    <span className="text-sm">Site Built Total</span>
                    <span className="text-sm font-medium">$5,985,385</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-md">
                    <span className="text-sm">RaaP Total</span>
                    <span className="text-sm font-medium text-green-700">$5,295,001</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-green-100 rounded-md">
                    <span className="text-sm font-semibold">Total Savings</span>
                    <span className="text-sm font-bold text-green-700">$690,384</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="px-4 py-6 fade-in">
            <div className="text-center">
              <div className="text-4xl text-muted-foreground mb-4">🚧</div>
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="pb-20">
        {renderTabContent()}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg"
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          data-testid="button-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
