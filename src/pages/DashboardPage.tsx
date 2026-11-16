import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useDashboard } from "../hooks";
import { DashboardData } from "../lib/db/types";
import { Button } from "../components/common/Button";
import {
  GreetingCard,
  MetricCards,
  DailyChecklist,
  TodayGoalsCard,
  ScheduleTimeline,
  ActivitySplineChart,
  DashboardSkeleton,
} from "../components/dashboard";

export interface DashboardPageProps {
  initialData?: DashboardData;
  onNavigateToTasks?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  initialData,
  onNavigateToTasks,
}) => {
  const {
    data: hookData,
    loading,
    error,
    refetch,
    toggleChecklistItem,
  } = useDashboard();

  const data = initialData ?? hookData;

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Unable to load Dashboard
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => refetch()}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Greeting & Streak Hero Banner with Dual Year/Month Progress Bars */}
      <GreetingCard
        greeting={data.greeting}
        streakCount={data.streakCount}
        yearProgressPct={data.yearProgressPct}
        monthProgressPct={data.monthProgressPct}
      />

      {/* 2. Four Key Summary Metric Cards */}
      <MetricCards
        completedTasksToday={data.metrics.completedTasksToday}
        pendingTasksToday={data.metrics.pendingTasksToday}
        totalMoviesWatched={data.metrics.totalMoviesWatched}
        activeSeriesCount={data.metrics.activeSeriesCount}
      />

      {/* 3. Main Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (span 7 or 8): Daily Checklist & Activity Spline */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <DailyChecklist
            items={data.dailyChecklist}
            onToggle={toggleChecklistItem}
            onViewAll={onNavigateToTasks}
          />
          <ActivitySplineChart data={data.activitySpline} />
        </div>

        {/* Right Column (span 5 or 4): Today's Goals & Schedule Time Slots */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <TodayGoalsCard
            goals={data.todayGoals}
            completedCount={data.metrics.completedTasksToday}
          />
          <ScheduleTimeline slots={data.scheduleSlots} />
        </div>
      </div>
    </div>
  );
};
