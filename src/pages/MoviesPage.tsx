import React from "react";
import { Film, Plus } from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";

export const MoviesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Phase 3 Target</Badge>
          <span className="text-xs text-slate-400">Database table: <code>movies</code> & <code>movie_genres</code> ready</span>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Add Movie
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-charcoal-700 pb-3 text-xs">
        <span className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-sage-400 font-semibold border border-charcoal-600">
          All Movies
        </span>
        <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer">
          Planned
        </span>
        <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer">
          Watching
        </span>
        <span className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer">
          Completed
        </span>
      </div>

      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-sage-500/10 text-sage-400 flex items-center justify-center mx-auto mb-4 border border-sage-500/20">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Personal Movie Tracker</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          The SQLite schema for Movies, Multi-Genre associations, Ratings /10, Watched dates, and Notes is fully configured and indexed. UI management arrives in Phase 3.
        </p>
      </Card>
    </div>
  );
};
