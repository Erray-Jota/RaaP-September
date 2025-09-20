import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Project, CostBreakdown } from "@shared/schema";

interface CostAnalysisProps {
  project: Project;
  costBreakdowns: CostBreakdown[];
}

export default function CostAnalysis({ project, costBreakdowns }: CostAnalysisProps) {
  const formatCurrency = (amount: string | null) => {
    if (!amount) return "$0";
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // SINGLE SOURCE OF TRUTH: Calculate totals from MasterFormat breakdown data
  const siteBuiltTotal = costBreakdowns.reduce((sum, breakdown) => {
    return sum + parseFloat(breakdown.siteBuiltCost || "0");
  }, 0);
  
  const modularTotal = costBreakdowns.reduce((sum, breakdown) => {
    return sum + parseFloat(breakdown.raapTotalCost || "0");
  }, 0);
  
  const savings = siteBuiltTotal - modularTotal;

  // Calculate per-unit and per-sf from actual breakdown totals
  const totalUnits = (project.studioUnits || 0) + (project.oneBedUnits || 0) + 
                    (project.twoBedUnits || 0) + (project.threeBedUnits || 0);
  
  // Calculate total square footage from project data
  const getProjectTotalSqFt = (): number => {
    if (project.buildingDimensions) {
      const match = project.buildingDimensions.match(/(\d+)'?\s*[xX×]\s*(\d+)'/);
      if (match) {
        return parseInt(match[1]) * parseInt(match[2]);
      }
    }
    return totalUnits > 0 ? totalUnits * 720 : 17360; // fallback
  };
  
  const totalSqFt = getProjectTotalSqFt();
  const modularCostPerSf = totalSqFt > 0 ? modularTotal / totalSqFt : 0;
  const siteBuiltCostPerSf = totalSqFt > 0 ? siteBuiltTotal / totalSqFt : 0;
  const modularCostPerUnit = totalUnits > 0 ? modularTotal / totalUnits : 0;
  const siteBuiltCostPerUnit = totalUnits > 0 ? siteBuiltTotal / totalUnits : 0;
  const costSavingsPercent = siteBuiltTotal > 0 ? ((savings / siteBuiltTotal) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-raap-dark">Cost Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">RaaP Modular Construction</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(modularTotal.toString())}
              </div>
              <div className="text-sm text-gray-600">
                ${Math.round(modularCostPerSf)}/sf • 
                ${Math.round(modularCostPerUnit).toLocaleString()}/unit
              </div>
              {costSavingsPercent > 0 && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  {costSavingsPercent.toFixed(1)}% savings over site-built
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">Traditional Site-Built</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-gray-700">
                {formatCurrency(siteBuiltTotal.toString())}
              </div>
              <div className="text-sm text-gray-600">
                ${Math.round(siteBuiltCostPerSf)}/sf • 
                ${Math.round(siteBuiltCostPerUnit).toLocaleString()}/unit
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {project.siteBuiltTimelineMonths || 13} month timeline
              </div>
            </div>
          </div>
        </div>

        {costBreakdowns.length > 0 && (
          <>
            <h4 className="font-semibold text-raap-dark mb-4">MasterFormat Cost Breakdown</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MasterFormat Category</TableHead>
                    <TableHead className="text-right">Site Built</TableHead>
                    <TableHead className="text-right">RaaP GC</TableHead>
                    <TableHead className="text-right">RaaP Fab</TableHead>
                    <TableHead className="text-right">RaaP Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costBreakdowns.map((breakdown) => (
                    <TableRow key={breakdown.id}>
                      <TableCell className="font-medium">{breakdown.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(breakdown.siteBuiltCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(breakdown.raapGcCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(breakdown.raapFabCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(breakdown.raapTotalCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {savings > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(savings.toString())} Total Savings
              </div>
              <div className="text-sm text-gray-600">
                {costSavingsPercent.toFixed(1)}% cost reduction with modular construction
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
