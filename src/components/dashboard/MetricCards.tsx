import React, { useState } from "react";
import { CheckCircle2, Clock, Film, Tv, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MetricCardsProps {
  completedTasksToday: number;
  pendingTasksToday: number;
  totalMoviesWatched: number;
  activeSeriesCount: number;
  onSelectMetric?: (metricId: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  completedTasksToday,
  pendingTasksToday,
  totalMoviesWatched,
  activeSeriesCount,
  onSelectMetric,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalTasks = completedTasksToday + pendingTasksToday;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasksToday / totalTasks) * 100) : 0;

  const metrics = [
    {
      id: "completed-tasks",
      title: "Completed Tasks",
      value: completedTasksToday,
      unit: "today",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500",
      hoverGlow: "from-emerald-500/20 via-teal-500/10 to-transparent",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      badgeText: "text-emerald-600 dark:text-emerald-400",
      progressBarBg: "bg-emerald-500",
      detail: "Finished deliverables",
      hoverAction: "View Completed Tasks",
      hoverPill: `${taskCompletionRate}% done today`,
      progressPct: taskCompletionRate,
    },
    {
      id: "pending-tasks",
      title: "Pending Tasks",
      value: pendingTasksToday,
      unit: "remaining",
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      borderHover: "hover:border-amber-400 dark:hover:border-amber-500",
      hoverGlow: "from-amber-500/20 via-orange-500/10 to-transparent",
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
      badgeText: "text-amber-600 dark:text-amber-400",
      progressBarBg: "bg-amber-500",
      detail: "Awaiting action today",
      hoverAction: "Open Daily Checklist",
      hoverPill: `${pendingTasksToday} queued`,
      progressPct: totalTasks > 0 ? Math.round((pendingTasksToday / totalTasks) * 100) : 0,
    },
    {
      id: "movies-watched",
      title: "Movies Watched",
      value: totalMoviesWatched,
      unit: "films",
      icon: Film,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
      borderHover: "hover:border-violet-400 dark:hover:border-violet-500",
      hoverGlow: "from-violet-500/20 via-purple-500/10 to-transparent",
      badgeBg: "bg-violet-500/10 dark:bg-violet-500/20",
      badgeText: "text-violet-600 dark:text-violet-400",
      progressBarBg: "bg-violet-500",
      detail: "Archived & logged",
      hoverAction: "Explore Movie Tracker",
      hoverPill: "Movie Library",
      progressPct: Math.min(100, Math.max(15, totalMoviesWatched * 8)),
    },
    {
      id: "active-series",
      title: "Active Series",
      value: activeSeriesCount,
      unit: "in progress",
      icon: Tv,
      iconColor: "text-teal-500",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
      borderHover: "hover:border-teal-400 dark:hover:border-teal-500",
      hoverGlow: "from-teal-500/20 via-cyan-500/10 to-transparent",
      badgeBg: "bg-teal-500/10 dark:bg-teal-500/20",
      badgeText: "text-teal-600 dark:text-teal-400",
      progressBarBg: "bg-teal-500",
      detail: "Ongoing seasons",
      hoverAction: "Track Series Episodes",
      hoverPill: "Active Seasons",
      progressPct: Math.min(100, Math.max(20, activeSeriesCount * 25)),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const IconComponent = m.icon;
        const isHovered = hoveredId === m.id;
        const isAnyHovered = hoveredId !== null;
        const isDimmed = isAnyHovered && !isHovered;

        return (
          <div
            key={m.id}
            onMouseEnter={() => setHoveredId(m.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectMetric?.(m.id)}
            className={cn(
              "group relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none",
              isHovered
                ? "bg-white dark:bg-[#181a20] -translate-y-2 scale-[1.03] shadow-2xl z-10"
                : isDimmed
                ? "bg-white/80 dark:bg-charcoal-800/60 border-slate-200/60 dark:border-charcoal-700/60 opacity-65 scale-[0.98]"
                : "bg-white dark:bg-charcoal-800 border-slate-200/80 dark:border-charcoal-700/80 hover:shadow-md",
              m.borderHover
            )}
          >
            {/* Dynamic Glowing Background on Hover */}
            <div
              className={cn(
                "absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-opacity duration-300 bg-gradient-to-br",
                m.hoverGlow,
                isHovered ? "opacity-100 scale-125" : "opacity-0"
              )}
            />

            <div className="relative z-10 space-y-3">
              {/* Top Header Strip: Title, Badge / Hover Pill & Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {m.title}
                </span>

                <div className="flex items-center gap-2">
                  {/* Popping Status Pill on Hover */}
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 shrink-0",
                      m.badgeBg,
                      m.badgeText,
                      isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 sm:opacity-100 sm:translate-y-0"
                    )}
                  >
                    {m.hoverPill}
                  </span>

                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300",
                      m.bgColor,
                      m.borderColor,
                      m.iconColor,
                      isHovered && "scale-115 rotate-6 shadow-sm"
                    )}
                  >
                    <IconComponent className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </div>
              </div>

              {/* Metric Value & Unit */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight group-hover:scale-105 transition-transform inline-block">
                    {m.value}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {m.unit}
                  </span>
                </div>

                {/* Dynamic Detail Text vs Hover Action Prompt */}
                <div className="mt-2 min-h-[18px]">
                  {isHovered ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 animate-in fade-in slide-in-from-left-2 duration-150">
                      <span>{m.hoverAction}</span>
                      <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {m.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Animated Progress Line on Hover */}
            <div className="relative z-10 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="w-full bg-slate-100 dark:bg-charcoal-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    m.progressBarBg
                  )}
                  style={{ width: `${isHovered ? m.progressPct : Math.max(10, m.progressPct * 0.7)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
