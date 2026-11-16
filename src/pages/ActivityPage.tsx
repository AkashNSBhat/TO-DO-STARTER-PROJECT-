import React, { useState, useMemo } from "react";
import {
  History,
  CheckSquare,
  Film,
  Tv,
  CalendarRange,
  Archive,
  Search,
  Clock,
  Calendar,
} from "lucide-react";
import { useActivity } from "../hooks";
import { ActivityHistoryItem, ActivityType } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { cn } from "../lib/utils";

export const ActivityPage: React.FC = () => {
  const { history, loading, refetch } = useActivity(100);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Map activity types to readable labels and visual icons
  const getActivityMeta = (type: ActivityType) => {
    switch (type) {
      case "task_completed":
        return {
          label: "Task Completed",
          icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
          badgeVariant: "success" as const,
          bgColor: "bg-emerald-500/10 border-emerald-500/20",
        };
      case "movie_completed":
        return {
          label: "Movie Watched",
          icon: <Film className="w-4 h-4 text-teal-400" />,
          badgeVariant: "teal" as const,
          bgColor: "bg-teal-500/10 border-teal-500/20",
        };
      case "episode_completed":
        return {
          label: "Episode Logged",
          icon: <Tv className="w-4 h-4 text-violet-400" />,
          badgeVariant: "muted" as const,
          bgColor: "bg-violet-500/10 border-violet-500/20",
        };
      case "series_completed":
        return {
          label: "Series Finished",
          icon: <Tv className="w-4 h-4 text-amber-400" />,
          badgeVariant: "amber" as const,
          bgColor: "bg-amber-500/10 border-amber-500/20",
        };
      case "plan_completed":
        return {
          label: "Plan Milestone",
          icon: <CalendarRange className="w-4 h-4 text-teal-400" />,
          badgeVariant: "teal" as const,
          bgColor: "bg-teal-500/10 border-teal-500/20",
        };
      case "historical_added":
        return {
          label: "Archived Past Media",
          icon: <Archive className="w-4 h-4 text-slate-400" />,
          badgeVariant: "default" as const,
          bgColor: "bg-slate-500/10 border-slate-500/20",
        };
      default:
        return {
          label: "Activity",
          icon: <History className="w-4 h-4 text-slate-400" />,
          badgeVariant: "default" as const,
          bgColor: "bg-slate-500/10 border-slate-500/20",
        };
    }
  };

  // Filter items
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (typeFilter !== "all" && item.activityType !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchEntity = item.entityType.toLowerCase().includes(q);
        if (!matchTitle && !matchEntity) return false;
      }
      return true;
    });
  }, [history, typeFilter, searchQuery]);

  // Group items by date bucket (Today, Yesterday, Older)
  const groupedTimeline = useMemo(() => {
    const groups: { label: string; items: ActivityHistoryItem[] }[] = [];
    const dateMap = new Map<string, ActivityHistoryItem[]>();

    for (const item of filteredHistory) {
      const dateKey = item.timestamp ? item.timestamp.slice(0, 10) : "Undated";
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(item);
    }

    dateMap.forEach((items, dateKey) => {
      let label = dateKey;
      if (dateKey === "2026-11-16") {
        label = "Today — Nov 16, 2026";
      } else if (dateKey === "2026-11-15") {
        label = "Yesterday — Nov 15, 2026";
      } else if (dateKey === "2026-11-14") {
        label = "Saturday — Nov 14, 2026";
      }
      groups.push({ label, items });
    });

    return groups;
  }, [filteredHistory]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Activity History
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chronological audit log of all completed tasks, logged episodes, finished movies, and planning achievements.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          icon={<Clock className="w-3.5 h-3.5" />}
        >
          Refresh Log
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-charcoal-700 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          {[
            { id: "all", label: "All Activity" },
            { id: "task_completed", label: "Tasks" },
            { id: "movie_completed", label: "Movies" },
            { id: "episode_completed", label: "Episodes" },
            { id: "plan_completed", label: "Plan Objectives" },
          ].map((tab) => {
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-charcoal-700 text-teal-600 dark:text-teal-400 font-bold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <Input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search chronological events..."
            icon={Search}
            clearable
            inputSize="sm"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-charcoal-800/50 border border-charcoal-700/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredHistory.length === 0 && (
        <Card className="text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            No activity records found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
            As you check off tasks, log episodes, and hit milestones, every completion event will automatically be recorded here.
          </p>
        </Card>
      )}

      {/* Chronological Timeline */}
      {!loading && groupedTimeline.length > 0 && (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-charcoal-700">
          {groupedTimeline.map((group) => (
            <div key={group.label} className="space-y-3 relative">
              {/* Date Header Anchor */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-charcoal-900 border-2 border-teal-500 flex items-center justify-center z-10">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <h3 className="text-xs font-bold font-mono tracking-wider text-teal-400 uppercase">
                  {group.label}
                </h3>
              </div>

              {/* Event items for this date */}
              <div className="ml-10 space-y-2.5">
                {group.items.map((event) => {
                  const meta = getActivityMeta(event.activityType);
                  const timeFormatted = event.timestamp
                    ? event.timestamp.slice(11, 16)
                    : "--:--";

                  return (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700/80 hover:border-teal-500/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                            meta.bgColor
                          )}
                        >
                          {meta.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {event.title}
                            </h4>
                            <Badge variant={meta.badgeVariant}>
                              {meta.label}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">
                            Entity: {event.entityType} • Permanent ID: {event.entityId}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-400">
                          {timeFormatted}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
