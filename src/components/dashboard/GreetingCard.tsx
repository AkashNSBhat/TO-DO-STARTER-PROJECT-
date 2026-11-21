import React, { useState } from "react";
import { Flame, Sparkles, Zap, Calendar } from "lucide-react";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";
import { cn } from "../../lib/utils";

export interface GreetingCardProps {
  greeting: string;
  streakCount: number;
  yearProgressPct: number;
  monthProgressPct: number;
}

export const GreetingCard: React.FC<GreetingCardProps> = ({
  greeting,
  streakCount,
  yearProgressPct,
  monthProgressPct,
}) => {
  const [hoveredProgress, setHoveredProgress] = useState<"year" | "month" | null>(null);
  const [isStreakHovered, setIsStreakHovered] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Date Greeting & Hero Banner */}
      <Card className="lg:col-span-8 p-6 relative overflow-hidden bg-gradient-to-r from-white via-slate-50 to-white dark:from-charcoal-800 dark:via-charcoal-850 dark:to-charcoal-800 border-slate-200 dark:border-charcoal-600 transition-all duration-300">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 select-none">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              DAYMARK
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Desktop OS
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {greeting || "It's Monday, November 16, 2026"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Every day counts. Every completion stays. Track your deliverables, focus on what matters, and preserve your momentum.
            </p>
          </div>

          {/* Dual Progress Bars: Year & Month with Interactive Hover Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div
              onMouseEnter={() => setHoveredProgress("year")}
              onMouseLeave={() => setHoveredProgress(null)}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 border cursor-pointer select-none",
                hoveredProgress === "year"
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-xs scale-[1.02]"
                  : "bg-slate-100/70 dark:bg-charcoal-900/60 border-slate-200/80 dark:border-charcoal-700/60"
              )}
            >
              <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  2026 Year Progress
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {hoveredProgress === "year" ? "Day 325 / 365" : `${yearProgressPct}%`}
                </span>
              </div>
              <ProgressBar
                value={yearProgressPct}
                max={100}
                variant="emerald"
                size="md"
              />
            </div>

            <div
              onMouseEnter={() => setHoveredProgress("month")}
              onMouseLeave={() => setHoveredProgress(null)}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 border cursor-pointer select-none",
                hoveredProgress === "month"
                  ? "bg-teal-500/10 border-teal-500/30 shadow-xs scale-[1.02]"
                  : "bg-slate-100/70 dark:bg-charcoal-900/60 border-slate-200/80 dark:border-charcoal-700/60"
              )}
            >
              <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-teal-500" />
                  November Progress
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">
                  {hoveredProgress === "month" ? "Day 21 / 30" : `${monthProgressPct}%`}
                </span>
              </div>
              <ProgressBar
                value={monthProgressPct}
                max={100}
                variant="teal"
                size="md"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Streak Counter Tile with Interactive Hover Reaction */}
      <div
        onMouseEnter={() => setIsStreakHovered(true)}
        onMouseLeave={() => setIsStreakHovered(false)}
        className={cn(
          "lg:col-span-4 p-6 rounded-2xl relative overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer select-none",
          isStreakHovered
            ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent dark:bg-[#1f1d18] border-amber-500/60 -translate-y-2 scale-[1.03] shadow-2xl shadow-amber-500/20"
            : "bg-gradient-to-br from-amber-500/10 via-white to-white dark:via-charcoal-800 dark:to-charcoal-800 border-amber-500/30"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                Activity Streak
              </span>
              {isStreakHovered && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-in fade-in zoom-in-90">
                  Momentum 🔥
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight group-hover:scale-105 transition-transform">
                {streakCount}
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                DAYS ACTIVE
              </span>
            </div>
          </div>
          <div
            className={cn(
              "w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shrink-0 transition-all duration-300",
              isStreakHovered ? "scale-115 rotate-6 shadow-amber-500/30 shadow-md" : ""
            )}
          >
            <Flame className="w-8 h-8 fill-amber-500 text-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80 dark:border-charcoal-700/80 mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Consistency Target</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isStreakHovered
              ? "Flame burning bright! 14 days and counting without missing a beat."
              : "Maintain your daily rhythm to preserve your streak record."}
          </p>
        </div>
      </div>
    </div>
  );
};
