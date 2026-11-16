import React from "react";
import { Target, FileText } from "lucide-react";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";

export interface TodayGoalsCardProps {
  goals: {
    targetTasksCount: number;
    notes: string;
  };
  completedCount: number;
}

export const TodayGoalsCard: React.FC<TodayGoalsCardProps> = ({
  goals,
  completedCount,
}) => {
  const target = Math.max(1, goals.targetTasksCount);
  const percent = Math.min(100, Math.round((completedCount / target) * 100));

  return (
    <Card
      title="Today's Goals"
      subtitle="Focus targets and strategic intentions"
      action={
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
          <Target className="w-4 h-4" />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Goal Metric & Progress Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-charcoal-900/60 border border-slate-200/80 dark:border-charcoal-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Daily Target</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {completedCount} / {goals.targetTasksCount} tasks ({percent}%)
            </span>
          </div>

          <ProgressBar
            value={completedCount}
            max={target}
            variant="teal"
            size="md"
          />
        </div>

        {/* Notes block */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Focus Strategy & Notes</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-charcoal-850/60 border border-slate-200/70 dark:border-charcoal-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
            {goals.notes || "No daily notes entered. Set your strategic targets for maximum impact."}
          </div>
        </div>
      </div>
    </Card>
  );
};
