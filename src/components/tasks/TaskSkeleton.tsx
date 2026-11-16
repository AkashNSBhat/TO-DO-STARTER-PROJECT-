import React from "react";
import { Card } from "../common/Card";

export const TaskSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-slate-200 dark:bg-charcoal-700 rounded-lg" />
          <div className="h-3.5 w-64 bg-slate-200 dark:bg-charcoal-700 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-charcoal-700 rounded-lg" />
      </div>

      {/* Tabs Skeleton */}
      <div className="h-10 w-96 max-w-full bg-slate-200 dark:bg-charcoal-700 rounded-full" />

      {/* Task Cards Skeleton */}
      <div className="space-y-2.5 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-charcoal-700 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/5 bg-slate-200 dark:bg-charcoal-700 rounded" />
                <div className="h-3 w-2/5 bg-slate-200 dark:bg-charcoal-700 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
              <div className="h-5 w-14 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
