import React from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";

export const StatisticsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Badge variant="teal">Phase 7 Target</Badge>
        <span className="text-xs text-slate-400">Recharts 2 integration & database aggregations</span>
      </div>

      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-sage-500/10 text-sage-400 flex items-center justify-center mx-auto mb-4 border border-sage-500/20">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Statistics & Analytics Engine</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          Productivity completions, monthly trends, movie/series hours, genre distributions, and average ratings calculated directly from actual SQLite database records.
        </p>
      </Card>
    </div>
  );
};
