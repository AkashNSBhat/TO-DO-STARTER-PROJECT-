import React from "react";
import { CheckSquare, Flag, ArrowRight } from "lucide-react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { CircularCheckbox } from "../tasks/CircularCheckbox";

export interface DailyChecklistItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  isCompleted: boolean;
}

export interface DailyChecklistProps {
  items: DailyChecklistItem[];
  onToggle: (id: string, isCompleted: boolean) => void;
  onViewAll?: () => void;
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  items,
  onToggle,
  onViewAll,
}) => {
  const completedCount = items.filter((i) => i.isCompleted).length;

  const renderPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return (
          <Badge variant="danger" pill className="gap-1 font-semibold text-[10px] uppercase">
            <Flag className="w-2.5 h-2.5" />
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge variant="warning" pill className="gap-1 font-semibold text-[10px] uppercase">
            <Flag className="w-2.5 h-2.5" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="teal" pill className="gap-1 font-semibold text-[10px] uppercase">
            <Flag className="w-2.5 h-2.5" />
            Medium
          </Badge>
        );
      case "low":
      default:
        return (
          <Badge variant="muted" pill className="gap-1 font-semibold text-[10px] uppercase">
            <Flag className="w-2.5 h-2.5" />
            Low
          </Badge>
        );
    }
  };

  const renderCategoryBadge = (category: string) => {
    const lower = category.toLowerCase();
    let variant: "default" | "teal" | "violet" | "amber" = "default";
    if (lower.includes("learn") || lower.includes("entertain")) variant = "violet";
    else if (lower.includes("fit") || lower.includes("health")) variant = "amber";
    else if (lower.includes("focus") || lower.includes("work")) variant = "teal";

    return (
      <Badge variant={variant} pill className="text-[11px] font-medium">
        {category}
      </Badge>
    );
  };

  return (
    <Card
      title="Daily Checklist"
      subtitle={`${completedCount} of ${items.length} items completed`}
      action={
        onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )
      }
    >
      {items.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No items on today's checklist.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                item.isCompleted
                  ? "bg-slate-50/70 dark:bg-charcoal-850/50 border-slate-200/60 dark:border-charcoal-700/60 opacity-65"
                  : "bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-600 hover:border-slate-300 dark:hover:border-charcoal-500 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <CircularCheckbox
                  checked={item.isCompleted}
                  onToggle={(checked) => onToggle(item.id, checked)}
                  label={item.title}
                />
                <span
                  className={`text-sm font-medium truncate transition-colors ${
                    item.isCompleted
                      ? "line-through text-slate-400 dark:text-slate-500"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {renderCategoryBadge(item.category)}
                {renderPriorityBadge(item.priority)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
