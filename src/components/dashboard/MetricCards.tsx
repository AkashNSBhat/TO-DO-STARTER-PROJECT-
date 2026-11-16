import React from "react";
import { CheckCircle2, Clock, Film, Tv } from "lucide-react";
import { Card } from "../common/Card";

export interface MetricCardsProps {
  completedTasksToday: number;
  pendingTasksToday: number;
  totalMoviesWatched: number;
  activeSeriesCount: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  completedTasksToday,
  pendingTasksToday,
  totalMoviesWatched,
  activeSeriesCount,
}) => {
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
      detail: "Finished deliverables",
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
      detail: "Awaiting action today",
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
      detail: "Archived & logged",
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
      detail: "Ongoing seasons",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const IconComponent = m.icon;
        return (
          <Card
            key={m.id}
            className="p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-charcoal-500 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {m.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${m.bgColor} border ${m.borderColor} flex items-center justify-center ${m.iconColor}`}
              >
                <IconComponent className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {m.value}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {m.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {m.detail}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
