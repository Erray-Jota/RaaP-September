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

  const modularTotal = parseFloat(project.modularTotalCost || "0");
  const siteBuiltTotal = parseFloat(project.siteBuiltTotalCost || "0");
  const savings = siteBuiltTotal - modularTotal;

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
                {formatCurrency(project.modularTotalCost)}
              </div>
              <div className="text-sm text-gray-600">
                {project.modularCostPerSf ? `${formatCurrency(project.modularCostPerSf)}/sf` : ""} • 
                {project.modularCostPerUnit ? ` ${formatCurrency(project.modularCostPerUnit)}/unit` : ""}
              </div>
              {project.costSavingsPercent && parseFloat(project.costSavingsPercent) > 0 && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  {project.costSavingsPercent}% savings over site-built
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-raap-dark mb-4">Traditional Site-Built</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-gray-700">
                {formatCurrency(project.siteBuiltTotalCost)}
              </div>
              <div className="text-sm text-gray-600">
                {project.siteBuiltCostPerSf ? `${formatCurrency(project.siteBuiltCostPerSf)}/sf` : ""} • 
                {project.siteBuiltCostPerUnit ? ` ${formatCurrency(project.siteBuiltCostPerUnit)}/unit` : ""}
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
                {project.costSavingsPercent}% cost reduction with modular construction
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
