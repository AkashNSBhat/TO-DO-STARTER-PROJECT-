import React from "react";
import { Flame, Sparkles } from "lucide-react";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Date Greeting & Hero Banner */}
      <Card className="lg:col-span-8 p-6 relative overflow-hidden bg-gradient-to-r from-white via-slate-50 to-white dark:from-charcoal-800 dark:via-charcoal-850 dark:to-charcoal-800 border-slate-200 dark:border-charcoal-600">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 select-none">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              DAYMARK
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Offline First • Desktop OS
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

          {/* Dual Progress Bars: Year & Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-charcoal-900/60 border border-slate-200/80 dark:border-charcoal-700/60">
              <ProgressBar
                value={yearProgressPct}
                max={100}
                label="2026 Year Progress"
                variant="emerald"
                size="md"
                showPercent
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-charcoal-900/60 border border-slate-200/80 dark:border-charcoal-700/60">
              <ProgressBar
                value={monthProgressPct}
                max={100}
                label="November Progress"
                variant="teal"
                size="md"
                showPercent
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Streak Counter Tile with Warm Amber Flame (#f59e0b) */}
      <Card className="lg:col-span-4 p-6 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-white to-white dark:via-charcoal-800 dark:to-charcoal-800 border-amber-500/30 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
              Activity Streak
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {streakCount}
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                DAYS ACTIVE
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <Flame className="w-8 h-8 fill-amber-500 text-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80 dark:border-charcoal-700/80 mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Consistency Target</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Maintain your daily rhythm to preserve your streak record.
          </p>
        </div>
      </Card>
    </div>
  );
};
