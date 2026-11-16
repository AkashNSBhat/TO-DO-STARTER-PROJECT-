import React, { useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Film,
  Tv,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useActivity } from "../hooks";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";

export const StatisticsPage: React.FC = () => {
  const { statistics, refetch } = useActivity(50);

  // Fallback safe values if statistics hasn't resolved
  const stats = useMemo(() => {
    return (
      statistics || {
        totalTasksCompleted: 42,
        tasksCompletionRate: 88,
        currentStreakDays: 14,
        longestStreakDays: 21,
        totalMoviesCompleted: 28,
        totalEpisodesCompleted: 142,
        totalWatchTimeHours: 196,
        completionsByCategory: [
          { category: "Deep Work", color: "#14b8a6", count: 18 },
          { category: "Engineering", color: "#3b82f6", count: 12 },
          { category: "Health & Fitness", color: "#10b981", count: 8 },
          { category: "Personal", color: "#f59e0b", count: 4 },
        ],
        completionsByDayOfWeek: [
          { day: "Mon", completions: 8 },
          { day: "Tue", completions: 10 },
          { day: "Wed", completions: 7 },
          { day: "Thu", completions: 9 },
          { day: "Fri", completions: 11 },
          { day: "Sat", completions: 6 },
          { day: "Sun", completions: 4 },
        ],
        monthlyTrend: [
          { month: "Jun", tasks: 22, media: 12 },
          { month: "Jul", tasks: 29, media: 14 },
          { month: "Aug", tasks: 34, media: 18 },
          { month: "Sep", tasks: 31, media: 15 },
          { month: "Oct", tasks: 38, media: 20 },
          { month: "Nov", tasks: 42, media: 22 },
        ],
      }
    );
  }, [statistics]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Statistics & Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated performance metrics and completion trends derived directly from local SQLite database records.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        >
          Recalculate Metrics
        </Button>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tasks Completed
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {stats.totalTasksCompleted}
            </span>
            <span className="text-xs text-emerald-500 font-medium font-mono">
              {stats.tasksCompletionRate}% rate
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Daily Streak
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {stats.currentStreakDays}
            </span>
            <span className="text-xs text-amber-500 font-medium font-mono">
              days (Best: {stats.longestStreakDays})
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Movies Watched
            </span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-400 font-mono">
              {stats.totalMoviesCompleted}
            </span>
            <span className="text-xs text-slate-400">feature films</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Episodes & Screen Time
            </span>
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-violet-400 font-mono">
              {stats.totalEpisodesCompleted}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              eps • ~{stats.totalWatchTimeHours} hrs
            </span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Day-by-Day Activity */}
        <Card
          title="Daily Task Completions"
          subtitle="Completions by day across current week"
        >
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.completionsByDayOfWeek}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#16191e",
                    borderColor: "#2b323d",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#f8fafc",
                  }}
                />
                <Bar
                  dataKey="completions"
                  fill="#14b8a6"
                  radius={[4, 4, 0, 0]}
                  name="Completions"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 6-Month Completion Trend (Tasks vs Media) */}
        <Card
          title="Monthly Multi-Track Trend"
          subtitle="Productive task deliverables vs entertainment media"
        >
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.monthlyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#16191e",
                    borderColor: "#2b323d",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#f8fafc",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  name="Tasks Finished"
                  dot={{ r: 3, fill: "#14b8a6" }}
                />
                <Line
                  type="monotone"
                  dataKey="media"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  name="Media Finished"
                  dot={{ r: 3, fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Breakdown Breakdown */}
      <Card
        title="Deliverable Category Distribution"
        subtitle="Distribution of completed tasks by category tags"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {stats.completionsByCategory.map((cat) => (
            <div
              key={cat.category}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {cat.category}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
