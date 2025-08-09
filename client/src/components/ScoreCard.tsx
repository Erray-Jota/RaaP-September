import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ScoreCardProps {
  title: string;
  score: string;
  weight: string;
  justification: string;
  details: string[];
}

export default function ScoreCard({ title, score, weight, justification, details }: ScoreCardProps) {
  const getScoreColor = (scoreValue: string) => {
    const numScore = parseFloat(scoreValue);
    if (numScore >= 4) return "text-raap-green";
    if (numScore >= 3) return "text-raap-mustard";
    return "text-red-600";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-raap-dark">{title}</h4>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {parseFloat(score).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">{weight} Weight</div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          {justification}
        </p>
        
        <div className="space-y-1">
          {details.map((detail, index) => (
            <div key={index} className="text-xs text-gray-500">
              {detail}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
