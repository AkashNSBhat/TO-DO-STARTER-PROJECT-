import React from "react";
import { CheckCircle2, Clock, Calendar, CheckSquare, Sparkles } from "lucide-react";
import { Card } from "../common/Card";
import { TaskFilter } from "../../lib/db/types";

export interface TaskEmptyStateProps {
  filter: TaskFilter;
  onCreateTask?: () => void;
}

export const TaskEmptyState: React.FC<TaskEmptyStateProps> = ({ filter }) => {
  const getEmptyStateDetails = () => {
    switch (filter) {
      case "today":
        return {
          icon: CheckSquare,
          title: "All Caught Up for Today",
          description: "There are no pending tasks scheduled for today. Add a new task or take time to review upcoming horizons.",
          accent: "text-teal-500",
          bg: "bg-teal-500/10 border-teal-500/20",
        };
      case "upcoming":
        return {
          icon: Calendar,
          title: "No Upcoming Tasks",
          description: "Your schedule is clear for the days ahead. Plan ahead by adding future deliverables.",
          accent: "text-blue-500",
          bg: "bg-blue-500/10 border-blue-500/20",
        };
      case "overdue":
        return {
          icon: Sparkles,
          title: "Zero Overdue Deliverables",
          description: "Excellent execution! You have zero overdue tasks across all active projects.",
          accent: "text-emerald-500",
          bg: "bg-emerald-500/10 border-emerald-500/20",
        };
      case "completed":
        return {
          icon: CheckCircle2,
          title: "No Completed Tasks Yet",
          description: "Finish your daily checklist and check off tasks to build your activity history.",
          accent: "text-amber-500",
          bg: "bg-amber-500/10 border-amber-500/20",
        };
      case "all":
      default:
        return {
          icon: Clock,
          title: "No Tasks Found",
          description: "No tasks match the current filter selection.",
          accent: "text-slate-400",
          bg: "bg-slate-500/10 border-slate-500/20",
        };
    }
  };

  const details = getEmptyStateDetails();
  const IconComponent = details.icon;

  return (
    <Card className="text-center py-16 px-6">
      <div
        className={`w-14 h-14 rounded-2xl ${details.bg} ${details.accent} border flex items-center justify-center mx-auto mb-4`}
      >
        <IconComponent className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
        {details.title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
        {details.description}
      </p>
    </Card>
  );
};
