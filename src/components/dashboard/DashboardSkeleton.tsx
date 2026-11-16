import React from "react";
import { Card } from "../common/Card";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-charcoal-700 rounded-full" />
          <div className="h-8 w-72 bg-slate-200 dark:bg-charcoal-700 rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-slate-200 dark:bg-charcoal-700 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="h-16 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
          </div>
        </Card>
        <Card className="lg:col-span-4 p-6 space-y-4">
          <div className="h-4 w-28 bg-slate-200 dark:bg-charcoal-700 rounded" />
          <div className="h-12 w-24 bg-slate-200 dark:bg-charcoal-700 rounded-lg" />
          <div className="h-16 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
        </Card>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 dark:bg-charcoal-700 rounded" />
              <div className="w-9 h-9 bg-slate-200 dark:bg-charcoal-700 rounded-xl" />
            </div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-charcoal-700 rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-charcoal-700 rounded" />
          </Card>
        ))}
      </div>

      {/* Main Multi-Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="h-5 w-40 bg-slate-200 dark:bg-charcoal-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
              ))}
            </div>
          </Card>
          <Card className="p-5 space-y-4">
            <div className="h-5 w-48 bg-slate-200 dark:bg-charcoal-700 rounded" />
            <div className="h-48 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
          </Card>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="h-5 w-32 bg-slate-200 dark:bg-charcoal-700 rounded" />
            <div className="h-20 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
          </Card>
          <Card className="p-5 space-y-4">
            <div className="h-5 w-36 bg-slate-200 dark:bg-charcoal-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-charcoal-900/60 rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
