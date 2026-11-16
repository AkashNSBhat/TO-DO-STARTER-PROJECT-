import React from "react";
import { Tv, Plus } from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";

export const SeriesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Phase 4 Target</Badge>
          <span className="text-xs text-slate-400">Database tables: <code>series</code>, <code>seasons</code>, <code>episodes</code> ready</span>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Add Series
        </Button>
      </div>

      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-sage-500/10 text-sage-400 flex items-center justify-center mx-auto mb-4 border border-sage-500/20">
          <Tv className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Series & Episode Tracker</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          The hierarchical relational database tables for Series, Multi-season configurations, and Individual Episodes with timestamps are successfully migrated in SQLite.
        </p>
      </Card>
    </div>
  );
};
