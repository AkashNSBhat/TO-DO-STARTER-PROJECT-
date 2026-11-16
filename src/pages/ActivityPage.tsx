import React from "react";
import { History } from "lucide-react";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";

export const ActivityPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Badge variant="teal">Phase 7 Target</Badge>
        <span className="text-xs text-slate-400">Database table: <code>activity_history</code> ready</span>
      </div>

      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-sage-500/10 text-sage-400 flex items-center justify-center mx-auto mb-4 border border-sage-500/20">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Chronological Activity History</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          The activity history ledger captures every completion event across tasks, movies, episodes, series, and plan objectives into a unified timestamped timeline.
        </p>
      </Card>
    </div>
  );
};
