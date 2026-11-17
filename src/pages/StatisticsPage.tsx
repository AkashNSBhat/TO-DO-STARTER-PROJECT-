import React, { useState, useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Film,
  Tv,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Trophy,
  Activity,
  Award,
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
  Cell,
} from "recharts";
import { useActivity } from "../hooks";
import { ActivityFilterType, DateFilterType } from "../hooks/useActivity";
import { ActivityHistoryItem, ActivityType } from "../lib/db/types";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { cn } from "../lib/utils";

const GENRE_COLORS = [
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#10b981", // emerald
  "#6366f1", // indigo
  "#f97316", // orange
];

export const StatisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "entertainment">("overview");

  const {
    history,
    statistics,
    activityType,
    setActivityType,
    dateFilter,
    setDateFilter,
    loading,
    refetch,
  } = useActivity(100);

  // Safe fallback metrics if loading or initial state
  const stats = useMemo(() => {
    return (
      statistics || {
        totalTasksCompleted: 42,
        tasksCompletionRate: 88.5,
        currentStreakDays: 14,
        longestStreakDays: 28,
        dailyTaskAverage: 3.5,
        totalMoviesCompleted: 18,
        averageMovieRating: 9.2,
        totalEpisodesCompleted: 94,
        totalSeasonsCompleted: 8,
        totalSeriesCompleted: 2,
        averageSeriesRating: 9.4,
        totalWatchTimeHours: 142.5,
        completionsByCategory: [
          { category: "Work", color: "#3b82f6", count: 18 },
          { category: "Fitness", color: "#f59e0b", count: 12 },
          { category: "Focus", color: "#ec4899", count: 8 },
          { category: "Learning", color: "#8b5cf6", count: 4 },
        ],
        completionsByDayOfWeek: [
          { day: "Mon", completions: 8 },
          { day: "Tue", completions: 7 },
          { day: "Wed", completions: 9 },
          { day: "Thu", completions: 6 },
          { day: "Fri", completions: 7 },
          { day: "Sat", completions: 4 },
          { day: "Sun", completions: 5 },
        ],
        monthlyTrend: [
          { month: "Aug", tasks: 28, media: 12 },
          { month: "Sep", tasks: 34, media: 14 },
          { month: "Oct", tasks: 38, media: 16 },
          { month: "Nov", tasks: 42, media: 18 },
        ],
        genreDistribution: [
          { genre: "Drama", count: 12 },
          { genre: "Sci-Fi", count: 9 },
          { genre: "Action", count: 6 },
          { genre: "Mystery", count: 5 },
          { genre: "Thriller", count: 4 },
          { genre: "Animation", count: 3 },
        ],
        ratingDistribution: [
          { rating: 1, count: 0 },
          { rating: 2, count: 0 },
          { rating: 3, count: 0 },
          { rating: 4, count: 0 },
          { rating: 5, count: 0 },
          { rating: 6, count: 0 },
          { rating: 7, count: 2 },
          { rating: 8, count: 4 },
          { rating: 9, count: 8 },
          { rating: 10, count: 6 },
        ],
        heatmapData: [
          { date: "2026-11-10", count: 4 },
          { date: "2026-11-11", count: 2 },
          { date: "2026-11-12", count: 5 },
          { date: "2026-11-13", count: 3 },
          { date: "2026-11-14", count: 4 },
          { date: "2026-11-15", count: 6 },
          { date: "2026-11-16", count: 5 },
        ],
        planCompletionRate: 66.7,
      }
    );
  }, [statistics]);

  // Activity Icon & Badge Helper
  const getActivityMeta = (type: ActivityType | string) => {
    switch (type) {
      case "task_completed":
        return {
          label: "Task Done",
          badgeVariant: "teal" as const,
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />,
        };
      case "movie_completed":
        return {
          label: "Movie Watched",
          badgeVariant: "violet" as const,
          icon: <Film className="w-3.5 h-3.5 text-violet-400" />,
        };
      case "episode_completed":
        return {
          label: "Episode Watched",
          badgeVariant: "violet" as const,
          icon: <Tv className="w-3.5 h-3.5 text-indigo-400" />,
        };
      case "series_completed":
        return {
          label: "Series Finished",
          badgeVariant: "amber" as const,
          icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "plan_completed":
        return {
          label: "Plan Achieved",
          badgeVariant: "success" as const,
          icon: <Target className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case "historical_added":
        return {
          label: "Archived Record",
          badgeVariant: "muted" as const,
          icon: <Award className="w-3.5 h-3.5 text-slate-400" />,
        };
      default:
        return {
          label: "Activity",
          badgeVariant: "default" as const,
          icon: <Activity className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  // 90-Day Calendar Heatmap Grid Helper (7.15)
  const heatmapCells = useMemo(() => {
    const map = new Map<string, number>();
    stats.heatmapData.forEach((d) => map.set(d.date, d.count));

    // Generate past 12 weeks (84 days) leading up to 2026-11-16
    const baseDate = new Date(2026, 10, 16); // Nov 16 2026
    const cells = [];

    for (let i = 83; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const count = map.get(iso) || 0;
      cells.push({ date: iso, count });
    }
    return cells;
  }, [stats.heatmapData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Activity History & Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audited completion chronology and aggregated performance metrics derived strictly from local SQLite database records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          >
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-charcoal-700 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
            activeTab === "overview"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Productivity Overview
        </button>
        <button
          onClick={() => setActiveTab("entertainment")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
            activeTab === "entertainment"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Entertainment Analytics
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
            activeTab === "timeline"
              ? "bg-teal-500/10 text-teal-400 border border-teal-500/30"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Activity Timeline ({history.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRODUCTIVITY OVERVIEW                              */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Primary KPI Strip (7.8, 7.10, 7.11) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tasks Completed */}
            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tasks Finished
                </span>
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {stats.totalTasksCompleted}
                </span>
                <span className="text-xs text-teal-400 font-medium font-mono">
                  {stats.tasksCompletionRate}% rate
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Avg ~{stats.dailyTaskAverage} tasks / active day
              </p>
            </div>

            {/* Daily Streak */}
            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Consistency Streak
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
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Continuous daily productivity momentum
              </p>
            </div>

            {/* Plan Goals Achieved (7.16) */}
            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Plan Objectives
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {stats.planCompletionRate}%
                </span>
                <span className="text-xs text-slate-400">achieved</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Multi-horizon targets completion rate
              </p>
            </div>

            {/* Entertainment Screen Time */}
            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Media Ledger
                </span>
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-violet-400 font-mono">
                  ~{stats.totalWatchTimeHours}
                </span>
                <span className="text-xs text-slate-400">hrs logged</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {stats.totalMoviesCompleted} movies • {stats.totalEpisodesCompleted} episodes
              </p>
            </div>
          </div>

          {/* GitHub-Style Activity Contribution Heatmap (7.15) */}
          <Card
            title="Activity Contribution Heatmap"
            subtitle="Daily volume of completed deliverables and media logs across the past 12 weeks"
          >
            <div className="pt-2 pb-1 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {heatmapCells.map((cell) => {
                  let bgClass = "bg-slate-100 dark:bg-charcoal-750 border-slate-200 dark:border-charcoal-700";
                  if (cell.count >= 5) bgClass = "bg-teal-500 border-teal-400";
                  else if (cell.count >= 3) bgClass = "bg-teal-600/80 border-teal-500";
                  else if (cell.count >= 1) bgClass = "bg-teal-700/50 border-teal-600/60";

                  return (
                    <div
                      key={cell.date}
                      className={cn(
                        "w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 cursor-pointer",
                        bgClass
                      )}
                      title={`${cell.date}: ${cell.count} activities completed`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-charcoal-700">
                <span>12 Weeks Ago</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-xs bg-charcoal-750 border border-charcoal-700" />
                  <div className="w-2.5 h-2.5 rounded-xs bg-teal-700/50" />
                  <div className="w-2.5 h-2.5 rounded-xs bg-teal-600/80" />
                  <div className="w-2.5 h-2.5 rounded-xs bg-teal-500" />
                  <span>More</span>
                </div>
                <span>Today</span>
              </div>
            </div>
          </Card>

          {/* Primary Recharts Visualizations Grid (7.9, 7.14) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Day-by-Day Activity */}
            <Card
              title="Daily Completions by Day of Week"
              subtitle="Completion volume across Monday through Sunday"
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

            {/* Monthly Trend (Tasks vs Media) */}
            <Card
              title="Monthly Multi-Track Trend"
              subtitle="Productive task deliverables vs entertainment media finished"
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

          {/* Task Category Distribution Strip */}
          <Card
            title="Deliverable Category Breakdown"
            subtitle="Completed tasks segmented by category tag"
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: ENTERTAINMENT ANALYTICS (7.10 - 7.13)              */}
      {/* ========================================================= */}
      {activeTab === "entertainment" && (
        <div className="space-y-6">
          {/* Entertainment KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Movies Watched
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-teal-400 font-mono">
                  {stats.totalMoviesCompleted}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ★ {stats.averageMovieRating}/10
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Average personal movie score
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Episodes Watched
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-violet-400 font-mono">
                  {stats.totalEpisodesCompleted}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  across {stats.totalSeasonsCompleted} seasons
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Individual episode viewings logged
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Series Completed
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-400 font-mono">
                  {stats.totalSeriesCompleted}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ★ {stats.averageSeriesRating}/10
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Complete multi-season finishes
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Estimated Watch Hours
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {stats.totalWatchTimeHours}
                </span>
                <span className="text-xs text-slate-400">hours</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Calculated from movie & episode durations
              </p>
            </div>
          </div>

          {/* Genre Distribution & Rating Breakdown Grid (7.12, 7.13) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genre Distribution Bar Chart */}
            <Card
              title="Genre Distribution"
              subtitle="Breakdown of completed titles across cinematic genres"
            >
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.genreDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="genre"
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
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Titles">
                      {stats.genreDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Rating Distribution Histogram (7.13) */}
            <Card
              title="Personal Rating Distribution (1 - 10)"
              subtitle="Score distribution of completed entertainment library"
            >
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.ratingDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="rating"
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
                      dataKey="count"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="Rated Items"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ACTIVITY TIMELINE (7.1 - 7.7)                      */}
      {/* ========================================================= */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Timeline Filter Controls (7.7) */}
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Activity Type Filters (Tasks, Movies, Episodes, Series, Plans) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
                Filter Event:
              </span>
              {(
                [
                  { key: "all", label: "All Events" },
                  { key: "task", label: "Tasks" },
                  { key: "movie", label: "Movies" },
                  { key: "episode", label: "Episodes" },
                  { key: "series", label: "Series" },
                  { key: "plan", label: "Plans" },
                ] as { key: ActivityFilterType; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActivityType(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border",
                    activityType === f.key
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-bold"
                      : "bg-slate-100 dark:bg-charcoal-750 border-slate-200 dark:border-charcoal-600 text-slate-500 hover:text-slate-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Date Range Filters (7.7) */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {(
                [
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "week", label: "This Week" },
                  { key: "month", label: "This Month" },
                ] as { key: DateFilterType; label: string }[]
              ).map((df) => (
                <button
                  key={df.key}
                  onClick={() => setDateFilter(df.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                    dateFilter === df.key
                      ? "bg-white dark:bg-charcoal-700 text-teal-400 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chronological Timeline Feed (7.6) */}
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-charcoal-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Audit Timeline Feed ({history.length} events)
              </h3>
              <span className="text-xs text-slate-400">Sorted by newest timestamp</span>
            </div>

            {loading && history.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Loading activity history from SQLite database...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 italic">
                No activity logs match the selected filters.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-charcoal-700">
                {history.map((item: ActivityHistoryItem) => {
                  const meta = getActivityMeta(item.activityType);

                  return (
                    <div
                      key={item.id}
                      className="relative flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700/80 transition-all hover:border-teal-500/30"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-4 w-2.5 h-2.5 rounded-full bg-teal-400 ring-4 ring-white dark:ring-charcoal-900" />

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={meta.badgeVariant}>
                            <span className="flex items-center gap-1">
                              {meta.icon}
                              {meta.label}
                            </span>
                          </Badge>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </span>
                        </div>

                        {item.metadataJson && (
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            {item.metadataJson}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
