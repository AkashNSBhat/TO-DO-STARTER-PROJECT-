import React from "react";
import { Clock, Calendar } from "lucide-react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";

export interface ScheduleSlotItem {
  time: string;
  title: string;
  type: string;
}

export interface ScheduleTimelineProps {
  slots: ScheduleSlotItem[];
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ slots }) => {
  const getTypeBadgeVariant = (type: string): "default" | "teal" | "violet" | "amber" => {
    const lower = type.toLowerCase();
    if (lower.includes("meet") || lower.includes("sync")) return "amber";
    if (lower.includes("deep") || lower.includes("work") || lower.includes("focus")) return "teal";
    if (lower.includes("personal") || lower.includes("entertain") || lower.includes("break")) return "violet";
    return "default";
  };

  return (
    <Card
      title="Today's Schedule"
      subtitle="Time blocked agenda and milestones"
      action={
        <div className="w-8 h-8 rounded-lg bg-sage-500/10 border border-sage-500/20 flex items-center justify-center text-teal-500">
          <Calendar className="w-4 h-4" />
        </div>
      }
    >
      {slots.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No scheduled time blocks for today.
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-charcoal-700 before:pointer-events-none">
          {slots.map((slot, index) => (
            <div key={`${slot.time}-${index}`} className="flex items-start gap-3 relative z-10">
              {/* Bullet circle */}
              <div className="w-7 h-7 rounded-full bg-white dark:bg-charcoal-800 border-2 border-teal-500 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
              </div>

              {/* Slot content card */}
              <div className="flex-1 p-2.5 rounded-xl bg-slate-50/80 dark:bg-charcoal-850/60 border border-slate-200/70 dark:border-charcoal-700/60 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[11px] font-semibold text-teal-600 dark:text-teal-400 block">
                    {slot.time}
                  </span>
                  <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {slot.title}
                  </h5>
                </div>
                <Badge
                  variant={getTypeBadgeVariant(slot.type)}
                  pill
                  className="text-[10px] font-semibold uppercase tracking-wider shrink-0"
                >
                  {slot.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
